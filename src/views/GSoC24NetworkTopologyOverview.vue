<script setup>
import { QBtn, QSelect, QInput, QSpinner } from 'quasar'
import { ref, inject, reactive, onMounted, computed, watch } from 'vue' 
import { VNetworkGraph, VEdgeLabel } from 'v-network-graph';
import * as vNG from "v-network-graph"
import dagre from "dagre/dist/dagre.min.js"

const iyp_api = inject('iyp_api')

const ipOptions = ref(['IPv4', 'IPv6'])
const ipModel = ref('IPv4')
const ASN = ref('2501')
const allNodes = ref([])
const allEdges = ref({})
const layouts = reactive({nodes: {}})
const graph = ref()
const targetNodeId = ref("")
const tooltipClickOpacity = ref(0)
const tooltipHoverOpacity = ref(0)
const tooltipPos = ref({ left: "0px", top: "0px" })
const tooltip = ref()
const asnInfo = ref({})

const as_topology_query = ref({
	loading: true,
	query1:`MATCH (a:AS {asn: $asn})-[h:DEPENDS_ON {af:$af}]->(d:AS)
		WITH a, COLLECT(DISTINCT d) AS dependencies
		UNWIND dependencies as d
		MATCH p = allShortestPaths((a)-[:PEERS_WITH*]-(d))
		WHERE a.asn <> d.asn AND all(r IN relationships(p) WHERE r.af = $af) AND all(n IN nodes(p) WHERE n IN dependencies)
		RETURN p`,
  query2:`MATCH  (a:AS {asn:$asn})-[d:DEPENDS_ON {af: $af}]-> (b:AS)
          OPTIONAL MATCH (b)-[rr:RANK]-(:Ranking {name:"CAIDA ASRank"})
          RETURN b.asn AS ASN,d.hege*100 AS HEGE, rr['cone:numberAsns'] AS CONES`,
  query3:`MATCH (a:AS)
        WHERE a.asn in $asns
        OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
        OPTIONAL MATCH (a)-[:NAME]->(n:Name)
        OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:COUNTRY]-(ixp_country:Country)
        OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
        RETURN a.asn AS ASN ,c.country_code AS CC, c.name AS Country, COALESCE(pdbn.name, btn.name, ripen.name) AS Name, count(DISTINCT ixp) as nb_ixp`,
})

const MAX_NODE_SIZE = 35

