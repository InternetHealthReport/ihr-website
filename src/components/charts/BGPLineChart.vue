<script setup>
import {
  QBadge,
  QBtn,
  QSlider,
  QSpinner,
  QExpansionItem,
  QItemSection,
  QCard,
  QCardActions,
  QIcon
} from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch, onUnmounted } from 'vue'
import report from '@/plugins/report'
import '@/styles/chart.css'
import BGPVrpsTable from '../tables/BGPVrpsTable.vue'

const props = defineProps({
  rawMessages: {
    type: Array,
    default: () => []
  },
  usedMessagesCount: {
    type: Number
  },
  isLiveMode: {
    type: Boolean
  },
  isPlaying: {
    type: Boolean
  },
  isLoadingBgplayData: {
    type: Boolean
  },
  dataSource: {
    type: String
  },
  minTimestamp: {
    type: Number
  },
  maxTimestamp: {
    type: Number
  },
  datesTrace: {
    type: Array,
    default: () => []
  },
  announcementsTrace: {
    type: Array,
    default: () => []
  },
  withdrawalsTrace: {
    type: Array,
    default: () => []
  },
  announcementsPeersTraces: {
    type: Object,
    default: () => ({})
  },
  rpkiStatusTraces: {
    type: Object,
    default: () => ({})
  },
  isNoVrpData: {
    type: Boolean,
    default: false
  },
  vrpTableData: {
    type: Array,
    default: () => []
  },
  currentIndex: {
    type: Number,
    default: -1
  },
  usingIndex: {
    type: Boolean,
    default: false
  },
  initialStateDataCount: {
    type: Number
  }
})

const emit = defineEmits([
  'setSelectedMaxTimestamp',
  'disable-live-mode',
  'enable-live-mode',
  'disable-using-index',
  'prev-event',
  'next-event'
])

const { utcString } = report()

const announcementsAndWithdrawnChartData = ref([])
const announcementsPeersChartData = ref([])
const rpkiStatusChartData = ref([])

const selectedMaxTimestamp = ref(0)
const sliderWidthInit = ref(false)
const isHidden = ref(false)
const prevNextElement = ref(null)

let observer = null

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
}

// Update the time range
const updateTimeRange = () => {
  if (props.dataSource === 'ris-live') {
    if (props.isLiveMode) {
      selectedMaxTimestamp.value = props.maxTimestamp
    }
  } else {
    selectedMaxTimestamp.value = props.minTimestamp
  }
}

const defaultLayout = {
  legend: {
    orientation: 'h',
    y: 1.1,
    x: 0.5,
    xanchor: 'center',
    yanchor: 'bottom'
  },
  shapes: [],
  showlegend: true,
  xaxis: { autorange: true },
  yaxis: { autorange: true, rangemode: 'tozero' }
}

const lineChartLayout = {
  ...defaultLayout,
  hovermode: 'x'
}

const rpkiLayout = {
  ...defaultLayout,
  height: 500,
  barmode: 'stack',
  yaxis: {
    tickfont: {
      size: 8
    },
    dtick: 1
  }
}

const renderAnnouncementsAndWithdrawnChart = async (
  dates,
  announcementsTrace,
  withdrawalsTrace
) => {
  const data = [
    {
      x: dates,
      y: withdrawalsTrace,
      type: 'scattergl',
      mode: 'markers',
      fill: 'tozeroy',
      fillcolor: 'rgba(255, 127, 14, 0.5)',
      marker: {
        color: 'rgba(255, 127, 14, 0.5)'
      },
      name: 'Withdrawals'
    },
    {
      x: dates,
      y: announcementsTrace,
      type: 'scattergl',
      fill: 'tozeroy',
      fillcolor: 'rgba(31, 119, 180, 0.5)',
      marker: {
        color: 'rgba(31, 119, 180, 0.5)'
      },
      mode: 'markers',
      name: 'Announcements'
    }
  ]
  announcementsAndWithdrawnChartData.value = data
}

