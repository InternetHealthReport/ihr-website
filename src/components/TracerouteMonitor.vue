<script setup>
import { ref, inject, watchEffect, watch, onMounted } from "vue"
import { QBtn, QDialog, QCard, QCardSection, QCardActions, QExpansionItem } from "quasar"
import dagre from "dagre"
import RipeApi from "../plugins/RipeApi"
import TracerouteChart from "@/components/charts/TracerouteChart.vue"
import TracerouteRttChart from "@/components/charts/TracerouteRttChart.vue"
import TracerouteProbesTable from "@/components/tables/TracerouteProbesTable.vue"
import TracerouteDestinationsTable from "@/components/tables/TracerouteDestinationsTable.vue"
import { convertUnixTimestamp, isPrivateIP, calculateMedian } from "../plugins/tracerouteFunctions"
import GenericCardController from '@/components/controllers/GenericCardController.vue'

const props = defineProps({
  atlasMeasurementID: {
    type: String
  },
  openOptions: {
    type: Boolean,
    default: false
  }
})

const atlas_api = inject("atlas_api")
const isLoading = ref(false)
const measurementID = ref("")
const nodes = ref({})
const edges = ref({})
const timeRange = ref({ disable: true })
const leftLabelValue = ref("")
const rightLabelValue = ref("")
const nodeSize = 15
const selectedProbes = ref([])
const allProbes = ref([])
const probeDetailsMap = ref({})
const layoutNodes = ref({ nodes: {} })
const selectedDestinations = ref([])
const allDestinations = ref([])
const selectAllDestinations = ref(true)
const metaData = ref({})
const maxMedianRtt = ref(200)
const minDisplayedRtt = ref(null)
const maxDisplayedRtt = ref(null)
const asnList = ref([])
const ipToAsnMap = ref({})
const rttOverTime = ref([])
const intervalValue = ref(null)
const localStorageFullDialog = ref(false)
const localStorageClearing = ref(false)
const loadMeasurementErrorDialog = ref(false)
const loadMeasurementErrorMessage = ref("")

const handleClearStorage = () => {
  localStorage.clear()
  localStorageClearing.value = true
  setTimeout(() => {
    localStorageClearing.value = false
    localStorageFullDialog.value = false
    window.location.reload()
  }, 10000)
}

const handleCancel = () => {
  null
}

const handleLocalStorageFullError = () => {
  localStorageFullDialog.value = true
}

const handleLoadMeasurementError = (error) => {
  loadMeasurementErrorMessage.value = error.message || "An unexpected error occurred."
  loadMeasurementErrorDialog.value = true
}

