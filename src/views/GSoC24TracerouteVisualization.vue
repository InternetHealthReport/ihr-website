<script setup>
import { QInput, QIcon, QBtn, QSpinner, QRange, QCheckbox, QTable, QTd, QTr } from "quasar";
import { ref, inject, computed, watchEffect, watch } from "vue";
import { VNetworkGraph } from "v-network-graph";
import * as vNG from "v-network-graph";
import dagre from "dagre";
import RipeApi from "../plugins/RipeApi";

const atlas_api = inject("atlas_api");
const isLoading = ref(false);
const measurementID = ref("");
const nodes = ref({});
const edges = ref({});
const layoutNodes = ref({ nodes: {} });
const metaData = ref({});

const timeRange = ref({
    disable: true
});

const leftLabelValue = ref("");
const rightLabelValue = ref("");

const nodeSize = 15;
const highlightedEdges = ref({});

const selectedProbes = ref([]);
const allProbes = ref([]);

const probeDetailsMap = ref({});
const selectAllProbes = ref(true);

const selectedNode = ref(null);

const configs = vNG.defineConfigs({
    node: {
        selectable: true,
        normal: {
            radius: nodeSize / 2,
            color: (node) => {
                if (node.isProbe) return "green";
                if (node.isNonResponsive) return "gray";
                if (node.isLastHop) return "red";
                if (isPrivateIP(node.label)) return "purple";
                return "blue";
            }
        },
    },
    edge: {
        normal: {
            color: (edge) => highlightedEdges.value[`${edge.source}-${edge.target}`] ? "orange" : "#aaa",
            width: (edge) => highlightedEdges.value[`${edge.source}-${edge.target}`] ? 3 : 1,
            margin: 4,
            type: "curve",
            gap: 40,
        },
    },
});

