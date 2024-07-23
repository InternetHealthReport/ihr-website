<script setup>
import { QBtn, QSelect, QInput, QSpinner, QIcon } from 'quasar'
import { ref, inject, reactive, onMounted, computed, watch } from 'vue' 
import { VNetworkGraph, VEdgeLabel } from 'v-network-graph';
import * as vNG from "v-network-graph"
import dagre from "dagre/dist/dagre.min.js"

const iyp_api = inject('iyp_api')

const props  = defineProps({
  searchInput: {
    type: String,
    default:'130.69.0.0/16'
  },
  af: {
    type: String,
    default:'IPv4'
  },
  isComponent: {
    type: Boolean,
    default: false,
  }
})

const ipOptions = ref(['IPv4', 'IPv6'])
const ipModel = ref('')
const ASN = ref('')
const allNodes = ref([])
const allEdges = ref({})
const layouts = reactive({nodes: {}})
const graph = ref()
const targetNodeId = ref("")
const tooltipHoverOpacity = ref(0)
const tooltipPos = ref({ left: "0px", top: "0px" })
const tooltip = ref()
const nodeInfo = ref({})
const loading = ref(true)
const searchInput = ref('')

const as_topology_query = ref({
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

const prefix_topology_query = ref({
	query1:`MATCH (a:AS)-[o:ORIGINATE]-(pfx:Prefix {prefix: $prefix})-[h:DEPENDS_ON {af:$af}]->(d:AS)
          WITH a, COLLECT(DISTINCT d) AS dependencies, pfx, o
          UNWIND dependencies AS d
          MATCH p = allShortestPaths((a)-[:PEERS_WITH*]-(d))
          WHERE a.asn <> d.asn AND all(r IN relationships(p) WHERE r.af = $af) AND all(n IN nodes(p) WHERE n IN dependencies)
          RETURN p, a, pfx, o`,
  query2:`MATCH (p:Prefix {prefix: $prefix})
          OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
          OPTIONAL MATCH(p)-[deleg:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
          RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS Name, c.name AS Country`
})

const MAX_NODE_SIZE = 35
const layoutType = 'BT'

const configs = vNG.defineConfigs({
  view: {
    autoPanAndZoomOnLoad: "fit-content", 
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
    normal: { type: node => node.type, radius: node =>  node.size / 2, color: node => node.color},
    label: { directionAutoAdjustment:true },
    hover: {color: node => node.color}
  },
  edge: {
    normal: {
      color: edge => edge.color,
      width: 2.5,
      dasharray: edge => (edge.dashed ? "4" : "0")
    },
    hover:{
      color: "red",
    },
    margin: 4,
    marker: {
      target: {
        type: edge => edge[0].marker,
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

const init = () => {
  searchInput.value = props.searchInput
  ipModel.value = props.af
}

const isPrefix = (input) => {

  if(input.includes('.')){
    return true
  }else{
    return false
  }

}

const search = async() => {

	loading.value = true;
  let response;

  if(isPrefix(searchInput.value)){

    const query_params = { prefix: searchInput.value, af: Number(ipModel.value[ipModel.value.length-1]) }
    response = await iyp_api.run([
      {statement: prefix_topology_query.value.query1, parameters: query_params},
    ])
    if(response[0].length > 0) ASN.value = response[0][0].a.asn
    delete query_params.prefix
    query_params.asn = Number(ASN.value)
    const hegeInfoResponse = await iyp_api.run([
      {statement: as_topology_query.value.query2, parameters: query_params},
    ])
    hegeInfoResponse[0].forEach(item => {
        nodeInfo.value[item.ASN] = { HEGE: item.HEGE , CONES: item.CONES}
    })
    const asnInfoResponse = await iyp_api.run([{statement: as_topology_query.value.query3, parameters: { asns: Object.keys(nodeInfo.value).map(Number) }}])
    asnInfoResponse[0].forEach(item => {
      nodeInfo.value[item.ASN]['Country'] = item.Country
      nodeInfo.value[item.ASN]['Name'] = item.Name
    })
    const prefixInfoResponse = await iyp_api.run([{statement: prefix_topology_query.value.query2, parameters: { prefix: searchInput.value }}])
    prefixInfoResponse[0].forEach(item => {
      nodeInfo.value[item.prefix] = {}
      nodeInfo.value[item.prefix]['Country'] = item.Country
      nodeInfo.value[item.prefix]['Name'] = item.Name
    })

  }else{

    ASN.value = searchInput.value
    const query_params = { asn: Number(searchInput.value), af: Number(ipModel.value[ipModel.value.length-1]) }
    response = await iyp_api.run([
      {statement: as_topology_query.value.query1, parameters: query_params},
      {statement: as_topology_query.value.query2, parameters: query_params},
    ])
    response[1].forEach(item => {
        nodeInfo.value[item.ASN] = { HEGE: item.HEGE , CONES: item.CONES}
    })
    const asnInfoResponse = await iyp_api.run([{statement: as_topology_query.value.query3, parameters: { asns: Object.keys(nodeInfo.value).map(Number) }}])
    asnInfoResponse[0].forEach(item => {
      nodeInfo.value[item.ASN]['Country'] = item.Country
      nodeInfo.value[item.ASN]['Name'] = item.Name
    })

  }

  sortNodes(response)
	sortRelations(response)
	layout(layoutType)
	loading.value = false;

}

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

const sortNodes = (data) => {
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
        sortedUniqueNodes[asn] = { name: `AS${asn}` , tooltip: { visible: false , left:0, top:0 }, color: ASN.value == asn ? 'red' : calculateNodeColor(nodeInfo.value[asn]?.HEGE), size:calculateNodeSize(nodeInfo.value[asn]?.CONES), type: 'circle' };
    });
    if(isPrefix(searchInput.value) && Object.keys(sortedUniqueNodes).length > 0) sortedUniqueNodes[searchInput.value] = { name: `${searchInput.value}` , tooltip: { visible: false , left:0, top:0 }, color: 'red', size:MAX_NODE_SIZE, type: 'rect' }

	  allNodes.value = sortedUniqueNodes;
}

const sortRelations = (data) => {
    const formattedData = {}
    const uniquePairsSet = new Set()
    let edgeCounter = 1

    if(isPrefix(searchInput.value)) {
      formattedData[`edge0`] = {
      "source": searchInput.value,
      "target": ASN.value,
      "color": calculateEdgeColor(nodeInfo.value[ASN.value]?.HEGE),
      "dashed": true,
      "marker": "none"
      };
    }

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
                                "color": calculateEdgeColor(nodeInfo.value[asn2]?.HEGE),
                                "marker": "arrow"
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
    tooltipHoverOpacity.value = 1
  },
  "node:pointerout": () => {
    tooltipHoverOpacity.value = 0
  },
  "node:click": ({ node , event}) => {
    if (event.detail > 1){

      if(!props.isComponent) {
        tooltipHoverOpacity.value = 0
        searchInput.value = node
        search()
      }else{
        console.log(`Redirecting`)
      }

    }
  }
}

watch(
  () => [targetNodePos.value, tooltipHoverOpacity.value],
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
  init()
  search()
})

</script>

<template>

	<div>

    <div v-if="!props.isComponent">
	
      <h1 class="text-center">Network Topology Overview</h1>

      <div class="justify-center flex pb-0">
        <QInput style="max-width: 145px"  outlined v-model="searchInput" placeholder="ASN" :dense="true" />
        <QSelect
            style="min-width: 100px; margin-left: 22px;"
        filled
        v-model="ipModel"
        :options="ipOptions"
        label="IP"
        :dense="true"
            />
        <QBtn style="margin-left:22px" color="secondary" label="Search"  @click="search"/>
      </div>

    </div>

    <div class="graphContainer" v-if="!loading && Object.keys(allNodes).length>0">

      <div class="controlPanel">
        <QBtn class="controlPanelButton" @click="graph?.zoomIn()"><QIcon name="zoom_in"></QIcon></QBtn>
        <QBtn class="controlPanelButton" @click="graph?.zoomOut()"><QIcon name="zoom_out"></QIcon></QBtn>
        <QBtn class="controlPanelButton" @click="search()">Fit Screen</QBtn>
      </div>
              
      <VNetworkGraph 
        ref="graph"
        :nodes="allNodes"
        :edges="allEdges"
        :layouts="layouts"
        :configs="configs"
        :event-handlers="eventHandlers"
      />

      <div class="hegemonyLabel">Hegemony</div>

      <div class="scaleContainer">
        <div class="scaleLabel">100%</div>
        <div class="scale">
          <div v-for="percentage in [100, 90, 80, 70, 60, 50, 40 , 30 , 20 , 10 , 0]" :key="percentage" class="scaleColor" :style="{backgroundColor: calculateNodeColor(percentage)}"></div>
        </div>
        <div class="scaleLabel">0%</div>
      </div>

      <div ref="tooltip" >
       
        <div class="tooltip" :style="{ ...tooltipPos, opacity: tooltipHoverOpacity }">
          <div>{{ nodeInfo[targetNodeId]?.Name }}</div>
          <div>{{ nodeInfo[targetNodeId]?.Country }}</div>
          <div v-if="!isPrefix(targetNodeId)">Customer Cones : {{ nodeInfo[targetNodeId]?.CONES }}</div>
          <div v-if="targetNodeId!=ASN && !isPrefix(targetNodeId)" > Hegemony : {{ nodeInfo[targetNodeId]?.HEGE.toFixed(2)  }}%</div>
        </div>

      </div>

    </div>

		<QSpinner v-if="loading" color="secondary" size="5em" class="spinner" />

		<h5 v-if="!loading && Object.keys(allNodes).length==0" class="text-center"> No data found</h5>

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
  margin-top: 20px;
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

.hegemonyLabel {
  transform: rotate(-90deg);
  font-size: 17px;
  font-weight: bold;
  margin-left: -9.3%;
  margin-right: -4.8%;
}

.controlPanel {
  display: flex;
  gap: 10px;
  position: absolute;
  top: 10px;
  right: 8%;
  z-index: 1;
}

.controlPanelButton {
  font-size: 13px;
  white-space: nowrap;
}

</style>