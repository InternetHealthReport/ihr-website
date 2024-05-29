<script setup>
import { QInput, QIcon, QBtn } from 'quasar';
import { ref, onMounted, inject, watch } from 'vue';
import { VNetworkGraph } from 'v-network-graph';
import * as vNG from 'v-network-graph';

const atlas_api = inject('atlas_api');
const isLoading = ref(false);
const measurementID = ref('');
const measurementResult = ref(null);
const nodes = ref({});
const edges = ref({});
const layoutNodes = ref({});
const nodeSize = 15;

const configs = vNG.defineConfigs({
    node: {
        normal: { 
            radius: nodeSize / 2,
            color: (node) => {
                if (node.isProbe) return 'green';
                if (node.isNonResponsive) return 'gray';
                if (node.isLastHop) return 'red';
                return 'blue';
            }
        },
        label: { 
            direction: 'north', 
            color: '#000'
        },
    },
    edge: {
        normal: {
            color: '#aaa',
            width: 3,
        },
        margin: 4,
        marker: {
            target: {
                type: 'arrow',
                width: 4,
                height: 4,
            },
        },
    },
});

const processData = (tracerouteData, width) => {
    const nodesMap = {};
    const edgesMap = {};
    const layouts = { nodes: {} };

    const xSpacing = 300;
    const ySpacing = 200;

    const hopLevels = {};
    const nodeOccurrences = {};

    tracerouteData.forEach((probeData, probeIndex) => {
        let lastNodeId = null;

        if (probeData.from) {
            const sourceNodeId = probeData.from;
            if (!nodesMap[sourceNodeId]) {
                nodesMap[sourceNodeId] = { name: probeData.from, isProbe: true };
                hopLevels[0] = hopLevels[0] || new Set();
                hopLevels[0].add(sourceNodeId);

                nodeOccurrences[sourceNodeId] = [{ probeIndex, hopIndex: 0 }];
                layouts.nodes[sourceNodeId] = {
                    x: xSpacing * (probeIndex + 1),
                    y: ySpacing
                };
            }
            lastNodeId = sourceNodeId;
        }

        probeData.result.forEach((hopData, hopIndex) => {
            if (hopData.result && hopData.result.length > 0) {
                let currentIp = null;
                for (const result of hopData.result) {
                    if (result.from || result.x) {
                        currentIp = result.from || result.x;
                        break;
                    }
                }

                if (currentIp) {
                    if (!hopLevels[hopIndex + 1]) {
                        hopLevels[hopIndex + 1] = new Set();
                    }

                    const nodeId = currentIp === '*' ? `star-${probeData.prb_id}-${hopIndex}` : currentIp;
                    if (!nodesMap[nodeId]) {
                        if (currentIp === '*') {
                            nodesMap[nodeId] = { name: currentIp, isNonResponsive: true };
                        } else {
                            nodesMap[nodeId] = { name: currentIp };
                        }
                        hopLevels[hopIndex + 1].add(nodeId);

                        if (!nodeOccurrences[nodeId]) {
                            nodeOccurrences[nodeId] = [];
                        }
                        nodeOccurrences[nodeId].push({ probeIndex, hopIndex: hopIndex + 1 });

                        layouts.nodes[nodeId] = {
                            x: xSpacing * (probeIndex + 1),
                            y: ySpacing * (hopIndex + 2)
                        };
                    }

                    if (lastNodeId && lastNodeId !== nodeId) {
                        const edgeId = `edge-${lastNodeId}-${nodeId}`;
                        if (!edgesMap[edgeId]) {
                            edgesMap[edgeId] = { source: lastNodeId, target: nodeId };
                        }

                        if (layouts.nodes[nodeId].y <= layouts.nodes[lastNodeId].y) {
                            layouts.nodes[nodeId].y = layouts.nodes[lastNodeId].y + ySpacing;
                        }
                    }

                    lastNodeId = nodeId;
                }
            }
        });

        if (lastNodeId) {
            nodesMap[lastNodeId].isLastHop = true;
        }
    });

    Object.keys(hopLevels).forEach((hopLevel, index) => {
        const nodesInLevel = Array.from(hopLevels[hopLevel]);
        const levelWidth = nodesInLevel.length * xSpacing;
        nodesInLevel.forEach((nodeId, i) => {
            layouts.nodes[nodeId].x = (width / 2) - (levelWidth / 2) + (i
			* xSpacing);
        });
    });

    const adjustNodePositions = () => {
        Object.keys(layouts.nodes).forEach(nodeId => {
            const occurrences = nodeOccurrences[nodeId];
            if (occurrences && occurrences.length > 1) {
                const minX = Math.min(...occurrences.map(o => layouts.nodes[nodeId].x));
                const maxX = Math.max(...occurrences.map(o => layouts.nodes[nodeId].x));
                const newX = (minX + maxX) / 2;
                layouts.nodes[nodeId].x = newX;
            }
        });

        Object.values(hopLevels).forEach(nodesInLevel => {
            const levelNodes = Array.from(nodesInLevel);
            levelNodes.forEach((nodeId, i) => {
                layouts.nodes[nodeId].x += i * (nodeSize + 10);
            });
        });
    };

    adjustNodePositions();

    nodes.value = nodesMap;
    edges.value = edgesMap;
    layoutNodes.value = layouts;
    console.log('All nodes:', nodesMap);
    console.log('All edges:', edgesMap);
    console.log('Node layouts:', layouts);
};

const loadMeasurement = async () => {
    if (measurementID.value.trim()) {
        isLoading.value = true;
        try {
            const data = await atlas_api.getMeasurementDataById(measurementID.value);
            measurementResult.value = data;

            const width = window.innerWidth;
            processData(data, width);
        } catch (error) {
            console.error('Failed to load measurement:', error);
        } finally {
            isLoading.value = false;
        }
    }
};

watch(measurementID, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        loadMeasurement();
    }
});
</script>

<template>
    <div class="mainContainer">
        <h1>Traceroute Visualization</h1>
        <QInput debounce="300" v-model="measurementID" placeholder="Enter Measurement ID">
            <template v-slot:prepend>
                <QIcon name="web" />
            </template>
            <QBtn round dense flat :ripple="false" no-caps size="22px" @click="loadMeasurement">
                <QIcon name="search" />
            </QBtn>
        </QInput>
        <div class="graphContainer">
            <VNetworkGraph :nodes="nodes" :edges="edges" :layouts="layoutNodes" :configs="configs" v-if="!isLoading" />
        </div>
        <QSpinner v-if="isLoading" color="primary" size="0.82em" />
    </div>
</template>

<style scoped>
.mainContainer {
    padding: 2em;
}

.graphContainer {
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 65vh;
    width: 100%;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
}
</style>
