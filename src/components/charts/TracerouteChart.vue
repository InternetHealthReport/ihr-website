<script setup>
import { QBtn, QIcon, QInput, QSpinner, QRadio } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { VNetworkGraph } from "v-network-graph"
import * as vNG from "v-network-graph"
import RipeApi from "../../plugins/RipeApi"
import { convertUnixTimestamp, isPrivateIP, calculateMedian } from "../../plugins/tracerouteFunctions"

const props = defineProps({
  measurementID: {
    type: String
  },
  isLoading: {
    type: Boolean
  },
  nodes: {
    type: Object
  },
  selectedProbes: {
    type: Array
  },
  nodeSize: {
    type: Number
  },
  edges: {
    type: Object
  },
  layoutNodes: {
    type: Object
  },
  metaData: {
    type: Object
  },
  probeDetailsMap: {
    type: Object
  },
  minDisplayedRtt: {
    type: Number
  },
  maxDisplayedRtt: {
    type: Number
  },
  ipToAsnMap: {
    type: Object
  },
  asnList: {
    type: Array
  }
})

const emit = defineEmits(["updateDisplayedRttValues"])

const tooltipData = ref({})
const zoomLevel = ref(0)
const selectedNode = ref(null)
const displayMode = ref("normal")
const targetNodeId = ref("")
const graph = ref()
const tooltip = ref()
const tooltipOpacity = ref(0)
const tooltipPos = ref({ left: "0px", top: "0px" })
const highlightedEdges = ref({})
const asnColors = ref({})
const showAsnOverlay = ref(true)