const processData = async (tracerouteData, loadProbes = false) => {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: "LR", nodesep: 290, edgesep: 150, ranksep: 1000 })
  g.setDefaultEdgeLabel(() => ({}))

  const nonResponsiveNodes = new Set()
  const outgoingEdges = new Map()
  let highestMedianRtt = 0

  tracerouteData.forEach((probeData, probeIndex) => {
    if (probeData.result[0].error) {
      return
    }

    const sourceNodeId = probeData.from
    if (!g.hasNode(sourceNodeId)) {
      g.setNode(sourceNodeId, { label: sourceNodeId, width: nodeSize, height: nodeSize, isProbe: true })
    }

    let lastNodeId = sourceNodeId
    let finalHopNodeId = null
    let consecutiveStarCount = 0

    if (loadProbes) {
      if (!allProbes.value.includes(probeData.prb_id)) {
        allProbes.value.push(probeData.prb_id.toString())
        selectedProbes.value.push(probeData.prb_id.toString())
      }
      atlas_api.getProbeById(probeData.prb_id.toString()).then(data => {
        if (data.data.error === "LOCAL_STORAGE_FULL") {
          return handleLocalStorageFullError()
        }
        probeDetailsMap.value[probeData.prb_id.toString()] = data.data
      })
    }

    if (!allDestinations.value.includes(probeData.dst_addr)) {
      allDestinations.value.push(probeData.dst_addr)
      if (!nodes.value[probeData.dst_addr]) {
        nodes.value[probeData.dst_addr] = { label: probeData.dst_addr }
      }
      selectedDestinations.value.push(probeData.dst_addr)
    }

    probeData.result.forEach((hopData, hopIndex) => {
      hopData.result.forEach((result, resultIndex) => {
        let currentIp = result.from || result.x
        let isNonResponsive = false

        if (currentIp === "*") {
          consecutiveStarCount++
          if (consecutiveStarCount > 1) return
          currentIp += `-${probeIndex}-${hopIndex}-${resultIndex}`
          isNonResponsive = true
          nonResponsiveNodes.add(currentIp)
        } else {
          consecutiveStarCount = 0
        }

        if (isPrivateIP(currentIp)) {
          isNonResponsive = false
          consecutiveStarCount = 0
        }

        const nodeInfo = g.node(currentIp) || {}
        const newNodeInfo = {
          label: currentIp.replace(/-\d+-\d+-\d+$/, ""),
          width: nodeSize,
          height: nodeSize,
          isNonResponsive,
          isPrivate: isPrivateIP(currentIp),
          hops: nodeInfo.hops || [],
          asn: nodeInfo.asn || "unknown",
        }

        if (!newNodeInfo.isNonResponsive) {
          const asnPromise = RipeApi.userASN(newNodeInfo.label).then(asnData => {
            if (asnData.error === "LOCAL_STORAGE_FULL") {
              return handleLocalStorageFullError()
            }
            const asn = asnData.data.data.asns[0]
            if (asn) {
              if (!asnList.value.includes(asn)) {
                asnList.value.push(asn)
              }
              ipToAsnMap.value[newNodeInfo.label] = asn
            }
          })
        }

        newNodeInfo.hops.push({
          from: result.from,
          rtt: result.rtt,
          size: result.size,
          ttl: result.ttl,
        })

        if (result.rtt !== undefined && result.rtt !== null) {
          rttOverTime.value.push({ timestamp: probeData.timestamp, rtt: result.rtt })
        }

        const medianRtt = calculateMedian(newNodeInfo.hops.map(hop => hop.rtt))
        if (medianRtt > highestMedianRtt) {
          highestMedianRtt = medianRtt
        }

        g.setNode(currentIp, newNodeInfo)

        if (lastNodeId && currentIp && lastNodeId !== currentIp && !g.hasEdge(currentIp, lastNodeId)) {
          if (!g.hasEdge(lastNodeId, currentIp)) {
            g.setEdge(lastNodeId, currentIp)
            if (!outgoingEdges.has(lastNodeId)) {
              outgoingEdges.set(lastNodeId, [])
            }
            outgoingEdges.get(lastNodeId).push(currentIp)
          }
        }
        lastNodeId = currentIp
        finalHopNodeId = currentIp
      })
    })

    if (finalHopNodeId && g.hasNode(finalHopNodeId)) {
      const nodeInfo = g.node(finalHopNodeId)
      g.setNode(finalHopNodeId, { ...nodeInfo, isLastHop: true })
    }
  })

  nonResponsiveNodes.forEach(nodeId => {
      if (!outgoingEdges.has(nodeId)) {
          g.removeNode(nodeId)
      }
  })

  dagre.layout(g)

  const nodesMap = {}
  const edgesMap = {}
  const layouts = { nodes: {} }

  g.nodes().forEach(nodeId => {
      const nodeInfo = g.node(nodeId)
      nodesMap[nodeId] = { name: nodeInfo.label, ...nodeInfo }
      layouts.nodes[nodeId] = { x: nodeInfo.x, y: nodeInfo.y }
  })

  g.edges().forEach(edge => {
      const edgeInfo = g.edge(edge)
      edgesMap[`${edge.v}-${edge.w}`] = { source: edge.v, target: edge.w }
  })

  nodes.value = nodesMap
  edges.value = edgesMap
  layoutNodes.value = layouts

  maxMedianRtt.value = highestMedianRtt

  updateDisplayedRttValues()
}

const updateDisplayedRttValues = () => {
  let minRtt = Infinity
  let maxRtt = -Infinity
  let destinationNodeMedianRtt = null

  Object.values(nodes.value).forEach(node => {
    if (node.hops && node.hops.length > 0) {
      const medianRtt = calculateMedian(node.hops.map(hop => hop.rtt).filter(rtt => rtt !== undefined))
      if (medianRtt !== null) {
        minRtt = Math.min(minRtt, medianRtt)
        if (node.isLastHop) {
          destinationNodeMedianRtt = medianRtt
        }
      }
    }
  })

  minDisplayedRtt.value = minRtt === Infinity ? null : minRtt
  maxDisplayedRtt.value = destinationNodeMedianRtt !== null ? destinationNodeMedianRtt : (maxRtt === -Infinity ? null : maxRtt)
}