const renderAnnouncementsPeersChart = async (dates, announcementsPeersTraces) => {
  const data = []
  let colorIndex = 0

  for (const [asn, yValues] of Object.entries(announcementsPeersTraces)) {
    colorIndex++
    data.push({
      x: dates,
      y: yValues,
      stackgroup: 'one',
      type: 'scatter',
      mode: 'markers',
      name: `AS${asn}`
    })
  }
  announcementsPeersChartData.value = data
}

const renderRpkiStatusChart = async (rpkiStatusTraces) => {
  const data = []

  for (const [status, { y, x, base, peer_asn, origin_asn }] of Object.entries(rpkiStatusTraces)) {
    data.push({
      type: 'bar',
      orientation: 'h',
      y: peer_asn.map((val) => `AS${val}`),
      x,
      base,
      hovertext: origin_asn,
      customdata: y,
      hovertemplate: 'Peer IP: %{customdata} (%{y})<br>' + 'Origin: AS%{hovertext}<extra></extra>',
      width: 0.9,
      name: 'RPKI ' + status,
      marker: {
        color:
          status === 'Valid'
            ? '#55b748' // green
            : status === 'Invalid (More Specific)'
              ? '#db2b27' // red
              : status === 'Invalid (No Matching Origin)'
                ? '#db2b27' // red
                : '#fdbf11' // yellow
      }
    })
  }
  rpkiStatusChartData.value = data
}

// Handle click event on the Plotly chart
const handlePlotlyClick = (event) => {
  const point = event.points[0]
  if (point) {
    const timestamp = Math.floor(new Date(point.x + 'Z').getTime() / 1000)
    selectedMaxTimestamp.value = timestamp
    updateSlider(timestamp, true)
  }
}

// Add a vertical line to the chart at the given timestamp
const addVerticalLine = (timestamp) => {
  const x = new Date(timestamp * 1000).toISOString()
  const shapes = [
    {
      type: 'line',
      x0: x,
      x1: x,
      y0: 0,
      y1: 1,
      xref: 'x',
      yref: 'paper',
      line: {
        color: '#800080', // purple
        width: 2,
        dash: 'dashdot'
      }
    }
  ]
  lineChartLayout.shapes = shapes
  rpkiLayout.shapes = shapes
}

const enableLiveMode = () => {
  emit('enable-live-mode')
}

// Gets called when the time slider is moved
const updateSlider = (timestamp, isUsingSlider) => {
  if (isUsingSlider) {
    emit('disable-using-index')
  }
  emit('disable-live-mode')
  addVerticalLine(timestamp)
  emit('setSelectedMaxTimestamp', timestamp)
}

// Adjust the width of the QSlider to match the width of the Plotly chart
const adjustQSliderWidth = (relayout) => {
  if (!sliderWidthInit.value || relayout) {
    const rectElement = document.querySelector('rect.nsewdrag.drag')
    const sliderWidth = rectElement.getAttribute('width')
    const slider = document.querySelector('div.timetampSliderContainer')
    slider.style.width = `${sliderWidth}px`
    sliderWidthInit.value = true
  }
}

const init = async () => {
  sliderWidthInit.value = false
  if (props.rawMessages.length === 0) return
  updateTimeRange()
  await renderAnnouncementsAndWithdrawnChart(
    props.datesTrace,
    props.announcementsTrace,
    props.withdrawalsTrace
  )
  await renderAnnouncementsPeersChart(props.datesTrace, props.announcementsPeersTraces)
  await renderRpkiStatusChart(props.rpkiStatusTraces)
  adjustQSliderWidth(false)
  if (props.dataSource === 'bgplay') {
    updateSlider(selectedMaxTimestamp.value)
  }
}

const customIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        isHidden.value = !entry.isIntersecting
      })
    },
    {
      threshold: 0,
      rootMargin: '-68.8px 0px 0px 0px'
    }
  )
  if (prevNextElement.value) {
    observer.observe(prevNextElement.value)
  }
}