const configs = computed(() => {
  assignAsnColors()
  return vNG.defineConfigs({
    node: {
      selectable: true,
      normal: {
        radius: props.nodeSize / 2,
        color: (node) => {
          if (displayMode.value === "rtt") {
            if (node.hops && node.hops.length > 0) {
              const medianRtt = calculateMedian(node.hops.map(hop => hop.rtt))
              return rttColor(medianRtt)
            } else {
              return "black"
            }
          }
          if (displayMode.value === "asn") {
            const asn = props.ipToAsnMap[node.label] || "unknown"
            return asnColors.value[asn] || "black"
          }
          if (node.isProbe) return "green"
          if (node.isNonResponsive) return "gray"
          if (node.isLastHop) return "red"
          if (isPrivateIP(node.label)) return "purple"
          return "blue"
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
  })
})

const eventHandlers = {
  "node:pointerover": ({ node }) => {},
  "node:pointerout": () => {},
  "view:click": () => {
    clearHighlight()
    tooltipOpacity.value = 0
  },
  "node:pointerdown": async ({ node }) => {
    clearHighlight()
    highlightPath(node)

    selectedNode.value = node
    targetNodeId.value = node

    await nextTick()

    const nodeInfo = props.nodes[node]
    let nodeMetaData
    if (!node.includes("*")) {
      nodeMetaData = (await RipeApi.prefixOverview(node)).data
      if (nodeMetaData.error === "LOCAL_STORAGE_FULL") {
        return handleLocalStorageFullError()
      }
    }
    const rttValues = nodeInfo.hops?.map(hop => hop.rtt)
    const sizeValues = nodeInfo.hops?.map(hop => hop.size)
    const ttlValues = nodeInfo.hops?.map(hop => hop.ttl)

    let nodeType = "Normal"
    let color = "blue"
    if (nodeInfo.isProbe) {
      nodeType = "Probe"
      color = "green"
    }
    if (nodeInfo.isNonResponsive) {
      nodeType = "Non Responsive"
      color = "gray"
    }
    if (nodeInfo.isLastHop) {
      nodeType = "Destination"
      color = "red"
    }
    if (nodeInfo.isPrivate) {
      nodeType = "Private"
      color = "purple"
    }

    let probeDetails
    Object.keys(props.probeDetailsMap).forEach(probeId => {
      if (props.probeDetailsMap[probeId].address_v4 === node || props.probeDetailsMap[probeId].address_v6 === node) {
        probeDetails = props.probeDetailsMap[probeId]
      }
    })

    tooltipData.value = {
      label: nodeInfo.label,
      medianRtt: calculateMedian(rttValues),
      medianSize: calculateMedian(sizeValues),
      medianTtl: calculateMedian(ttlValues),
      type: nodeType,
      color: color,
      ...nodeMetaData,
      ...probeDetails,
    }
    tooltipOpacity.value = 1

    await nextTick()

    if (tooltip.value) {
      const tooltipHeight = tooltip.value.offsetHeight
      const domPoint = graph.value.translateFromSvgToDomCoordinates(targetNodePos.value)
      tooltipPos.value = {
        left: `${domPoint.x - tooltip.value.offsetWidth / 2}px`,
        top: `${domPoint.y - props.nodeSize - tooltipHeight - 10}px`,
      }
    }
  },
}

const getRandomColor = () => {
    const letters = "0123456789ABCDEF"
    let color = "#"
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
    }
    return color
}

const assignAsnColors = () => {
    const colors = {}
    props.asnList.forEach(asn => {
        colors[asn] = getRandomColor()
    })
    asnColors.value = colors
}

const rttColor = (rtt) => {
  if (rtt === null || rtt === undefined) return "black"
  const normalized = Math.min(Math.max(rtt / props.maxDisplayedRtt, 0), 1)
  const green = Math.floor(255 * (1 - normalized))
  return `rgb(150, ${green}, 60)`
}

const highlightPath = (startNodeId) => {
  const path = []
  const visited = new Set()
  const queue = [[startNodeId, []]]

  while (queue.length > 0) {
    const [currentNodeId, currentPath] = queue.shift()

    if (visited.has(currentNodeId)) {
      continue
    }

    visited.add(currentNodeId)
    currentPath.push(currentNodeId)

    const outgoingEdges = Object.values(props.edges).filter(edge => edge.source === currentNodeId)
    if (outgoingEdges.length === 0) {
      path.push(...currentPath.map((node, index) => {
        if (index < currentPath.length - 1) {
          return `${node}-${currentPath[index + 1]}`
        }
      }).filter(edge => edge))
      break
    }

    outgoingEdges.forEach(edge => {
      if (!visited.has(edge.target)) {
        queue.push([edge.target, [...currentPath]])
      }
    })
  }

  highlightedEdges.value = Object.fromEntries(path.map(edgeId => [edgeId, true]))
}

const filteredAsnList = computed(() => {
  return props.asnList.filter(asn => asn && asnColors.value[asn])
})

const clearHighlight = () => {
  highlightedEdges.value = {}
}

const zoomIn = () => {
  zoomLevel.value *= 1.2
}

const zoomOut = () => {
  zoomLevel.value *= 0.8
}

const toggleFullScreen = () => {
  const graphContainer = document.querySelector(".graph-container")
  if (!document.fullscreenElement) {
    graphContainer.requestFullscreen().then(() => {
      graphContainer.style.background = "white"
    })
  } else {
    document.exitFullscreen().then(() => {
      graphContainer.style.background = "white"
    })
  }
}

const targetNodePos = computed(() => {
    const nodePos = props.layoutNodes.nodes[targetNodeId.value]
    return nodePos || { x: 0, y: 0 }
})

watch(
  () => [targetNodePos.value, tooltipOpacity.value],
  () => {
      if (!graph.value || !tooltip.value) return
      const domPoint = graph.value.translateFromSvgToDomCoordinates(targetNodePos.value)
      tooltipPos.value = {
          left: domPoint.x - tooltip.value.offsetWidth / 2 + "px",
          top: domPoint.y - props.nodeSize - tooltip.value.offsetHeight - 10 + "px",
      }
  },
  { deep: true }
)

watch(() => props.measurementID, () => {
  selectedNode.value = null
  displayMode.value = "normal"
  highlightedEdges.value = {}
  asnColors.value = {}
  showAsnOverlay.value = true
})

watch(displayMode, () => {
  emit("updateDisplayedRttValues")
})
</script>

<template>
  <div class="graph-container">
    <QSpinner v-if="isLoading" color="primary" />
    <VNetworkGraph ref="graph" :nodes="nodes" :edges="edges" :layouts="layoutNodes" :configs="configs"
      :event-handlers="eventHandlers" v-if="Object.keys(nodes).length > 0 && selectedProbes.length > 0 && !isLoading" v-model:zoom-level="zoomLevel" />
    <div v-else-if="!isLoading" class="placeholder-message">No graph data available.</div>
    <div v-if="selectedNode" ref="tooltip" class="tooltip" :style="{ ...tooltipPos, opacity: tooltipOpacity }">
      <div style="display: flex; align-items: center">
        <span class="nodeTypeDot" :style="{ backgroundColor: tooltipData.color }"></span>{{ tooltipData.type }}
      </div>
      <div><strong>Median RTT:</strong> {{ tooltipData.medianRtt ? tooltipData.medianRtt + "ms" : "Not available"}}</div>
      <div><strong>Median Size:</strong> {{ tooltipData.medianSize ? tooltipData.medianSize + " bytes" : "Not available"}}</div>
      <div><strong>Median TTL:</strong> {{ tooltipData.medianTtl ?? "Not available"}}</div>
      <div><strong>IP:</strong> {{ tooltipData.label }}</div>
      <div>
        <strong>AS: </strong> 
        <template v-if="tooltipData?.data?.asns[0]?.asn">
          <a :href="`/ihr/en/network/AS${tooltipData.data.asns[0].asn}`" target="_blank">
            {{ tooltipData.data.asns[0].asn }} ({{ tooltipData.data.asns[0].holder }})
          </a>
        </template>
        <template v-else>
          Not available
        </template>
      </div>
      <div><strong>Announced:</strong> {{ tooltipData?.data?.announced ?? "Not available"}}</div>
      <div><strong>Prefix:</strong> {{ tooltipData?.data?.block?.resource }}</div>
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
      <QBtn v-if="displayMode === 'asn'" flat dense @click="showAsnOverlay = !showAsnOverlay">
        ASN Overlay
      </QBtn>
    </div>
    <div v-if="displayMode === 'rtt' && Object.keys(nodes).length > 0" class="rtt-info-overlay">
      <div><span class="rtt-dot" :style="{ backgroundColor: rttColor(minDisplayedRtt) }"></span> <strong>Min RTT: </strong>{{ minDisplayedRtt ? minDisplayedRtt + " ms" : "Not available" }}</div>
      <div><span class="rtt-dot" :style="{ backgroundColor: rttColor(maxDisplayedRtt) }"></span> <strong>Max RTT: </strong>{{ maxDisplayedRtt ? maxDisplayedRtt + " ms" : "Not available" }}</div>
    </div>
    <div v-if="displayMode === 'rtt' && Object.keys(nodes).length > 0" class="legend">
      <div class="row items-center">
        <div class="col">
          <div class="rttLabel">RTT</div>
        </div>
        <div class="col">
          <div class="scaleLabel">0%</div>
          <div class="scale">
            <div v-for="(percentage, index) in Array.from({length: 10}, (_, i) => minDisplayedRtt + i * (maxDisplayedRtt - minDisplayedRtt) / 9)" :key="index" class="scaleColor" :style="{backgroundColor: rttColor(percentage)}"></div>
          </div>
          <div class="scaleLabel">100%</div>
        </div>
      </div>
    </div>
    <div v-if="displayMode === 'asn' && Object.keys(nodes).length > 0 && showAsnOverlay" class="asn-info-overlay" :style="{ width: `${Math.min(filteredAsnList.length * 120, 1100)}px` }">
      <div class="asn-grid">
        <div v-for="asn in filteredAsnList" :key="asn" :style="{ backgroundColor: asnColors[asn] }" class="asn-box">
          <a class="asn-link" :href="'/ihr/en/network/AS'+ asn" target="_blank">AS{{ asn }}</a>
        </div>
      </div>
    </div>
    <div class="view-control-overlay">
      <QBtn icon="zoom_in" @click="zoomIn" />
      <QBtn icon="zoom_out" @click="zoomOut" />
      <QBtn icon="fullscreen" @click="toggleFullScreen" />
    </div>
  </div>
</template>

<style>
.graph-container {
  height: 55vh;
  position: relative;
}

.placeholder-message {
  display: flex ;
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

.rtt-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 5px;
}

.legend {
  text-align: center;
  position: absolute;
  z-index: 1;
  top: 25%;
  right: 1%;
}

.rttLabel {
  transform: rotate(-90deg);
  font-size: 17px;
  font-weight: bold;
  margin-left: 50%;
}

.scaleLabel {
  font-size: 14px;
  text-align: center;
  margin-left: 12%;
}

.scaleColor {
  flex: 1;
  width: 100%;
}

.asn-info-overlay {
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
  font-size: 0.9em;
}

.asn-link {
  color: #fff;
  text-shadow: 1px 1px 2.5px rgba(0, 0, 0, 0.5);
}

.view-control-overlay {
  background-color: rgba(255, 255, 255, 0.8);
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.scale {
  display: flex;
  flex-direction: column;
  height: 250px;
  border: 1px solid #ccc;
  margin-left: 30%;
  margin-right: 30%;
}
</style>