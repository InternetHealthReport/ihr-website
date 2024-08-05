<script setup>
import { QInput, QIcon, QBtn, QSpinner, QRange, QCheckbox, QTable, QTd, QTr, QRadio } from "quasar";
import { ref, inject, computed, watchEffect, watch, nextTick, onMounted } from "vue";
import { VNetworkGraph } from "v-network-graph";
import * as vNG from "v-network-graph";
import dagre from "dagre";
import RipeApi from "../plugins/RipeApi";
import { useRoute } from "vue-router";

const route = useRoute();

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
const searchQuery = ref("");

const selectedDestination = ref("all");
const allDestinations = ref([]);

const displayMode = ref("normal");

const maxMedianRtt = ref(200);

const minDisplayedRtt = ref(null);
const maxDisplayedRtt = ref(null);

const asnColors = ref({});
const asnList = ref([]);
const ipToAsnMap = ref({});

const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const assignAsnColors = () => {
    const colors = {};
    asnList.value.forEach(asn => {
        colors[asn] = getRandomColor();
    });
    asnColors.value = colors;
};

const configs = computed(() => {
    return vNG.defineConfigs({
        node: {
            selectable: true,
            normal: {
                radius: nodeSize / 2,
                color: (node) => {
                    if (displayMode.value === "rtt") {
                        if (node.hops && node.hops.length > 0) {
                            const medianRtt = calculateMedian(node.hops.map(hop => hop.rtt));
                            return rttColor(medianRtt);
                        } else {
                            return "black";
                        }
                    }
                    if (displayMode.value === "asn") {
                        const asn = ipToAsnMap.value[node.label] || "unknown";
                        return asnColors.value[asn] || "black";
                    }
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

const rttColor = (rtt) => {
    if (rtt === null || rtt === undefined) return "black";
    const normalized = Math.min(Math.max(rtt / maxDisplayedRtt.value, 0), 1);
    const green = Math.floor(255 * (1 - normalized));
    return `rgb(150, ${green}, 60)`;
};

const filteredAsnList = computed(() => {
    return asnList.value.filter(asn => asn && asnColors.value[asn]);
});

const processData = async (tracerouteData, loadProbes = false) => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "LR", nodesep: 290, edgesep: 150, ranksep: 1000 });
    g.setDefaultEdgeLabel(() => ({}));

    const nonResponsiveNodes = new Set();
    const outgoingEdges = new Map();
    let highestMedianRtt = 0;

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

        if (!allDestinations.value.includes(probeData.dst_addr)) {
            allDestinations.value.push(probeData.dst_addr);
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
                    isPrivate: isPrivateIP(currentIp),
                    hops: nodeInfo.hops || [],
                    asn: nodeInfo.asn || "unknown",
                };

                if (!newNodeInfo.isNonResponsive) {
                    const asnPromise = RipeApi.userASN(newNodeInfo.label).then(asnData => {
                        const asn = asnData.data.asns[0];
                        if (asn) {
                            if (!asnList.value.includes(asn)) {
                                asnList.value.push(asn);
                            }
                            ipToAsnMap.value[newNodeInfo.label] = asn;
                        }
                    });
                }

                newNodeInfo.hops.push({
                    from: result.from,
                    rtt: result.rtt,
                    size: result.size,
                    ttl: result.ttl,
                });

                const medianRtt = calculateMedian(newNodeInfo.hops.map(hop => hop.rtt));
                if (medianRtt > highestMedianRtt) {
                    highestMedianRtt = medianRtt;
                }

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

    maxMedianRtt.value = highestMedianRtt;

    assignAsnColors();
    updateDisplayedRttValues();
};

const updateDisplayedRttValues = () => {
    let minRtt = Infinity;
    let maxRtt = -Infinity;
    let destinationNodeMedianRtt = null;

    Object.values(nodes.value).forEach(node => {
        if (node.hops && node.hops.length > 0) {
            const medianRtt = calculateMedian(node.hops.map(hop => hop.rtt).filter(rtt => rtt !== undefined));
            if (medianRtt !== null) {
                minRtt = Math.min(minRtt, medianRtt);
                if (node.isLastHop) {
                    destinationNodeMedianRtt = medianRtt;
                }
            }
        }
    });

    minDisplayedRtt.value = minRtt === Infinity ? null : minRtt;
    maxDisplayedRtt.value = destinationNodeMedianRtt !== null ? destinationNodeMedianRtt : (maxRtt === -Infinity ? null : maxRtt);
};

watch([nodes, displayMode], updateDisplayedRttValues);

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

        await nextTick();

        const nodeInfo = nodes.value[node];
        let nodeMetaData;
        if (!node.includes("*")) {
            nodeMetaData = await RipeApi.prefixOverview(node);
        }
        const rttValues = nodeInfo.hops?.map(hop => hop.rtt);
        const sizeValues = nodeInfo.hops?.map(hop => hop.size);
        const ttlValues = nodeInfo.hops?.map(hop => hop.ttl);

        let nodeType = "Normal";
        let color = "blue";
        if (nodeInfo.isProbe) {
            nodeType = "Probe";
            color = "green";
        }
        if (nodeInfo.isNonResponsive) {
            nodeType = "Non Responsive";
            color = "gray";
        }
        if (nodeInfo.isLastHop) {
            nodeType = "Destination";
            color = "red";
        }
        if (nodeInfo.isPrivate) {
            nodeType = "Private";
            color = "purple";
        }

        let probeDetails;
        Object.keys(probeDetailsMap.value).forEach(probeId => {
            if (probeDetailsMap.value[probeId].address_v4 === node || probeDetailsMap.value[probeId].address_v6 === node) {
                probeDetails = probeDetailsMap.value[probeId];
            }
        });

        tooltipData.value = {
            label: nodeInfo.label,
            medianRtt: calculateMedian(rttValues),
            medianSize: calculateMedian(sizeValues),
            medianTtl: calculateMedian(ttlValues),
            type: nodeType,
            color: color,
            ...nodeMetaData,
            ...probeDetails,
        };
        tooltipOpacity.value = 1;

        await nextTick();

        if (tooltip.value) {
            const tooltipHeight = tooltip.value.offsetHeight;
            const domPoint = graph.value.translateFromSvgToDomCoordinates(targetNodePos.value);
            tooltipPos.value = {
                left: `${domPoint.x - tooltip.value.offsetWidth / 2}px`,
                top: `${domPoint.y - NODE_RADIUS - tooltipHeight - 10}px`,
            };
        }
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
    nodes.value = {};
    edges.value = {};
    layoutNodes.value = { nodes: {} };
    metaData.value = {};
    timeRange.value = { disable: true };
    leftLabelValue.value = "";
    rightLabelValue.value = "";
    highlightedEdges.value = {};
    selectedProbes.value = [];
    allProbes.value = [];
    probeDetailsMap.value = {};
    selectAllProbes.value = true;
    selectedNode.value = null;
    searchQuery.value = "";
    selectedDestination.value = "all";
    allDestinations.value = [];
    displayMode.value = "normal"

    if (measurementID.value.trim()) {
        isLoading.value = true;
        try {
            const fetchedMetaData = await atlas_api.getMeasurementById(measurementID.value);
            metaData.value = fetchedMetaData;

            if (fetchedMetaData.status.name === "Ongoing") {
                fetchedMetaData.stop_time = Math.floor(Date.now() / 1000);
            }

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
                allDestinations.value = [];
                selectedDestination.value = "all";
            }

            const params = {};

            if (!timeRange.value.disable) {
                params.start_time = timeRange.value.min;
                params.stop_time = timeRange.value.max;
            }

            if (selectedProbes.value.length > 0) {
                params.probe_ids = selectedProbes.value.join(",");
            }

            if (selectedDestination.value !== "all") {
                params.target_ip = selectedDestination.value;
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

const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
};

const loadMeasurementOnTimeRange = debounce((e) => {
    leftLabelValue.value = convertUnixTimestamp(e.min);
    rightLabelValue.value = convertUnixTimestamp(e.max);
    loadMeasurementData();
}, 1000);

const loadMeasurementOnProbeChange = debounce(() => {
    loadMeasurementData();
}, 1000);

function convertUnixTimestamp(unixTimestamp) {
    const date = new Date(unixTimestamp * 1000);

    const year = String(date.getFullYear());
    const day = String(date.getDate()).padStart(2, "0");
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const month = monthNames[date.getMonth()];
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year} - ${day} ${month}, ${hours}:${minutes}`;
}

const minTime = computed(() => metaData.value?.start_time || 0);
const maxTime = computed(() => metaData.value?.stop_time || 0);

watchEffect(() => {
    if (selectedProbes.value.length > 0) {
        loadMeasurementOnProbeChange();
    }
});

watchEffect(() => {
    if (!timeRange.value.disable) {
        loadMeasurementOnTimeRange(timeRange.value);
    }
});

const paginatedProbes = computed(() => {
    const query = searchQuery.value.toLowerCase();
    return allProbes.value.map(probe => ({
        probe,
        ...probeDetailsMap.value[probe]
    })).filter(probe => {
        return ["address_v4", "address_v6", "country_code", "asn_v4", "asn_v6"].some(field => {
            return probe[field] && probe[field].toString().toLowerCase().includes(query);
        });
    });
});

const columns = [
    { name: "probe", align: "left", label: "Probe", field: "probe" },
    { name: "ipv4", align: "left", label: "IPv4 Address", field: "ipv4" },
    { name: "ipv6", align: "left", label: "IPv6 Address", field: "ipv6" },
    { name: "country_code", align: "left", label: "Country Code", field: "country_code" },
    { name: "asn_v4", align: "left", label: "ASN4", field: "asn_v4" },
    { name: "asn_v6", align: "left", label: "ASN6", field: "asn_v6" }
];

const destinationColumns = [
    { name: "destination", align: "left", label: "Destination IP", field: "destination" }
];

const toggleSelectAll = (value) => {
    if (value) {
        selectedProbes.value = allProbes.value;
    } else {
        selectedProbes.value = [];
    }
};

onMounted(() => {
    const tracerouteid = route.query.tracerouteid;
    if (tracerouteid) {
        measurementID.value = tracerouteid;
        loadMeasurement();
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
                       :event-handlers="eventHandlers" v-if="Object.keys(nodes).length > 0 && selectedProbes.length > 0 && !isLoading"  zoom-level="0" />
        <div v-else-if="!isLoading" class="placeholder-message">No graph data available.</div>
        <div v-if="selectedNode" ref="tooltip" class="tooltip" :style="{ ...tooltipPos, opacity: tooltipOpacity }">
            <div style="display: flex; align-items: center;">
                <span class="nodeTypeDot" :style="{ backgroundColor: tooltipData.color }"></span>{{ tooltipData.type }}
            </div>
            <div><strong>Median RTT:</strong> {{ tooltipData.medianRtt ? tooltipData.medianRtt + "ms" : "Not available"}}</div>
            <div><strong>Median Size:</strong> {{ tooltipData.medianSize ? tooltipData.medianSize + " bytes" : "Not available"}}</div>
            <div><strong>Median TTL:</strong> {{ tooltipData.medianTtl ?? "Not available"}}</div>
            <div><strong>IP:</strong> {{ tooltipData.label }}</div>
            <div><strong>AS:</strong> {{ tooltipData?.data?.asns[0]?.asn ? tooltipData.data.asns[0].asn + ` (${tooltipData.data.asns[0].holder})` : "Not available"}}</div>
            <div><strong>Announced:</strong> {{ tooltipData?.data?.announced ?? "Not available"}}</div>
            <div><strong>Prefix:</strong> {{ tooltipData?.data?.block?.resource ?? "Not available"}}</div>
            <div><strong>Description:</strong> {{ tooltipData?.data?.block?.desc ?? "Not available"}}</div>
            <div><strong>Name:</strong> {{ tooltipData?.data?.block?.name ?? "Not available"}}</div>
            <div v-if="tooltipData.address_v4"><strong>IPv4 Address:</strong> {{ tooltipData.address_v4 }}</div>
            <div v-if="tooltipData.address_v6"><strong>IPv6 Address:</strong> {{ tooltipData.address_v6 }}</div>
            <div v-if="tooltipData.country_code"><strong>Country Code:</strong> {{ tooltipData.country_code }}</div>
            <div v-if="tooltipData.asn_v4"><strong>ASN4:</strong> {{ tooltipData.asn_v4 }}</div>
            <div v-if="tooltipData.asn_v6"><strong>ASN6:</strong> {{ tooltipData.asn_v6 }}</div>
            <div v-if="tooltipData.id"><strong>Probe ID:</strong> {{ tooltipData.id }}</div>
            <div v-if="tooltipData.description"><strong>Probe Description:</strong> {{ tooltipData.description }}</div>
            <div v-if="tooltipData.status?.name"><strong>Status:</strong> {{ tooltipData.status.name }}</div>
            <div v-if="tooltipData.status?.since"><strong>Status Since:</strong> {{ new Date(tooltipData.status.since).toLocaleString() }}</div>
        </div>
        <div v-if="Object.keys(nodes).length > 0" class="measurement-info-overlay">
          <div><strong>Description:</strong> {{ metaData.description }}</div>
          <div><strong>Target:</strong> {{ metaData.target }}</div>
          <div><strong>Target IP:</strong> {{ metaData.target_ip }}</div>
          <div><strong>Start Time:</strong> {{ convertUnixTimestamp(metaData.start_time) }}</div>
          <div><strong>Stop Time:</strong> {{ convertUnixTimestamp(metaData.stop_time) }}</div>
          <div><strong>Status:</strong> {{ metaData.status.name }}</div>
        </div>
        <div v-if="Object.keys(nodes).length > 0" class="mode-toggle-overlay">
            <QRadio v-model="displayMode" val="normal" label="Normal Mode" />
            <QRadio v-model="displayMode" val="rtt" label="RTT Mode" />
            <QRadio v-model="displayMode" val="asn" label="ASN Mode" />
        </div>
        <div v-if="displayMode === 'rtt' && Object.keys(nodes).length > 0" class="rtt-info-overlay">
          <div><span class="rtt-dot" :style="{ backgroundColor: rttColor(minDisplayedRtt) }"></span> <strong>Min RTT: </strong>{{ minDisplayedRtt ? minDisplayedRtt + " ms" : "Not available" }}</div>
          <div><span class="rtt-dot" :style="{ backgroundColor: rttColor(maxDisplayedRtt) }"></span> <strong>Max RTT: </strong>{{ maxDisplayedRtt ? maxDisplayedRtt + " ms" : "Not available" }}</div>
        </div>
        <div v-if="displayMode === 'asn' && Object.keys(nodes).length > 0" class="asn-info-overlay">
            <div class="asn-grid">
                <div v-for="asn in filteredAsnList" :key="asn" :style="{ backgroundColor: asnColors[asn] }" class="asn-box">
                    {{ asn }}
                </div>
            </div>
        </div>
      </div>
      <h3>Time Range</h3>
      <div class="time-range">
        <QRange v-model="timeRange" :disable="timeRange.disable" :min="minTime" :max="maxTime"
                :left-label-value="leftLabelValue" :right-label-value="rightLabelValue" label-always
                drag-range @change="loadMeasurementOnTimeRange" />
      </div>
      <div class="probe-selection">
        <h3>Select Probes</h3>
        <QInput v-model="searchQuery" placeholder="Search probes..." :disable="Object.keys(nodes).length < 1" />
        <QTable :rows="paginatedProbes" :columns="columns" row-key="probe">
          <template v-slot:header="props">
            <QTr :props="props">
              <QTd :props="props.colProps" v-for="col in props.cols" :key="col.name">
                <template v-if="col.name === 'probe'">
                  <QCheckbox v-model="selectAllProbes" @update:model-value="toggleSelectAll" :disable="Object.keys(nodes).length < 1"/>
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
      <div class="destination-selection">
        <h3>Select Destination</h3>
        <QTable :rows="[{ destination: 'all' }, ...allDestinations.map(dest => ({ destination: dest }))]" :columns="destinationColumns" row-key="destination">
          <template v-slot:body="props">
            <QTr :props="props">
              <QTd>
                <QRadio v-model="selectedDestination" :val="props.row.destination" :label="props.row.destination === 'all' ? 'All Destinations' : props.row.destination" />
              </QTd>
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

.destination-selection {
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

.placeholder-message {
    display: flex; 
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #666;
    font-size: 1.2em;
}

.tooltip {
    padding: 1em;
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    width: 30em;
    font-size: 12px;
    background-color: #fff0bd;
    border: 1px solid #ffb950;
    box-shadow: 2px 2px 2px #aaa;
    transition: opacity 0.2s linear;
    z-index: 10;
}

.nodeTypeDot {
    width: 10px; 
    height: 10px; 
    border-radius: 50%; 
    margin-right: 5px;
}

.rtt-dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 5px;
}

.time-range {
    padding: 2em;
    width: 95vw;
    margin: 0 auto;
}

.measurement-info-overlay {
    position: absolute;
    top: 0;
    left: 0;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-bottom: 1px solid #ccc;
    border-right: 1px solid #ccc;
    font-size: 12px;
}

.mode-toggle-overlay {
    position: absolute;
    top: 0;
    right: 0;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-bottom: 1px solid #ccc;
    border-left: 1px solid #ccc;
    font-size: 12px;
    display: flex;
    flex-direction: column;
}

.rtt-info-overlay {
    position: absolute;
    top: 0;
    border-right: 1px solid #ccc;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-bottom: 1px solid #ccc;
    border-left: 1px solid #ccc;
    font-size: 12px;
}

.asn-info-overlay {
    width: 40em;
    position: absolute;
    top: 0;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-bottom: 1px solid #ccc;
    border-left: 1px solid #ccc;
    border-right: 1px solid #ccc;
    font-size: 12px;
    display: flex;
    flex-direction: column;
}

.asn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 1em;
}

.asn-box {
    padding: 0.2em;
    text-align: center;
    color: #fff;
    font-size: 0.9em;
}
</style>
