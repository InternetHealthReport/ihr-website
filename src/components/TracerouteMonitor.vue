<script setup>
import { ref, inject, watchEffect, watch } from 'vue'
import {
  QExpansionItem,
  QSeparator,
  QInput,
  QBtn,
  useQuasar,
  QDialog,
  QCard,
  QCardSection,
  QCardActions,
  QBadge
} from 'quasar'
import dagre from 'dagre'
import TracerouteChart from '@/components/charts/TracerouteChart.vue'
import TracerouteRttChart from '@/components/charts/TracerouteRttChart.vue'
import TracerouteProbesTable from '@/components/tables/TracerouteProbesTable.vue'
import TracerouteDestinationsTable from '@/components/tables/TracerouteDestinationsTable.vue'
import {
  isPrivateIP,
  calculateMedian,
  convertDateTimeToSeconds,
  convertUnixTimestamp
} from '../plugins/tracerouteFunctions'
import GenericCardController from '@/components/controllers/GenericCardController.vue'

const $q = useQuasar()

const props = defineProps({
  atlasMeasurementID: {
    type: String
  },
  isComponent: {
    type: Boolean,
    default: false
  },
  probeIDs: {
    type: Array
  },
  destinationIPs: {
    type: Array
  },
  startTime: {
    type: String
  },
  stopTime: {
    type: String
  }
})

const atlas_api = inject('atlas_api')
const ripe_api = inject('ripe_api')
const isLoadingChart = ref(false)
const isLoadingRtt = ref(false)
const isLoadingProbes = ref(false)
const isLoadingDestinations = ref(false)
const measurementID = ref('')
const nodes = ref({})
const edges = ref({})
const timeRange = ref({ disable: true })
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
const nodeSet = ref(new Set())
const measurementIDInput = ref('')
const fallbackStopTime = ref(Math.floor(Date.now() / 1000))
const isProbeOverflowAlert = ref(false)
const showProbeOverflowAlert = ref(false)
const showErrorOverflowAlert = ref(false)
const loadMeasurementIDError = ref(false)
const loadProbesDestinationsError = ref(false)

const startTimestamp = ref(convertDateTimeToSeconds(props.startTime))
const stopTimestamp = ref(convertDateTimeToSeconds(props.stopTime))

const isOneOff = ref(false)

// re-emitting events from children to grand parent
const emit = defineEmits([
  'setSelectedDestinations',
  'setSelectedProbes',
  'setSelectedTimeRange',
  'loadMeasurement',
  'clearSelectedProbes',
])