watch(nodes, updateDisplayedRttValues)


const loadMeasurement = async () => {
  measurementID.value = props.atlasMeasurementID
  nodes.value = {}
  edges.value = {}
  
  metaData.value = {}
  timeRange.value = { disable: true }
  leftLabelValue.value = ""
  rightLabelValue.value = ""
  
  selectedProbes.value = []
  allProbes.value = []
  probeDetailsMap.value = {}
  
  layoutNodes.value = { nodes: {} }
  selectedDestinations.value = []
  allDestinations.value = []
  asnList.value = []
  ipToAsnMap.value = {}
  
  rttOverTime.value = []
  intervalValue.value = null

  if (measurementID.value.trim()) {
    isLoading.value = true
    try {
      const fetchedMetaData = (await atlas_api.getMeasurementById(measurementID.value)).data
      if (fetchedMetaData.error === "LOCAL_STORAGE_FULL") {
        return handleLocalStorageFullError()
      }

      metaData.value = fetchedMetaData

      if (fetchedMetaData.status.name === "Ongoing") {
        fetchedMetaData.stop_time = Math.floor(Date.now() / 1000)
      }

      let startTime = fetchedMetaData.start_time
      const stopTime = fetchedMetaData.stop_time

      if ((stopTime - startTime) > 24 * 3600) {
        startTime = stopTime - 24 * 3600
      }

      timeRange.value.min = startTime
      timeRange.value.max = stopTime

      leftLabelValue.value = convertUnixTimestamp(startTime)
      rightLabelValue.value = convertUnixTimestamp(stopTime)

      timeRange.value.disable = false

      intervalValue.value = fetchedMetaData.interval || null

      await loadMeasurementData(true)

      selectedDestinations.value = allDestinations.value
      selectAllDestinations.value = true
    } catch (error) {
      console.log(error)
      handleLoadMeasurementError(error)
    } finally {
      isLoading.value = false
    }
  }
}

const loadMeasurementData = async (loadProbes = false) => {
  if (measurementID.value.trim()) {
    isLoading.value = true
    try {
      if (loadProbes) {
        allProbes.value = []
        selectedProbes.value = []
        allDestinations.value = []
        selectedDestinations.value = []
      }

      const params = {}

      if (!timeRange.value.disable) {
        params.start_time = timeRange.value.min
        params.stop_time = timeRange.value.max
      }

      if (selectedProbes.value.length > 0) {
        params.probe_ids = selectedProbes.value.join(",")
      }

      const data = (await atlas_api.getMeasurementData(measurementID.value, params)).data
      if (data.error === "LOCAL_STORAGE_FULL") {
        return handleLocalStorageFullError()
      }

      const filteredData = data.filter(item => 
        selectedDestinations.value.length === 0 || selectedDestinations.value.includes(item.dst_addr)
      )
      
      processData(filteredData, loadProbes)
    } catch (error) {
      console.error("Failed to load measurement data:", error)
    } finally {
      isLoading.value = false
    }
  }
}

const debounce = (func, wait) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

const loadMeasurementOnTimeRange = debounce((e) => {
  leftLabelValue.value = convertUnixTimestamp(e.min)
  rightLabelValue.value = convertUnixTimestamp(e.max)
  loadMeasurementData()
}, 3000)

const loadMeasurementOnProbeChange = debounce(() => {
  loadMeasurementData()
}, 1000)

const loadMeasurementOnDestinationChange = debounce(() => {
  loadMeasurementData()
}, 1000)

const loadMeasurementOnSearchQuery = debounce(() => {
  loadMeasurementData()
}, 1000)

watchEffect(() => {
  if (selectedProbes.value.length > 0) {
    loadMeasurementOnProbeChange()
  }
})

watchEffect(() => {
  if (!timeRange.value.disable) {
    loadMeasurementOnTimeRange(timeRange.value)
  }
})

watchEffect(() => {
  if (selectedDestinations.value.length > 0) {
    loadMeasurementOnDestinationChange()
  }
})

const setSelectedProbes = (value) => {
  selectedProbes.value = value
}

const setSelectedDestinations = (value) => {
  selectedDestinations.value = value
}

watch(() => props.atlasMeasurementID, () => {
  loadMeasurement()
})
</script>

