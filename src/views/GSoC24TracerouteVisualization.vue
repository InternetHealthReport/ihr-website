<script setup>
import { ref, onMounted, inject, watch } from 'vue';
import { VNetworkGraph } from 'v-network-graph';
import * as vNG from "v-network-graph";

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
				if (node.isProbe) return "green";
				if (node.isNonResponsive) return "gray";
				if (node.isLastHop) return "red";
				return "blue";
			}
		},
		label: { 
			direction: "center", 
			color: "#000" 
		},
	},
	edge: {
		normal: {
			color: "#aaa",
			width: 3,
		},
		margin: 4,
		marker: {
			target: {
				type: "arrow",
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

	const hopCount = Math.max(...tracerouteData.map(probe => probe.result.length));
	const probeCount = tracerouteData.length;

	const xSpacing = width / (probeCount + 1);
	const ySpacing = 100;

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
					}

					lastNodeId = nodeId;
				}
			}
		});

		if (lastNodeId) {
			nodesMap[lastNodeId].isLastHop = true;
		}
	});

	Object.keys(nodeOccurrences).forEach((nodeId) => {
		const occurrences = nodeOccurrences[nodeId];
		if (occurrences.length > 1) {
			const xCoords = occurrences.map(occurrence => layouts.nodes[nodeId].x);
			const minX = Math.min(...xCoords);
			const maxX = Math.max(...xCoords);
			const newX = (minX + maxX) / 2;

			layouts.nodes[nodeId].x = newX;
			occurrences.forEach(occurrence => {
				layouts.nodes[nodeId].y = ySpacing * (occurrence.hopIndex + 1);
			});
		}
	});

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
			console.error("Failed to load measurement:", error);
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
	<div>
		<h1>Traceroute Visualization</h1>
		<input v-model="measurementID" placeholder="Enter Measurement ID">
		<button @click="loadMeasurement" :disabled="isLoading">Load Data</button>
		<div class="graphContainer">
			<VNetworkGraph :nodes="nodes" :edges="edges" :layouts="layoutNodes" :configs="configs" v-if="!isLoading" />
		</div>
		<p v-if="isLoading">Loading...</p>
	</div>
</template>

<style scoped>
.graphContainer {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 70vh;
	width: 100%;
}
</style>