const processData = async (tracerouteData, loadProbes = false) => {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'LR', nodesep: 290, edgesep: 150, ranksep: 1000 })
  g.setDefaultEdgeLabel(() => ({}))

  const nonResponsiveNodes = new Set()
  const outgoingEdges = new Map()
  let highestMedianRtt = 0

  allProbes.value =
    allProbes.value.length == 0
      ? await atlas_api.getProbesByMeasurementId(measurementID.value)
      : allProbes.value
  atlas_api
    .getProbesByIds(
      allProbes.value.slice(0, 1000),
      measurementID.value,
      allProbes.value.length >= 1000
    )
    .then((data) => {
      data.forEach((x) => {
        probeDetailsMap.value[x.id.toString()] = x
      })
      isLoadingProbes.value = false
    })
  atlas_api
    .getProbesByIds(selectedProbes.value, measurementID.value, selectedProbes.value.length >= 1000)
    .then((data) => {
      data.forEach((x) => {
        probeDetailsMap.value[x.id.toString()] = x
      })
      isLoadingProbes.value = false
    })

  isProbeOverflowAlert.value = allProbes.value.length > 1000

  tracerouteData.forEach((probeData, probeIndex) => {
    if (probeData.result[0].error) {
      return
    }

    const sourceNodeId = probeData.from
    if (!g.hasNode(sourceNodeId)) {
      g.setNode(sourceNodeId, {
        label: sourceNodeId,
        width: nodeSize,
        height: nodeSize,
        isProbe: true
      })
    }

    let lastNodeId = sourceNodeId
    let finalHopNodeId = null
    let consecutiveStarCount = 0

    if (loadProbes) {
      if (
        (!props.probeIDs ||
          props.probeIDs.length === 0 ||
          props.probeIDs.includes(probeData.prb_id.toString())) &&
        !selectedProbes.value.includes(probeData.prb_id.toString())
      ) {
        selectedProbes.value.push(probeData.prb_id.toString())
      }
    }

    if (!allDestinations.value.includes(probeData.dst_addr)) {
      allDestinations.value.push(probeData.dst_addr)
    }

    if (!(selectAllDestinations.value || selectedDestinations.value.includes(probeData.dst_addr))) {
      return
    }

    probeData.result.forEach((hopData, hopIndex) => {
      hopData.result.forEach((result, resultIndex) => {
        let currentIp = result.from || result.x
        let isNonResponsive = false

        if (currentIp === '*') {
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
          label: currentIp.replace(/-\d+-\d+-\d+$/, ''),
          width: nodeSize,
          height: nodeSize,
          isNonResponsive,
          isPrivate: isPrivateIP(currentIp),
          hops: nodeInfo.hops || [],
          asn: nodeInfo.asn || 'unknown'
        }

        if (!newNodeInfo.isNonResponsive && !nodeSet.value.has(newNodeInfo.label)) {
          nodeSet.value.add(newNodeInfo.label)
          ripe_api.userASN(newNodeInfo.label).then((asnData) => {
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
          ttl: result.ttl
        })

        if (result.rtt !== undefined && result.rtt !== null) {
          rttOverTime.value.push({ timestamp: probeData.timestamp, rtt: result.rtt })
        }

        const medianRtt = calculateMedian(newNodeInfo.hops.map((hop) => hop.rtt))
        if (medianRtt > highestMedianRtt) {
          highestMedianRtt = medianRtt
        }

        g.setNode(currentIp, newNodeInfo)

        if (
          lastNodeId &&
          currentIp &&
          lastNodeId !== currentIp &&
          !g.hasEdge(currentIp, lastNodeId)
        ) {
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

  nonResponsiveNodes.forEach((nodeId) => {
    if (!outgoingEdges.has(nodeId)) {
      g.removeNode(nodeId)
    }
  })

  dagre.layout(g)

  const nodesMap = {}
  const edgesMap = {}
  const layouts = { nodes: {} }

  g.nodes().forEach((nodeId) => {
    const nodeInfo = g.node(nodeId)
    nodesMap[nodeId] = { name: nodeInfo.label, ...nodeInfo }
    layouts.nodes[nodeId] = { x: nodeInfo.x, y: nodeInfo.y }
  })

  g.edges().forEach((edge) => {
    const edgeInfo = g.edge(edge)
    edgesMap[`${edge.v}-${edge.w}`] = { source: edge.v, target: edge.w }
  })

  nodes.value = nodesMap
  edges.value = edgesMap
  layoutNodes.value = layouts

  maxMedianRtt.value = highestMedianRtt
  maxDisplayedRtt.value = highestMedianRtt

  updateDisplayedRttValues()
}

const updateDisplayedRttValues = () => {
  let minRtt = Infinity
  let maxRtt = -Infinity
  let destinationNodeMedianRtt = null

  Object.values(nodes.value).forEach((node) => {
    if (node.hops && node.hops.length > 0) {
      const medianRtt = calculateMedian(
        node.hops.map((hop) => hop.rtt).filter((rtt) => rtt !== undefined)
      )
      if (medianRtt !== null) {
        minRtt = Math.min(minRtt, medianRtt)
        if (node.isLastHop) {
          destinationNodeMedianRtt = medianRtt
        }
      }
    }
  })

  minDisplayedRtt.value = minRtt === Infinity ? null : minRtt
  maxDisplayedRtt.value =
    destinationNodeMedianRtt !== null
      ? destinationNodeMedianRtt
      : maxRtt === -Infinity
        ? null
        : maxRtt
}

watch(nodes, updateDisplayedRttValues)

const loadMeasurement = async () => {
  loadMeasurementIDError.value = false
  measurementID.value = props.atlasMeasurementID
  measurementIDInput.value = props.atlasMeasurementID
  nodes.value = {}
  edges.value = {}

  metaData.value = {}
  timeRange.value = { disable: true }

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
    isLoadingChart.value = true
    isLoadingRtt.value = true
    isLoadingProbes.value = true
    isLoadingDestinations.value = true
    try {
      const fetchedMetaData = (await atlas_api.getMeasurementById(measurementID.value)).data

      metaData.value = fetchedMetaData

      if (fetchedMetaData.status.name === 'Ongoing') {
        fetchedMetaData.stop_time = Math.floor(Date.now() / 1000)
      }
      
      const isMeasurementOneOff = metaData.value['interval'] > 0 ? false : true 
      
      let startTime = 0
      let stopTime = 0

      if(isMeasurementOneOff == false) {
        stopTime = stopTimestamp.value !== 0 ? stopTimestamp : metaData.value.stop_time
  
  
        // Fetch last 5 measurements
        const shortenedDurationStartTime = stopTime - 5 * metaData.value['interval']
        startTime =
          startTimestamp.value !== 0
            ? startTimestamp
            : shortenedDurationStartTime > 0
              ? shortenedDurationStartTime
              : metaData.value.start_time
        
        timeRange.value.min = startTime
        timeRange.value.max = stopTime
        timeRange.value.disable = false
      } else {
        timeRange.value.disable = true
      }

      intervalValue.value = fetchedMetaData.interval || null

      await loadMeasurementData(true, isMeasurementOneOff)

      if (selectedDestinations.value === null || selectedDestinations.value.length === 0) {
        selectedDestinations.value = allDestinations.value
        selectAllDestinations.value = true
      } else {
        selectAllDestinations.value = null
      }

      isOneOff.value = isMeasurementOneOff
    } catch (error) {
      isLoadingProbes.value = false
      loadMeasurementIDError.value = true
      showErrorOverflowAlert.value = true
    } finally {
      isLoadingChart.value = false
      isLoadingRtt.value = false
      isLoadingDestinations.value = false
    }
  }
}

const loadMeasurementData = async (loadProbes = false) => {
  loadProbesDestinationsError.value = false
  if (measurementID.value.trim()) {
    isLoadingChart.value = true
    isLoadingRtt.value = true
    isLoadingProbes.value = true
    isLoadingDestinations.value = true
    try {
      if (loadProbes) {
        allProbes.value = []
        allDestinations.value = []
      }

      const params = {}

      if (!timeRange.value.disable) {
        if (timeRange.value.min > 0) {
          params.start = timeRange.value.min
        }

        if (timeRange.value.max > 0) {
          params.stop = timeRange.value.max
        } else {
          params.stop = fallbackStopTime.value
        }
      }

      if (selectedProbes.value.length > 0) {
        params.probe_ids = selectedProbes.value.join(',')
      }
      const data = await atlas_api.getAndCacheMeasurementDataInChunks(measurementID.value, params)

      processData(data, loadProbes)
    } catch (error) {
      // console.log('Failed to load measurement:', measurementID.value)
      isLoadingProbes.value = false
      loadProbesDestinationsError.value = true
      showErrorOverflowAlert.value = true
    } finally {
      isLoadingChart.value = false
      isLoadingRtt.value = false
      isLoadingDestinations.value = false
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
  isLoadingRtt.value = true
  if (e.min !== 0 && e.max !== 0) {
    const queryParamObject = {
      startTime: convertUnixTimestamp(e.min, true),
      stopTime: convertUnixTimestamp(e.max, true)
    }
    emit('setSelectedTimeRange', queryParamObject)
  }

  // On slider update, update the measurement data
  timeRange.value.min = e.min
  timeRange.value.max = e.max
  loadMeasurementData().finally(() => {
    isLoadingRtt.value = false
  })
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

const sortAndCompare = (arrA, arrB) => {
  if (arrA.length !== arrB.length) {
    return false
  }

  const N = arrA.length
  const compareFunc = (a, b) => +a - +b
  const sortedArrA = arrA.sort(compareFunc)
  const sortedArrB = arrB.sort(compareFunc)

  for (let i = 0; i < N; i++) {
    if (sortedArrA[i] !== sortedArrB[i]) {
      return false
    }
  }

  return true
}

watchEffect(() => {
  if (selectedProbes.value.length > 0) {
    loadMeasurementOnProbeChange()
    if (!sortAndCompare(props.probeIDs, selectedProbes.value)) {
      emit('setSelectedProbes', selectedProbes.value)
    }
  }
})

const clearSelectedProbes = () => {
  selectedProbes.value.length = 0
  emit('clearSelectedProbes')
}

watch(
  () => props.probeIDs,
  (newArr, oldArr) => {
    if (!sortAndCompare(newArr, oldArr) && !sortAndCompare(newArr, selectedProbes.value)) {
      selectedProbes.value = newArr
    }
  }
)

watch(
  () => props.destinationIPs,
  () => {
    selectedDestinations.value = props.destinationIPs
  }
)

watch(
  () => props.startTime,
  () => {
    startTimestamp.value = convertDateTimeToSeconds(props.startTime)
  }
)

watch(
  () => props.stopTime,
  () => {
    stopTimestamp.value = convertDateTimeToSeconds(props.stopTime)
  }
)

watch(
  allDestinations,
  () => {
    $q.notify({
      message: 'New traceroute destinations have been added.',
      color: 'primary',
      position: 'bottom',
      actions: [
        {
          icon: 'close',
          'aria-label': 'Dismiss',
          color: 'white'
        }
      ]
    })
  },
  { deep: true }
)

watchEffect(() => {
  if (!timeRange.value.disable) {
    loadMeasurementOnTimeRange(timeRange.value)
  }
})

watchEffect(() => {
  if (selectedDestinations.value.length > 0) {
    loadMeasurementOnDestinationChange()
    emit('setSelectedDestinations', selectedDestinations.value)
  }
})

const setSelectedProbes = (value) => {
  selectedProbes.value = value
}

const setSelectedDestinations = (value) => {
  selectedDestinations.value = value
}

const setSelectAllDestinations = (value) => {
  selectAllDestinations.value = value
}

watch(
  () => props.atlasMeasurementID,
  () => {
    loadMeasurement()
  }
)
</script>

<template>
  <div>
    <GenericCardController
      :title="$t('tracerouteMonitorChart.title')"
      :sub-title="$t('tracerouteMonitorChart.subTitle')"
      :info-title="$t('tracerouteMonitorChart.info.title')"
      :info-description="$t('tracerouteMonitorChart.info.description')"
    >
      <div class="row q-mb-md">
        <div class="col-3 q-mr-md">
          <div v-if="!props.isComponent" class="row justify-end q-mb-md">
            <div class="col q-mr-md">
              <QInput
                v-model="measurementIDInput"
                outlined
                placeholder="RIPE ATLAS traceroute measurement ID"
                :dense="true"
                color="accent"
                :autofocus="true"
              />
            </div>
            <div class="col-auto">
              <QBtn
                label="Load"
                color="primary"
                @click="emit('loadMeasurement', measurementIDInput)"
              />
            </div>
          </div>
          <div v-if="metaData.target">
            <div class="row justify-between">
              <div class="col text-h6">
                <strong>Measurement details:</strong>
              </div>
              <div class="col-auto" v-if="isProbeOverflowAlert">
                <QBtn
                  @click="showProbeOverflowAlert = true"
                  icon="warning"
                  text-color="red"
                  outline
                />
              </div>
            </div>
            <div class="row">
              <ul>
                <li>
                  Traceroute to <strong>{{ metaData.target }}</strong
                  >.
                </li>
                <li>
                  Measuring from <strong>{{ convertUnixTimestamp(metaData.start_time) }}</strong> to
                  <strong>{{ convertUnixTimestamp(metaData.stop_time) }}</strong>
                </li>
                <li v-if="isOneOff == false">
                  Frequency: {{ metaData.interval }} seconds
                </li>
              </ul>
              <div>
                <div class="col text-h6">
                  <strong>RTT Chart and Network graph:</strong>
                </div>
                <ul>
                  <li v-if="isOneOff == false">
                    Showing from
                    <strong>{{ convertUnixTimestamp(timeRange.min) }}</strong> to
                    <strong>{{ convertUnixTimestamp(timeRange.max) }}</strong>
                  </li>
                  <li>
                    Selected probes: <strong>{{ selectedProbes.length }}</strong> (Out of {{ allProbes.length }})
                  </li>
                  <li>Selected destinations: <strong>{{ selectedDestinations.length }}</strong></li>
                </ul>
              </div>
            </div>
          </div>
          <div v-else>
            <div class="text-body2 measurementInputInfo">
              Please enter a RIPE Atlas Traceroute Measurement from
              <a href="https://atlas.ripe.net/measurements/public?type=traceroute" target="_blank"
                >this link</a
              >
              in the above input box
            </div>
          </div>
        </div>
        <QSeparator :vertical="true" />
        <div class="col q-ml-md">
          <TracerouteRttChart
            :interval-value="intervalValue"
            :is-loading="isLoadingRtt"
            :time-range="timeRange"
            :is-one-off="isOneOff"
            :min-rtt="minDisplayedRtt"
            :max-rtt="maxDisplayedRtt"
            :meta-data="metaData"
            :rtt-over-time="rttOverTime"
            @load-measurement-on-time-range="loadMeasurementOnTimeRange"
          />
        </div>
      </div>
      <QSeparator />
      <TracerouteChart
        :measurement-i-d="measurementID"
        :is-loading="isLoadingChart"
        :nodes="nodes"
        :selected-probes="selectedProbes"
        :node-size="nodeSize"
        :edges="edges"
        :layout-nodes="layoutNodes"
        :meta-data="metaData"
        :probe-details-map="probeDetailsMap"
        :min-displayed-rtt="minDisplayedRtt"
        :max-displayed-rtt="maxDisplayedRtt"
        :ip-to-asn-map="ipToAsnMap"
        :asn-list="asnList"
        @update-displayed-rtt-values="updateDisplayedRttValues"
        class="q-mt-md"
      />
      <QExpansionItem
        :default-opened="!props.isComponent"
        icon="tune"
        label="Probes & Destinations"
      >
        <GenericCardController
          :title="$t('tracerouteMonitorProbes.title')"
          :sub-title="$t('tracerouteMonitorProbes.subTitle')"
          :info-title="$t('tracerouteMonitorProbes.info.title')"
          :info-description="$t('tracerouteMonitorProbes.info.description')"
          class="cardTraceroute"
        >
          <TracerouteProbesTable
            :nodes="nodes"
            :all-probes="allProbes"
            :probe-details-map="probeDetailsMap"
            :selected-probes="selectedProbes"
            :is-loading="isLoadingProbes"
            @set-selected-probes="setSelectedProbes"
            @clear-selected-probes="clearSelectedProbes"
            @load-measurement-on-search-query="loadMeasurementOnSearchQuery"
          />
        </GenericCardController>
        <GenericCardController
          :title="$t('tracerouteMonitorDestinations.title')"
          :sub-title="$t('tracerouteMonitorDestinations.subTitle')"
          :info-title="$t('tracerouteMonitorDestinations.info.title')"
          :info-description="$t('tracerouteMonitorDestinations.info.description')"
        >
          <TracerouteDestinationsTable
            :nodes="nodes"
            :all-destinations="allDestinations"
            :select-all-destinations="selectAllDestinations"
            :ip-to-asn-map="ipToAsnMap"
            :selected-destinations="selectedDestinations"
            :is-loading="isLoadingDestinations"
            @set-selected-destinations="setSelectedDestinations"
            @set-select-all-destinations="setSelectAllDestinations"
            @load-measurement-on-search-query="loadMeasurementOnSearchQuery"
          />
        </GenericCardController>
      </QExpansionItem>
    </GenericCardController>
    <QDialog v-model="showProbeOverflowAlert">
      <QCard>
        <QCardSection>
          <div class="text-body2">
            <div class="text-weight-bold">
              RIPE ATLAS Measurement ID
              <QBadge color="primary" class="text-weight-bold">{{ measurementID }}</QBadge>
            </div>
            This measurement is a large one. Here are a few important points to note about large
            measurements:
            <ul>
              <li>
                There are more than 1,000 probes involved in this measurement. Currently, the
                application limits the number of probes displayed to 1,000.
              </li>
              <li>
                Updating the RTT chart's time slider will prompt the application to load a larger
                amount of data, which may result in increased latency.
              </li>
            </ul>
          </div>
        </QCardSection>
        <QCardActions align="right">
          <QBtn v-close-popup flat label="Close" />
        </QCardActions>
      </QCard>
    </QDialog>
    <QDialog v-model="showErrorOverflowAlert">
      <QCard>
        <QCardSection>
          <div class="text-body2">
            <div class="text-weight-bold">
              RIPE ATLAS Measurement ID
              <QBadge color="primary" class="text-weight-bold">{{ measurementID }}</QBadge>
            </div>
            <div v-if="loadMeasurementIDError">Maybe the measurement does not exist.</div>
            <div v-if="loadProbesDestinationsError">
              Maybe the given probes or destinations do not correspond with the given measurement.
            </div>
          </div>
        </QCardSection>
        <QCardActions align="right">
          <QBtn v-close-popup flat label="Close" />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<style scoped>
.cardTraceroute {
  margin-bottom: 20px;
}
.measurementInputInfo {
  color: red;
}
</style>
