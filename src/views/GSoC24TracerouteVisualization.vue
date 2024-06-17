<script setup>
import { QInput, QIcon, QBtn, QSpinner, QRange, QCheckbox } from "quasar";
import { ref, inject, computed, watchEffect, watch } from "vue";
import { VNetworkGraph } from "v-network-graph";
import * as vNG from "v-network-graph";
import dagre from "dagre";

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

const configs = vNG.defineConfigs({
    node: {
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

                if (!g.hasNode(currentIp)) {
                    g.setNode(currentIp, { label: currentIp.replace(/-\d+-\d+-\d+$/, ""), width: nodeSize, height: nodeSize, isNonResponsive });
                }

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
        targetNodeId.value = node;
        tooltipOpacity.value = 1;
        highlightPath(node);
    },
    "node:pointerout": () => {
        tooltipOpacity.value = 0;
        clearHighlight();
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
            <div ref="tooltip" class="tooltip" :style="{ ...tooltipPos, opacity: tooltipOpacity }">
                <div>{{ nodes[targetNodeId.value]?.name ?? "" }}</div>
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
            <div class="checkbox-grid">
                <div v-for="probe in allProbes" :key="probe">
                    <QCheckbox v-model="selectedProbes" :val="probe" :label="probe" />
                </div>
            </div>
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
    width: 80px;
    height: 36px;
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
    width: 97vw;
    margin: 0 auto;
}
</style>