//Remove the vertical line and update the selected timestamp
watch(
  () => props.isLiveMode,
  () => {
    if (props.isLiveMode) {
      lineChartLayout.shapes = []
      rpkiLayout.shapes = []
      updateTimeRange()
    }
  }
)

watch(
  () => props.rawMessages,
  () => {
    if (props.rawMessages.length === 0) {
      defaultLayout.xaxis.autorange = true
      defaultLayout.yaxis.autorange = true
    }
  }
)

watch(
  [
    () => props.datesTrace,
    () => props.announcementsTrace,
    () => props.withdrawalsTrace,
    () => props.announcementsPeersTraces,
    () => props.rpkiStatusTraces
  ],
  () => {
    init()
  },
  { deep: true }
)

watch(
  () => props.currentIndex,
  () => {
    if (props.isLiveMode || !props.usingIndex) return

    if (props.currentIndex === -1) {
      emit('disable-using-index')
      updateSlider(props.minTimestamp)
      selectedMaxTimestamp.value = props.minTimestamp
    } else {
      const timestamp = props.rawMessages[props.currentIndex].timestamp
      selectedMaxTimestamp.value = timestamp
      updateSlider(timestamp)
    }
  }
)

watch(prevNextElement, () => {
  customIntersectionObserver()
})

onUnmounted(() => {
  if (observer && prevNextElement.value) {
    observer.unobserve(prevNextElement.value)
  }
})

onMounted(() => {
  init()
})
</script>

