<script setup>
import { QBtn, QSlider } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'
import report from '@/plugins/report'

const props = defineProps({
  prefix: {
    type: String
  },
  rawMessages: {
    type: Array,
    default: () => []
  },
  maxHops: {
    type: Number
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
  displayOnlyInitialState: {
    type: Boolean
  },
  hasBgPlayInitialState: {
    type: Boolean
  }
})

const emit = defineEmits([
  'setSelectedMaxTimestamp',
  'disable-live-mode',
  'enable-live-mode',
  'toggleDisplayOnlyInitialState'
])

const { utcString } = report()

const actualChartData = ref([])
const actualChartLayout = ref({})
const minTimestamp = ref(Infinity)
const maxTimestamp = ref(-Infinity)
const selectedMaxTimestamp = ref(0)
const announcementsCount = ref({})
const withdrawalsCount = ref({})
const shapes = ref([])
const sliderWidthInit = ref(false)
const displayOnlyInitialStateModel = ref(true)

// Generate the stacked line chart data for the Plotly chart
const generateLineChartData = async (message) => {
  const timestamp = message.timestamp
  const dates = []
  const announcementsTrace = []
  const withdrawalsTrace = []
  //count no of messages based on type
  if (message.type === 'Announce') {
    if (!announcementsCount.value[timestamp]) {
      announcementsCount.value[timestamp] = 0
    }
    announcementsCount.value[timestamp]++
  } else if (message.type === 'Withdraw') {
    if (!withdrawalsCount.value[timestamp]) {
      withdrawalsCount.value[timestamp] = 0
    }
    withdrawalsCount.value[timestamp]++
  }
  // Generate complete timestamps
  for (let t = minTimestamp.value; t <= maxTimestamp.value; t++) {
    dates.push(timestampToUTC(t))
    announcementsTrace.push(announcementsCount.value[t] || 0)
    withdrawalsTrace.push(withdrawalsCount.value[t] || 0)
  }
  // Update chart data for announcements
  return {
    dates: dates,
    announcementsTrace: announcementsTrace,
    withdrawalsTrace: withdrawalsTrace
  }
}

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
}

// Update the time range
const updateTimeRange = (timestamp) => {
  if (props.dataSource === 'risLive') {
    if (timestamp) {
      if (timestamp < minTimestamp.value) {
        minTimestamp.value = timestamp
      }
      if (timestamp > maxTimestamp.value) {
        maxTimestamp.value = timestamp
      }
    }
    if (props.isLiveMode) {
      selectedMaxTimestamp.value = maxTimestamp.value
    }
  } else {
    minTimestamp.value = props.minTimestamp
    maxTimestamp.value = props.maxTimestamp
    selectedMaxTimestamp.value = props.minTimestamp
  }
}

const renderChart = (dates, announcementsTrace, withdrawalsTrace) => {
  const data = [
    {
      x: dates,
      y: withdrawalsTrace,
      type: 'scatter',
      mode: 'none',
      name: 'Withdrawals',
      fillcolor: 'rgba(255, 127, 14, 0.5)',
      stackgroup: 'one'
    },
    {
      x: dates,
      y: announcementsTrace,
      type: 'scatter',
      mode: 'none',
      name: 'Announcements',
      fillcolor: 'rgba(31, 119, 180, 0.5)',
      stackgroup: 'one'
    }
  ]

  const layout = {
    legend: {
      orientation: 'h',
      y: 1.1,
      x: 0.5,
      xanchor: 'center',
      yanchor: 'bottom'
    },
    yaxis: { title: 'Number of Messages', rangemode: 'tozero' },
    shapes: []
  }

  if (shapes.value.length) {
    layout.shapes = shapes.value
  }

  actualChartData.value = data
  actualChartLayout.value = layout
}

// Handle click event on the Plotly chart
const handlePlotlyClick = (event) => {
  const point = event.points[0]
  if (point) {
    const timestamp = Math.floor(new Date(point.x + 'Z').getTime() / 1000)
    selectedMaxTimestamp.value = timestamp
    updateSlider(timestamp)
  }
}