function isPrivateIP(ip) {
    const privateRangesIPv4 = [
        { start: "10.0.0.0", end: "10.255.255.255" },
        { start: "172.16.0.0", end: "172.31.255.255" },
        { start: "192.168.0.0", end: "192.168.255.255" },
    ];

    const privateRangesIPv6 = [
        { start: "fc00::", end: "fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
        { start: "fe80::", end: "febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff" },
    ];

    const ipToLong = (ip) => {
        return ip.split(".").reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
    };

    const ipToBigInt = (ip) => {
        return BigInt(`0x${ip.split(":").map(part => part.padStart(4, "0")).join("")}`);
    };

    const ipLong = ip.includes(":") ? ipToBigInt(ip) : ipToLong(ip);

    const isPrivateIPv4 = privateRangesIPv4.some(range => {
        const start = ipToLong(range.start);
        const end = ipToLong(range.end);
        return ipLong >= start && ipLong <= end;
    });

    const isPrivateIPv6 = privateRangesIPv6.some(range => {
        const start = ipToBigInt(range.start);
        const end = ipToBigInt(range.end);
        return ipLong >= start && ipLong <= end;
    });

    return isPrivateIPv4 || isPrivateIPv6;
}

const calculateMedian = (values) => {
    if (!values || !values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const processData = (tracerouteData, loadProbes = false) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 290, edgesep: 150, ranksep: 1000 });
    g.setDefaultEdgeLabel(() => ({}));

    const nonResponsiveNodes = new Set();
    const outgoingEdges = new Map();

    tracerouteData.forEach((probeData, probeIndex) => {
        if (probeData.result[0].error) {
            return;
        }

        const sourceNodeId = probeData.from;
        if (!g.hasNode(sourceNodeId)) {
            g.setNode(sourceNodeId, { label: sourceNodeId, width: nodeSize, height: nodeSize, isProbe: true });
        }

        let lastNodeId = sourceNodeId;
        let finalHopNodeId = null;
        let consecutiveStarCount = 0;

        if (loadProbes) {
            if (!allProbes.value.includes(probeData.prb_id)) {
                allProbes.value.push(probeData.prb_id.toString());
                selectedProbes.value.push(probeData.prb_id.toString());
            }
            atlas_api.getProbeById(probeData.prb_id.toString()).then(data => probeDetailsMap.value[probeData.prb_id.toString()] = data);
        }

        probeData.result.forEach((hopData, hopIndex) => {
            hopData.result.forEach((result, resultIndex) => {
                let currentIp = result.from || result.x;
                let isNonResponsive = false;

                if (currentIp === "*") {
                    consecutiveStarCount++;
                    if (consecutiveStarCount > 1) return;
                    currentIp += `-${probeIndex}-${hopIndex}-${resultIndex}`;
                    isNonResponsive = true;
                    nonResponsiveNodes.add(currentIp);
                } else {
                    consecutiveStarCount = 0;
                }

                if (isPrivateIP(currentIp)) {
                    isNonResponsive = false;
                    consecutiveStarCount = 0;
                }

                const nodeInfo = g.node(currentIp) || {};
                const newNodeInfo = {
                    label: currentIp.replace(/-\d+-\d+-\d+$/, ""),
                    width: nodeSize,
                    height: nodeSize,
                    isNonResponsive,
                    hops: nodeInfo.hops || []
                };

                newNodeInfo.hops.push({
                    from: result.from,
                    rtt: result.rtt,
                    size: result.size,
                    ttl: result.ttl,
                });

                g.setNode(currentIp, newNodeInfo);

                if (lastNodeId && currentIp && lastNodeId !== currentIp && !g.hasEdge(currentIp, lastNodeId)) {
                    if (!g.hasEdge(lastNodeId, currentIp)) {
                        g.setEdge(lastNodeId, currentIp);
                        if (!outgoingEdges.has(lastNodeId)) {
                            outgoingEdges.set(lastNodeId, []);
                        }
                        outgoingEdges.get(lastNodeId).push(currentIp);
                    }
                }
                lastNodeId = currentIp;
                finalHopNodeId = currentIp;
            });
        });

        if (finalHopNodeId && g.hasNode(finalHopNodeId)) {
            const nodeInfo = g.node(finalHopNodeId);
            g.setNode(finalHopNodeId, { ...nodeInfo, isLastHop: true });
        }
    });

    nonResponsiveNodes.forEach(nodeId => {
        if (!outgoingEdges.has(nodeId)) {
            g.removeNode(nodeId);
        }
    });

    dagre.layout(g);

    const nodesMap = {};
    const edgesMap = {};
    const layouts = { nodes: {} };

    g.nodes().forEach(nodeId => {
        const nodeInfo = g.node(nodeId);
        nodesMap[nodeId] = { name: nodeInfo.label, ...nodeInfo };
        layouts.nodes[nodeId] = { x: nodeInfo.x, y: nodeInfo.y };
    });

    g.edges().forEach(edge => {
        const edgeInfo = g.edge(edge);
        edgesMap[`${edge.v}-${edge.w}`] = { source: edge.v, target: edge.w };
    });

    nodes.value = nodesMap;
    edges.value = edgesMap;
    layoutNodes.value = layouts;
};

const graph = ref();
const tooltip = ref();
const tooltipData = ref({});

const targetNodeId = ref("");
const tooltipOpacity = ref(0);
const tooltipPos = ref({ left: "0px", top: "0px" });

const NODE_RADIUS = 15;

const targetNodePos = computed(() => {
    const nodePos = layoutNodes.value.nodes[targetNodeId.value];
    return nodePos || { x: 0, y: 0 };
});

watch(
    () => [targetNodePos.value, tooltipOpacity.value],
    () => {
        if (!graph.value || !tooltip.value) return;
        const domPoint = graph.value.translateFromSvgToDomCoordinates(targetNodePos.value);
        tooltipPos.value = {
            left: domPoint.x - tooltip.value.offsetWidth / 2 + "px",
            top: domPoint.y - NODE_RADIUS - tooltip.value.offsetHeight - 10 + "px",
        };
    },
    { deep: true }
);

const eventHandlers = {
    "node:pointerover": ({ node }) => {
    },
    "node:pointerout": () => {
    },
    "view:click": () => {
        clearHighlight();
        tooltipOpacity.value = 0;
    },
    "node:pointerdown": async ({ node }) => {
        clearHighlight();
        highlightPath(node);
        
        selectedNode.value = node;
        targetNodeId.value = node;
        tooltipOpacity.value = 1;
        
        const nodeInfo = nodes.value[node];
        let nodeMetaData;
        if (!node.includes("*")) {
            nodeMetaData = await RipeApi.prefixOverview(node);            
        }
        const rttValues = nodeInfo.hops?.map(hop => hop.rtt);
        const sizeValues = nodeInfo.hops?.map(hop => hop.size);
        const ttlValues = nodeInfo.hops?.map(hop => hop.ttl);
        tooltipData.value = {
            label: nodeInfo.label,
            medianRtt: calculateMedian(rttValues),
            medianSize: calculateMedian(sizeValues),
            medianTtl: calculateMedian(ttlValues),
            ...nodeMetaData
        };
    },
};

