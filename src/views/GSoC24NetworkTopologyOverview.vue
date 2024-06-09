<script setup>
import { QBtn, QSelect, QInput, QSpinner } from 'quasar'
import { ref, inject, reactive, onMounted } from 'vue' 
import { VNetworkGraph } from 'v-network-graph';
import * as vNG from "v-network-graph"
import dagre from "dagre/dist/dagre.min.js"

const iyp_api = inject('iyp_api')

const ipOptions = ref(['IPv4', 'IPv6'])
const ipModel = ref('IPv4')
const asn = ref('2501')
const allNodes = ref([])
const allEdges = ref({})
const layouts = reactive({nodes: {}})
const graph = ref(null);
const as_topology_query = ref({
	loading: true,
	query:`MATCH (a:AS {asn: $asn})-[h:DEPENDS_ON {af:$af}]->(d:AS)
		WITH a, COLLECT(DISTINCT d) AS dependencies
		UNWIND dependencies as d
		MATCH p = allShortestPaths((a)-[:PEERS_WITH*]-(d))
		WHERE a.asn <> d.asn AND all(r IN relationships(p) WHERE r.af = $af) AND all(n IN nodes(p) WHERE n IN dependencies)
		RETURN p`,
})

const nodeSize = 35
const configs = vNG.defineConfigs({
  view: {
    autoPanAndZoomOnLoad: "fit-center", 
	scalingObjects:"true",
	grid: {
		visible: true,
		interval: 10,
		thickIncrements: 5,
		line: {
			color: "#e0e0e0",
			width: 1,
			dasharray: 1,
		},
		thick: {
			color: "#cccccc",
			width: 1,
			dasharray: 0,
		},
	},
  },
  node: {
    normal: { radius: nodeSize / 2 },
    label: { direction: "north" , directionAutoAdjustment:true },
  },
  edge: {
    normal: {
      color: "#aaa",
      width: 3,
    },
    margin: 4,
    marker: {
      target: {
        type: "angle",
        width: 4,
        height: 4,
      },
    },
  },
})

function layout(direction) {
  if (Object.keys(allNodes.value).length <= 1 || Object.keys(allEdges.value).length == 0) {
    return
  }

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSize * 2,
    edgesep: nodeSize,
    ranksep: nodeSize * 2,
  })
  g.setDefaultEdgeLabel(() => ({}))

  Object.entries(allNodes.value).forEach(([nodeId, node]) => {
    g.setNode(nodeId, { label: node.name, width: nodeSize, height: nodeSize })
  })

  Object.values(allEdges.value).forEach(edge => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  g.nodes().forEach((nodeId) => {
    const x = g.node(nodeId).x
    const y = g.node(nodeId).y
    layouts.nodes[nodeId] = { x, y }
  })
}

const searchASN = async() => {
	as_topology_query.value.loading = true;
	let query_params = { asn: Number(asn.value), af: Number(ipModel.value[ipModel.value.length-1]) }
	const response = await iyp_api.run([{statement: as_topology_query.value.query, parameters: query_params}])
	sortASNodes(response)
	sortASRelations(response)
	layout('TB')
	as_topology_query.value.loading = false;
}

const sortASNodes = (data) => {
    const hopLevels = {};

    data.forEach(subArray => {
        subArray.forEach(entry => {
            if (entry.p && entry.p.length > 0) {
                const connections = entry.p;

                for (let j = 0; j < connections.length; j++) {
                    if (j % 2 === 0) {
                        const hopIndex = j / 2;
                        if (!hopLevels[hopIndex]) {
                            hopLevels[hopIndex] = new Set();
                        }
                        hopLevels[hopIndex].add(connections[j].asn);
                    }
                }
            }
        });
    });

    const uniqueNodes = new Set();

    Object.keys(hopLevels)
        .sort((a, b) => a - b)
        .forEach(key => {
            hopLevels[key].forEach(asn => {
                uniqueNodes.add(asn);
            });
        });

    const sortedUniqueNodes = {};
    Array.from(uniqueNodes).forEach(asn => {
        sortedUniqueNodes[asn] = { name: `AS${asn}` };
    });

	allNodes.value = sortedUniqueNodes;
}

const sortASRelations = (data) => {
    const formattedData = {}
    const uniquePairsSet = new Set()
    let edgeCounter = 1

    data.forEach(subArray => {
        subArray.forEach(entry => {
            if (entry.p && entry.p.length > 1) {
                const connections = entry.p

                for (let j = 0; j < connections.length - 1; j += 2) {
                    const asn1 = connections[j]?.asn || null
                    const asn2 = connections[j + 2]?.asn || null

                    if (asn1 !== null && asn2 !== null) {
                        const pairString = `${asn1}-${asn2}`

                        if (!uniquePairsSet.has(pairString)) {
                            uniquePairsSet.add(pairString)
                            formattedData[`edge${edgeCounter}`] = {
                                "source": asn1,
                                "target": asn2
                            };
                            edgeCounter++
                        }
                    }
                }
            }
        });
    });

	allEdges.value = formattedData
    
}

onMounted(() => {
  searchASN()
})

</script>

<template>

	<div>
	
		<h1 class="text-center ">Network Topology Overview</h1>

		<div class="justify-center q-pa-md flex pb-0">
			<QInput style="max-width: 120px"  outlined v-model="asn" placeholder="ASN" :dense="true" />
			<QSelect
        	style="min-width: 100px; margin-left: 22px;"
			filled
			v-model="ipModel"
			:options="ipOptions"
			label="IP"
			:dense="true"
      		/>
			<QBtn style="margin-left:22px" color="secondary" label="Search"  @click="searchASN"/>
		</div>

        <div class="graphContainer" v-if="!as_topology_query.loading && Object.keys(allNodes).length>0">
            <VNetworkGraph 
			:nodes="allNodes"
			:edges="allEdges"
			:layouts="layouts"
			:configs="configs"
			/>
        </div>

		<QSpinner v-if="as_topology_query.loading" color="secondary" size="5em" class="spinner" />

	</div>

</template>

<style scoped>

.graphContainer {
    border-radius: 5px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 65vh;
    width: 80%;
	margin:auto;
	margin-bottom: 40px;
    box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
}

.spinner {
	display:flex;
	margin:auto;
	margin-top:25px;
}

</style>