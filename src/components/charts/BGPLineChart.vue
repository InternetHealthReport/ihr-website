<script setup>
import { QBadge, QBtn, QSlider, QSpinner } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'
import report from '@/plugins/report'
import '@/styles/chart.css'

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
    type: Array,
    default: () => []
  },
  validRpkiData: {
    type: Object,
    default: () => ({ x: [], y: [] })
  },
  invalidRpkiData: {
    type: Object,
    default: () => ({ x: [], y: [] })
  },
  notFoundRpkiData: {
    type: Object,
    default: () => ({ x: [], y: [] })
  },
  currentIndex: {
    type: Number,
    default: -1
  },
  usingIndex: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'setSelectedMaxTimestamp',
  'disable-live-mode',
  'enable-live-mode',
  'disable-using-index'
])

const { utcString } = report()

const announcementsAndWithdrawnChartData = ref([])
const announcementsPeersChartData = ref([])
const rpkiStatusChartData = ref([])

const selectedMaxTimestamp = ref(0)
const sliderWidthInit = ref(false)

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

const layout = {
  legend: {
    orientation: 'h',
    y: 1.1,
    x: 0.5,
    xanchor: 'center',
    yanchor: 'bottom'
  },
  showlegend: true,
  yaxis: { rangemode: 'tozero' },
  shapes: []
}

const rpkiLayout = {
  legend: {
    orientation: 'h',
    y: 1.1,
    x: 0.5,
    xanchor: 'center',
    yanchor: 'bottom'
  },
  showlegend: true,
  yaxis: { rangemode: 'tozero' }
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
  const data = [
    {
      x: dates,
      y: announcementsPeersTraces,
      type: 'scattergl',
      fill: 'tozeroy',
      fillcolor: 'rgba(58, 160, 44, 0.5)',
      marker: {
        color: 'rgba(58, 160, 44, 0.5)'
      },
      mode: 'markers',
      name: 'BGP Sources'
    }
  ]
  announcementsPeersChartData.value = data
}

const renderRpkiStatusChart = async (validRpkiData, invalidRpkiData, notFoundRpkiData) => {
  const data = [
    {
      x: validRpkiData.x,
      y: validRpkiData.y,
      type: 'scattergl',
      mode: 'markers',
      name: 'RPKI Valid',
      marker: {
        size: 18,
        color: 'rgba(58, 160, 44, 0.5)'
      }
    },
    {
      x: invalidRpkiData.x,
      y: invalidRpkiData.y,
      type: 'scattergl',
      mode: 'markers',
      name: 'RPKI Invalid',
      marker: {
        size: 18,
        color: 'rgba(255, 0, 0, 0.5)'
      }
    },
    {
      x: notFoundRpkiData.x,
      y: notFoundRpkiData.y,
      type: 'scattergl',
      mode: 'markers',
      name: 'RPKI Not Found',
      marker: {
        size: 18,
        color: 'rgba(255, 215, 0, 0.5)'
      }
    }
  ]
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
  layout.shapes = [
    {
      type: 'line',
      x0: x,
      x1: x,
      y0: 0,
      y1: 1,
      xref: 'x',
      yref: 'paper',
      line: {
        color: 'red',
        width: 2,
        dash: 'dashdot'
      }
    }
  ]
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
  await renderRpkiStatusChart(props.validRpkiData, props.invalidRpkiData, props.notFoundRpkiData)
  adjustQSliderWidth(false)
  if (props.dataSource === 'bgplay') {
    updateSlider(selectedMaxTimestamp.value)
  }
}

//Remove the vertical line and update the selected timestamp
watch(
  () => props.isLiveMode,
  () => {
    if (props.isLiveMode) {
      layout.shapes = []
      updateTimeRange()
    }
  }
)

watch(
  [
    () => props.datesTrace,
    () => props.announcementsTrace,
    () => props.withdrawalsTrace,
    () => props.announcementsPeersTraces,
    () => props.validRpkiData,
    () => props.invalidRpkiData,
    () => props.notFoundRpkiData
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
  <div class="noData" v-if="rawMessages.length === 0">
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
        <div class="row timestampInfo">
          <div class="col-12 col-sm-auto">
            <QBadge class="full-width">
              <div class="text-body2">
                Min Timestamp:
                {{
                  props.minTimestamp === Infinity ? 'No Data' : timestampToUTC(props.minTimestamp)
                }}
              </div>
            </QBadge>
          </div>
          <div class="col-12 col-sm-auto">
            <QBadge class="full-width">
              <div v-if="dataSource === 'ris-live'" class="text-body2">
                Using: {{ usedMessagesCount + '/' + rawMessages.length }} Messages
              </div>
              <div v-else class="text-body2">
                Using: {{ usedMessagesCount + '/' + rawMessages.length }} Messages (Initial State
                and Events)
              </div>
            </QBadge>
          </div>
          <div class="col-12 col-sm-auto">
            <QBadge class="full-width">
              <div class="text-body2">
                Max Timestamp:
                {{
                  props.maxTimestamp === -Infinity ? 'No Data' : timestampToUTC(props.maxTimestamp)
                }}
              </div>
            </QBadge>
          </div>
        </div>
        <QSlider
          v-model="selectedMaxTimestamp"
          :min="props.minTimestamp === Infinity ? 0 : props.minTimestamp"
          :max="props.maxTimestamp === -Infinity ? 0 : props.maxTimestamp"
          label-always
          :label-value="
            props.maxTimestamp === -Infinity ? 'No Data' : timestampToUTC(selectedMaxTimestamp)
          "
          switch-label-side
          color="accent"
          @update:model-value="updateSlider($event, true)"
        />
      </div>
    </div>
    <ReactiveChart
      :layout="layout"
      :traces="announcementsPeersChartData"
      :shapes="layout.shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <ReactiveChart
      :layout="layout"
      :traces="announcementsAndWithdrawnChartData"
      :shapes="layout.shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <ReactiveChart
      v-if="dataSource === 'bgplay'"
      :layout="rpkiLayout"
      :traces="rpkiStatusChartData"
      :shapes="layout.shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
  </div>
</template>

<style>
.noData {
  text-align: center;
}
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
</style>