<template>
  <GenericCardController
    title="$t('bgpAsPaths.title')"
    sub-title="$t('bgpAsPaths.subTitle')"
    info-title="$t('bgpAsPaths.info.title')"
    info-description="$t('bgpAsPaths.info.description')"
  >
    <TracerouteChart
      :measurementID="measurementID"
      :isLoading="isLoading"
      :nodes="nodes"
      :selectedProbes="selectedProbes"
      :nodeSize="nodeSize"
      :edges="edges"
      :layoutNodes="layoutNodes"
      :metaData="metaData"
      :probeDetailsMap="probeDetailsMap"
      :minDisplayedRtt="minDisplayedRtt"
      :maxDisplayedRtt="maxDisplayedRtt"
      :ipToAsnMap="ipToAsnMap"
      :asnList="asnList"
      @updateDisplayedRttValues="updateDisplayedRttValues"
    />
    <QExpansionItem
      :default-opened="props.openOptions"
      icon="tune"
      label="Options"
    >
      <GenericCardController
        title="$t('bgpAsPaths.title')"
        sub-title="$t('bgpAsPaths.subTitle')"
        info-title="$t('bgpAsPaths.info.title')"
        info-description="$t('bgpAsPaths.info.description')"
        class="cardTraceroute"
      >
        <TracerouteRttChart 
          :intervalValue="intervalValue"
          :timeRange="timeRange"
          :metaData="metaData"
          :leftLabelValue="leftLabelValue"
          :rightLabelValue="rightLabelValue"
          :rttOverTime="rttOverTime"
          @loadMeasurementOnTimeRange="loadMeasurementOnTimeRange"
        />
      </GenericCardController>
      <GenericCardController
        title="$t('bgpAsPaths.title')"
        sub-title="$t('bgpAsPaths.subTitle')"
        info-title="$t('bgpAsPaths.info.title')"
        info-description="$t('bgpAsPaths.info.description')"
        class="cardTraceroute"
      >
        <TracerouteProbesTable
          :nodes="nodes"
          :allProbes="allProbes"
          :probeDetailsMap="probeDetailsMap"
          :selectedProbes="selectedProbes"
          @setSelectedProbes="setSelectedProbes"
          @loadMeasurementOnSearchQuery="loadMeasurementOnSearchQuery"
        />
      </GenericCardController>
      <GenericCardController
        title="$t('bgpAsPaths.title')"
        sub-title="$t('bgpAsPaths.subTitle')"
        info-title="$t('bgpAsPaths.info.title')"
        info-description="$t('bgpAsPaths.info.description')"
      >
        <TracerouteDestinationsTable
          :nodes="nodes"
          :allDestinations="allDestinations"
          :selectAllDestinations="selectAllDestinations"
          :ipToAsnMap="ipToAsnMap"
          :selectedDestinations="selectedDestinations"
          @setSelectedDestinations="setSelectedDestinations"
          @loadMeasurementOnSearchQuery="loadMeasurementOnSearchQuery"
        />
      </GenericCardController>
    </QExpansionItem>
  </GenericCardController>
  <QDialog v-model="localStorageFullDialog">
    <QCard>
      <QCardSection>
        <div class="text-h6">Local Storage Full</div>
      </QCardSection>
      <QCardSection class="q-pt-none">
        Your browser's local storage cache is full. Would you like to clear it to continue?
        <br>
        <span v-if="localStorageClearing">Clearing cache...</span>
      </QCardSection>
      <QCardActions align="right">
        <QBtn v-if="!localStorageClearing" flat label="Cancel" color="primary" @click="handleCancel" />
        <QBtn v-if="!localStorageClearing" flat label="Clear Storage" color="primary" @click="handleClearStorage" />
      </QCardActions>
    </QCard>
  </QDialog>
  <QDialog v-model="loadMeasurementErrorDialog">
    <QCard>
      <QCardSection>
        <div class="text-h6">Error Loading Measurement</div>
      </QCardSection>
      <QCardSection class="q-pt-none">
        {{ loadMeasurementErrorMessage }}
      </QCardSection>
      <QCardActions align="right">
        <QBtn flat label="Close" color="primary" @click="loadMeasurementErrorDialog = false" />
      </QCardActions>
    </QCard>
  </QDialog>
</template>

<style scoped>
.cardTraceroute{
  margin-bottom: 20px;
}
</style>