const highlightPath = (startNodeId) => {
    const path = [];
    const visited = new Set();
    const queue = [[startNodeId, []]];

    while (queue.length > 0) {
        const [currentNodeId, currentPath] = queue.shift();

        if (visited.has(currentNodeId)) {
            continue;
        }

        visited.add(currentNodeId);
        currentPath.push(currentNodeId);

        const outgoingEdges = Object.values(edges.value).filter(edge => edge.source === currentNodeId);
        if (outgoingEdges.length === 0) {
            path.push(...currentPath.map((node, index) => {
                if (index < currentPath.length - 1) {
                    return `${node}-${currentPath[index + 1]}`;
                }
            }).filter(edge => edge));
            break;
        }

        outgoingEdges.forEach(edge => {
            if (!visited.has(edge.target)) {
                queue.push([edge.target, [...currentPath]]);
            }
        });
    }

    highlightedEdges.value = Object.fromEntries(path.map(edgeId => [edgeId, true]));
};

const clearHighlight = () => {
    highlightedEdges.value = {};
};

const loadMeasurement = async () => {
    if (measurementID.value.trim()) {
        isLoading.value = true;
        try {
            const fetchedMetaData = await atlas_api.getMeasurementById(measurementID.value);
            metaData.value = fetchedMetaData;

            timeRange.value.min = fetchedMetaData.start_time;
            timeRange.value.max = fetchedMetaData.stop_time;

            leftLabelValue.value = convertUnixTimestamp(fetchedMetaData.start_time);
            rightLabelValue.value = convertUnixTimestamp(fetchedMetaData.stop_time);

            timeRange.value.disable = false;

            await loadMeasurementData(true);
        } catch (error) {
            console.error("Failed to load measurement:", error);
        } finally {
            isLoading.value = false;
        }
    }
};

const loadMeasurementData = async (loadProbes = false) => {
    if (measurementID.value.trim()) {
        isLoading.value = true;
        try {
            if (loadProbes) {
                allProbes.value = [];
                selectedProbes.value = [];
            }

            const params = {};

            if (!timeRange.value.disable) {
                params.start_time = timeRange.value.min;
                params.stop_time = timeRange.value.max;
            }

            if (selectedProbes.value.length > 0) {
                params.probe_ids = selectedProbes.value.join(",");
            }

            const data = await atlas_api.getMeasurementData(measurementID.value, params);
            processData(data, loadProbes);
        } catch (error) {
            console.error("Failed to load measurement data:", error);
        } finally {
            isLoading.value = false;
        }
    }
};

const debouncedLoadMeasurementOnTimeRange = (e) => {
    leftLabelValue.value = convertUnixTimestamp(e.min);
    rightLabelValue.value = convertUnixTimestamp(e.max);
    loadMeasurementData();
};

function convertUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${month}, ${hours}:${minutes}`;
}

const minTime = computed(() => metaData.value?.start_time || 0);
const maxTime = computed(() => metaData.value?.stop_time || 0);

watchEffect(() => {
    if (selectedProbes.value.length > 0) {
        loadMeasurementData();
    }
});

watchEffect(() => {
    if (!timeRange.value.disable) {
        loadMeasurementData();
    }
});

const paginatedProbes = computed(() => {
    return allProbes.value.map(probe => ({
        probe,
        ...probeDetailsMap.value[probe]
    }));
});

const columns = [
    { name: "probe", align: "left", label: "Probe", field: "probe" },
    { name: "ipv4", align: "left", label: "IPv4 Address", field: "ipv4" },
    { name: "ipv6", align: "left", label: "IPv6 Address", field: "ipv6" },
    { name: "country_code", align: "left", label: "Country Code", field: "country_code" },
    { name: "asn_v4", align: "left", label: "ASN4", field: "asn_v4" },
    { name: "asn_v6", align: "left", label: "ASN6", field: "asn_v6" }
];

const toggleSelectAll = (value) => {
    if (value) {
        selectedProbes.value = allProbes.value;
    } else {
        selectedProbes.value = [];
    }
};

</script>


<template>
    <div class="main-container">
        <h1>Traceroute Visualization</h1>
        <QInput v-model="measurementID" @keyup.enter="loadMeasurement" placeholder="Enter RIPE ATLAS traceroute measurement ID">
            <template v-slot:prepend>
                <QIcon name="web" />
            </template>
            <QBtn round dense flat :ripple="false" no-caps size="22px" @click="loadMeasurement">
                <QIcon name="search" />
            </QBtn>
        </QInput>
        <div class="graph-container">
            <QSpinner v-if="isLoading" color="primary" />
            <VNetworkGraph ref="graph" :nodes="nodes" :edges="edges" :layouts="layoutNodes" :configs="configs"
                :event-handlers="eventHandlers" v-if="!isLoading" zoom-level="0" />
            <div v-if="selectedNode" ref="tooltip" class="tooltip" :style="{ ...tooltipPos, opacity: tooltipOpacity }">
                <div><strong>Median RTT:</strong> {{ tooltipData.medianRtt ? tooltipData.medianRtt + "ms" : "Not available"}}</div>
                <div><strong>Median Size:</strong> {{ tooltipData.medianSize ? tooltipData.medianSize + " bytes" : "Not available"}}</div>
                <div><strong>Median TTL:</strong> {{ tooltipData.medianTtl ?? "Not available"}}</div>
                <div><strong>Node:</strong> {{ tooltipData.label }}</div>
                <div><strong>AS:</strong> {{ tooltipData?.data?.asns[0]?.asn ? tooltipData.data.asns[0].asn + ` (${tooltipData.data.asns[0].holder})`: "Not available"}}</div>
                <div><strong>Announced:</strong> {{ tooltipData?.data?.announced ?? "Not available"}}</div>
                <div><strong>Prefix:</strong> {{ tooltipData?.data?.block?.resource ?? "Not available"}}</div>
                <div><strong>Description:</strong> {{ tooltipData?.data?.block?.desc ?? "Not available"}}</div>
                <div><strong>Name:</strong> {{ tooltipData?.data?.block?.name ?? "Not available"}}</div>
            </div>
        </div>
        <h3>Time range</h3>
        <div class="time-range">
            <QRange v-model="timeRange" :disable="timeRange.disable" :min="minTime" :max="maxTime"
                :left-label-value="leftLabelValue" :right-label-value="rightLabelValue" label-always
                drag-range @change="debouncedLoadMeasurementOnTimeRange" />
        </div>
        <div class="probe-selection">
            <h3>Select probes</h3>
            <QTable :rows="paginatedProbes" :columns="columns" row-key="probe">
                <template v-slot:header="props">
                    <QTr :props="props">
                        <QTd :props="props.colProps" v-for="col in props.cols" :key="col.name">
                            <template v-if="col.name === 'probe'">
                                <QCheckbox v-model="selectAllProbes" @update:model-value="toggleSelectAll" />
                            </template>
                            <template v-else>
                                {{ col.label }}
                            </template>
                        </QTd>
                    </QTr>
                </template>
                <template v-slot:body="props">
                    <QTr :props="props">
                        <QTd>
                            <QCheckbox v-model="selectedProbes" :val="props.row.probe" :label="props.row.probe" />
                        </QTd>
                        <QTd>{{ props.row.address_v4 }}</QTd>
                        <QTd>{{ props.row.address_v6 }}</QTd>
                        <QTd>{{ props.row.country_code }}</QTd>
                        <QTd>{{ props.row.asn_v4 }}</QTd>
                        <QTd>{{ props.row.asn_v6 }}</QTd>
                    </QTr>
                </template>
            </QTable>
        </div>
    </div>
</template>

<style scoped>
.main-container {
    padding: 2em;
}

.probe-selection {
    margin-bottom: 2em;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 1em;
}

.graph-container {
    margin-bottom: 3em;
    position: relative;
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 75vh;
    width: 100%;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
}

.tooltip {
    top: 0;
    left: 0;
    opacity: 0;
    position: absolute;
    width: 30em;
    display: grid;
    place-content: center;
    text-align: center;
    font-size: 12px;
    background-color: #fff0bd;
    border: 1px solid #ffb950;
    box-shadow: 2px 2px 2px #aaa;
    transition: opacity 0.2s linear;
    pointer-events: none;
}

.time-range {
    padding: 2em;
    width: 95vw;
    margin: 0 auto;
}
</style>