// Add a vertical line to the chart at the given timestamp
const addVerticalLine = (timestamp) => {
  const x = new Date(timestamp * 1000).toISOString()
  shapes.value = [
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
const updateSlider = (timestamp) => {
  emit('disable-live-mode')
  addVerticalLine(timestamp)
  emit('setSelectedMaxTimestamp', timestamp)
}

// Adjust the width of the QSlider to match the width of the Plotly chart
const adjustQSliderWidth = (relayout) => {
  if (!sliderWidthInit.value || relayout) {
    try {
      const rectElement = document.querySelector('rect.nsewdrag.drag')
      const sliderWidth = rectElement.getAttribute('width')
      const slider = document.querySelector('div.timetampSliderContainer')
      slider.style.width = `${sliderWidth}px`
      sliderWidthInit.value = true
    } catch (e) {}
  }
}

const init = async () => {
  if (props.rawMessages.length == 1) {
    minTimestamp.value = Infinity
    maxTimestamp.value = -Infinity
    sliderWidthInit.value = false
  }
  if (props.rawMessages && props.rawMessages.length > 0) {
    updateTimeRange(props.rawMessages.at(-1).timestamp)
    const { dates, announcementsTrace, withdrawalsTrace } = await generateLineChartData(
      props.rawMessages.at(-1)
    )
    renderChart(dates, announcementsTrace, withdrawalsTrace)
    adjustQSliderWidth(false)
  }
}

const toggleSwitchToInitialState = () => {
  emit('toggleDisplayOnlyInitialState', displayOnlyInitialStateModel.value)
}

watch(
  () => props.rawMessages,
  () => {
    init()
  },
  { deep: true }
)

//Remove the vertical line and update the selected timestamp
watch(
  () => props.isLiveMode,
  () => {
    if (props.isLiveMode) {
      shapes.value = []
      updateTimeRange()
    }
  }
)

watch(
  () => props.displayOnlyInitialState,
  () => {
    displayOnlyInitialStateModel.value = props.displayOnlyInitialState
  }
)

watch(displayOnlyInitialStateModel, () => {
  if (displayOnlyInitialStateModel.value) {
    shapes.value = []
    updateTimeRange()
  } else {
    updateSlider(selectedMaxTimestamp.value)
  }
})

onMounted(() => {
  init()
})
</script>

<template>
  <div class="noData" v-if="rawMessages.length === 0">
    <h1 v-if="isLoadingBgplayData">Loading...</h1>
    <h1 v-else>No data available</h1>
    <h3 v-if="dataSource === 'risLive'">Try Changing the Input Parameters or you can wait</h3>
    <h6 v-if="dataSource === 'risLive'">Note: Some prefixes become active after some time.</h6>
  </div>
  <div v-else>
    <div v-if="dataSource === 'risLive'">
      <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
      <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    </div>
    <QBtn
      v-if="props.hasBgPlayInitialState"
      :color="displayOnlyInitialStateModel ? 'primary' : 'secondary'"
      :label="displayOnlyInitialStateModel ? 'Switch to Time Range' : 'Switch to Initial State'"
      @click="toggleSwitchToInitialState"
    />
    <ReactiveChart
      :layout="actualChartLayout"
      :traces="actualChartData"
      :shapes="shapes"
      @plotly-click="handlePlotlyClick"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <div class="timetampSlider">
      <div class="timeStampControls">
        <span>Using: {{ usedMessagesCount + '/' + rawMessages.length }} Messages</span>
      </div>
      <div class="timetampSliderContainer">
        <QSlider
          v-model="selectedMaxTimestamp"
          :disable="displayOnlyInitialStateModel && props.dataSource === 'bgplay'"
          :min="minTimestamp === Infinity ? 0 : minTimestamp"
          :max="maxTimestamp === -Infinity ? 0 : maxTimestamp"
          label-always
          :label-value="
            maxTimestamp === -Infinity ? 'No Data' : timestampToUTC(selectedMaxTimestamp)
          "
          color="accent"
          @update:model-value="updateSlider"
        />
        <div class="timestampInfo">
          <span
            >Min Timestamp:
            {{ minTimestamp === Infinity ? 'No Data' : timestampToUTC(minTimestamp) }}</span
          >
          <span
            >Max Timestamp:
            {{ maxTimestamp === -Infinity ? 'No Data' : timestampToUTC(maxTimestamp) }}</span
          >
        </div>
      </div>
    </div>
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
}
</style>