<template>
  <div v-if="isLoadingBgplayData" class="loadingContainer">
    <div class="IHR_loading-spinner">
      <QSpinner color="secondary" size="15em" />
    </div>
  </div>
  <div class="text-center" v-if="rawMessages.length === 0">
    <h1 v-if="!isLoadingBgplayData">No data available</h1>
    <h3 v-if="dataSource === 'ris-live'">Try Changing the Input Parameters or you can wait</h3>
    <h6 v-if="dataSource === 'ris-live'">Note: Some prefixes become active after some time.</h6>
  </div>
  <div v-else>
    <div v-if="dataSource === 'ris-live'" class="q-mb-md">
      <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
      <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    </div>
    <div class="timetampSlider">
      <div class="timetampSliderContainer">
        <QSlider
          v-model="selectedMaxTimestamp"
          :min="props.minTimestamp === Infinity ? 0 : props.minTimestamp"
          :max="props.maxTimestamp === -Infinity ? 0 : props.maxTimestamp"
          label-always
          :label-value="
            props.maxTimestamp === -Infinity
              ? 'No Data'
              : timestampToUTC(selectedMaxTimestamp)?.slice(0, 16)
          "
          color="accent"
          @update:model-value="updateSlider($event, true)"
          class="q-mt-lg"
        />
        <div class="row timestampInfo">
          <div class="col-12 col-sm-auto">
            <QBadge class="full-width">
              <div class="text-body2">
                Start:
                {{
                  props.minTimestamp === Infinity
                    ? 'No Data'
                    : timestampToUTC(props.minTimestamp)?.slice(0, 16)
                }}
              </div>
            </QBadge>
          </div>
          <div class="col-12 col-sm-auto" ref="prevNextElement">
            <div class="row justify-center items-center">
              <QBtn
                round
                color="indigo"
                icon="arrow_back"
                @click="emit('prev-event')"
                class="q-mr-md"
                :disable="
                  rawMessages.length === 0 ||
                  (dataSource === 'bgplay'
                    ? initialStateDataCount !== 0
                      ? currentIndex === 0
                      : currentIndex === -1
                    : currentIndex === 0)
                "
              />
              <QBadge class="q-mr-md">
                <div v-if="dataSource === 'ris-live'" class="text-body2">
                  {{ usedMessagesCount + ' out of ' + rawMessages.length }} Processed Messages
                </div>
                <div v-else class="text-body2">
                  {{ usedMessagesCount + ' out of ' + rawMessages.length }} Processed Messages
                </div>
              </QBadge>
              <QBtn
                round
                color="indigo"
                icon="arrow_forward"
                @click="emit('next-event')"
                :disable="rawMessages.length === 0 || currentIndex === rawMessages.length - 1"
                class="q-mr-lg"
              />
            </div>
          </div>
          <div class="col-12 col-sm-auto">
            <QBadge class="full-width">
              <div class="text-body2">
                End:
                {{
                  props.maxTimestamp === -Infinity
                    ? 'No Data'
                    : timestampToUTC(props.maxTimestamp)?.slice(0, 16)
                }}
              </div>
            </QBadge>
          </div>
        </div>
        <QCard :class="[isHidden ? 'floating-card' : 'hidden']">
          <QCardActions class="row justify-center items-center">
            <QBtn
              round
              color="indigo"
              icon="arrow_back"
              @click="emit('prev-event')"
              class="q-mr-md"
              :disable="
                rawMessages.length === 0 ||
                (dataSource === 'bgplay'
                  ? initialStateDataCount !== 0
                    ? currentIndex === 0
                    : currentIndex === -1
                  : currentIndex === 0)
              "
            />
            <QBadge class="q-mr-md">
              <div v-if="dataSource === 'ris-live'" class="text-body2">
                {{ usedMessagesCount + '/' + rawMessages.length }}
                <QIcon name="message" />
              </div>
              <div v-else class="text-body2">
                {{ usedMessagesCount + '/' + rawMessages.length }}
                <QIcon name="message" />
              </div>
            </QBadge>
            <QBtn
              round
              color="indigo"
              icon="arrow_forward"
              @click="emit('next-event')"
              :disable="rawMessages.length === 0 || currentIndex === rawMessages.length - 1"
            />
          </QCardActions>
        </QCard>
      </div>
    </div>
    <ReactiveChart
      :layout="{
        ...lineChartLayout,
        yaxis: {
          title: {
            text: 'Reachability (# Peers)'
          }
        }
      }"
      :traces="announcementsPeersChartData"
      :shapes="lineChartLayout.shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <ReactiveChart
      :layout="{
        ...lineChartLayout,
        yaxis: {
          title: {
            text: '# BGP messages / second'
          }
        }
      }"
      :traces="announcementsAndWithdrawnChartData"
      :shapes="lineChartLayout.shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <div v-if="dataSource === 'bgplay'" class="relative-position">
      <div v-if="isNoVrpData" class="absolute-center text-center" style="z-index: 9">
        <h1>No RPKI Data Available</h1>
        <h3>Requested timerange is outside of available data.</h3>
      </div>
      <ReactiveChart
        :layout="{
          ...rpkiLayout,
          yaxis: {
            title: {
              text: 'Peers'
            }
          }
        }"
        :traces="rpkiStatusChartData"
        :shapes="rpkiLayout.shapes"
        @plotly-click="handlePlotlyClick"
        @plotly-relayout="adjustQSliderWidth(true)"
      />
    </div>
    <QExpansionItem
      v-if="dataSource === 'bgplay'"
      dense
      class="expansion-header"
      expand-icon-class="text-white"
    >
      <template v-slot:header>
        <QItemSection>
          <div>
            <div class="text-h6">
              {{ $t('bgpVrpsTable.title') }}
            </div>
            <div class="text-subtitle2">
              {{ $t('bgpVrpsTable.subTitle') }}
            </div>
          </div>
        </QItemSection>
      </template>
      <BGPVrpsTable :vrpTableData="props.vrpTableData" />
    </QExpansionItem>
  </div>
</template>

<style>
.timetampSlider {
  display: flex;
  flex-direction: column;
  gap: 30px;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 0 auto;
}
.timeStampControls {
  display: flex;
  align-items: center;
  justify-content: center;
}
.timetampSliderContainer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.timestampInfo {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.loadingContainer {
  height: 60px;
}
.expansion-header {
  background-color: #263238;
  color: #fff;
}
.floating-card {
  z-index: 99;
  position: fixed;
  max-width: max-content;
  top: 90px;
  left: 50%;
  transform: translate(-50%, 0);
}
</style>