const configs = vNG.defineConfigs({
  view: {
    autoPanAndZoomOnLoad: "fit-center", 
	  scalingObjects:"true",
	grid: {
		visible: false,
		interval: 100,
		thickIncrements: 8,
		line: {
			color: "#e0e0e0",
			width: 1,
			dasharray: 1,
		},
		thick: {
			color: "#cccccc",
			width: 1,
			dasharray: 1,
		},
	},
  },
  node: {
    normal: { radius: node =>  node.size / 2, color: node => node.color},
    label: { directionAutoAdjustment:true },
    hover: {color: node => node.color}
  },
  edge: {
    normal: {
      color: edge => edge.color,
      width: 2.5,
    },
    hover:{
      color: "red",
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
})

const targetNodePos = computed(() => {
	const nodePos = layouts.nodes[targetNodeId.value]
	return nodePos || { x: 0, y: 0 }
})

const layout = (direction) => {
  if (Object.keys(allNodes.value).length <= 1 || Object.keys(allEdges.value).length == 0) {
    return
  }

  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: MAX_NODE_SIZE  * 2,
    edgesep: MAX_NODE_SIZE,
    ranksep: MAX_NODE_SIZE * 2,
  })
  g.setDefaultEdgeLabel(() => ({}))

  Object.entries(allNodes.value).forEach(([nodeId, node]) => {
    g.setNode(nodeId, { label: node.name, width: MAX_NODE_SIZE, height: MAX_NODE_SIZE })
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

const calculateNodeColor = (percentage) => {
    const darkBlue = { r: 0, g: 0, b: 139 }; // Dark blue
    const lightBlue = { r: 240, g: 248, b: 255 }; // Alice blue (nearly invisible light blue)

    const red = Math.round(lightBlue.r + (darkBlue.r - lightBlue.r) * (percentage / 100));
    const green = Math.round(lightBlue.g + (darkBlue.g - lightBlue.g) * (percentage / 100));
    const blue = Math.round(lightBlue.b + (darkBlue.b - lightBlue.b) * (percentage / 100));

    const toHex = (value) => value.toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

const calculateEdgeColor = (percentage) => {
    const darkGrey = { r: 169, g: 169, b: 169 }; // Dark grey
    const lightGrey = { r: 245, g: 245, b: 245 }; // Light grey (nearly invisible)

    const red = Math.round(lightGrey.r + (darkGrey.r - lightGrey.r) * (percentage / 100));
    const green = Math.round(lightGrey.g + (darkGrey.g - lightGrey.g) * (percentage / 100));
    const blue = Math.round(lightGrey.b + (darkGrey.b - lightGrey.b) * (percentage / 100));

    const toHex = (value) => value.toString(16).padStart(2, '0');
    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

const searchASN = async() => {
	as_topology_query.value.loading = true;
  const query_params = { asn: Number(ASN.value), af: Number(ipModel.value[ipModel.value.length-1]) }
	const response = await iyp_api.run([
    {statement: as_topology_query.value.query1, parameters: query_params},
    {statement: as_topology_query.value.query2, parameters: query_params},
  ])
  response[1].forEach(item => {
      asnInfo.value[item.ASN] = { HEGE: item.HEGE , CONES: item.CONES}
  })
  const asnInfoResponse = await iyp_api.run([{statement: as_topology_query.value.query3, parameters: { asns: Object.keys(asnInfo.value).map(Number) }}])
  asnInfoResponse[0].forEach(item => {
    asnInfo.value[item.ASN]['Country'] = item.Country
    asnInfo.value[item.ASN]['Name'] = item.Name
  })
  sortASNodes(response)
	sortASRelations(response)
	layout('BT')
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
        sortedUniqueNodes[asn] = { name: `AS${asn}` , tooltip: { visible: false , left:0, top:0 }, color: ASN.value == asn ? 'red' : calculateNodeColor(asnInfo.value[asn]?.HEGE), size: ASN.value == asn ? MAX_NODE_SIZE :  calculateNodeSize(asnInfo.value[asn]?.CONES) };
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
                                "target": asn2,
                                "color": calculateEdgeColor(asnInfo.value[asn2]?.HEGE),
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

const calculateNodeSize = (value) => {
  return 10+1.3*Math.log2(value);
}

const eventHandlers = {
  "node:pointerover": ({ node }) => {
    targetNodeId.value = node 
    if(!tooltipClickOpacity.value) tooltipHoverOpacity.value = 1
  },
  "node:pointerout": () => {
    if(tooltipClickOpacity.value) tooltipClickOpacity.value = 0
    tooltipHoverOpacity.value = 0
  },
  "node:click": ({ node , event}) => {
    if (event.detail === 1){
      targetNodeId.value = node 
      !tooltipClickOpacity.value ? tooltipHoverOpacity.value = 0 : tooltipHoverOpacity.value = 1
      tooltipClickOpacity.value = Number(!tooltipClickOpacity.value)
    }else {
      tooltipHoverOpacity.value = 0
      tooltipClickOpacity.value = 0 
      ASN.value = node
      searchASN()
    }
  }
}

watch(
  () => [targetNodePos.value, tooltipClickOpacity.value, tooltipHoverOpacity.value],
  () => {
    if (!graph.value || !tooltip.value) return

    let domPoint = { x: 0, y: 0 };
      domPoint = graph.value.translateFromSvgToDomCoordinates(targetNodePos.value);
      tooltipPos.value = {
        left: domPoint.x - tooltip.value.offsetWidth / 2 + "px",
        top: domPoint.y - MAX_NODE_SIZE - tooltip.value.offsetHeight - 30 + "px",
      }
  },
  { deep: true }
);

onMounted(() => {
  searchASN()
})

</script>

<template>

	<div>
	
		<h1 class="text-center">Network Topology Overview</h1>

		<div class="justify-center q-pa-md flex pb-0">
			<QInput style="max-width: 120px"  outlined v-model="ASN" placeholder="ASN" :dense="true" />
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
        ref="graph"
        :nodes="allNodes"
        :edges="allEdges"
        :layouts="layouts"
        :configs="configs"
        :event-handlers="eventHandlers"
      />

      <div class="scaleContainer">
        <div class="scaleLabel">100%</div>
        <div class="scale">
          <div v-for="percentage in [100, 90, 80, 70, 60, 50, 40 , 30 , 20 , 10 , 0]" :key="percentage" class="scaleColor" :style="{backgroundColor: calculateNodeColor(percentage)}"></div>
        </div>
        <div class="scaleLabel">0%</div>
      </div>

      <div ref="tooltip" >
       
        <div class="tooltip" :style="{ ...tooltipPos, opacity: tooltipClickOpacity }">
          <div>{{ asnInfo[targetNodeId]?.Name }}</div>
          <div>{{ asnInfo[targetNodeId]?.Country }}</div>
          <div>CONES : {{ asnInfo[targetNodeId]?.CONES }}</div>
          <div v-if="targetNodeId!=ASN" > Hegemony : {{ asnInfo[targetNodeId]?.HEGE.toFixed(2)  }}%</div>
        </div>

        <div class="tooltip" :style="{ ...tooltipPos, opacity: tooltipHoverOpacity }">
          <div>{{ asnInfo[targetNodeId]?.Name }}</div>
        </div>

      </div>

    </div>

		<QSpinner v-if="as_topology_query.loading" color="secondary" size="5em" class="spinner" />

		<h5 v-if="!as_topology_query.loading && Object.keys(allNodes).length==0" class="text-center"> No data found</h5>

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
  position: relative;
}

.spinner {
	display:flex;
	margin:auto;
	margin-top:25px;
}

.tooltip {
  opacity: 0;
  position: absolute;
  display: grid;
  place-content: center;
  text-align: center;
  font-size: 12px;
  background-color: #fff0bd;
  border: 1px solid #ffb950;
  box-shadow: 2px 2px 2px #aaa;
  transition: opacity 0.2s linear;
  pointer-events: none;
  padding: 5px 10px; 
}

.scaleContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px auto;
  padding: 5px 10px;
}

.scaleLabel {
  font-size: 14px;
  margin: 5px 0;
}

.scale {
  display: flex;
  flex-direction: column;
  height: 55vh;
  width: 20px;
  border: 1px solid #ccc;
}

.scaleColor {
  flex: 1;
  width: 100%;
}

</style>