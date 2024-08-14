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
  bgpMessageType: {
    type: Function
  },
  usedMessagesCount: {
    type: Number
  },
  isLiveMode: {
    type: Boolean
  },
  isPlaying: {
    type: Boolean
  }
})

const emit = defineEmits(['setSelectedMaxTimestamp', 'disable-live-mode', 'enable-live-mode'])

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

// Generate the stacked line chart data for the Plotly chart
const generateLineChartData = async (message) => {
  const timestamp = message.floor_timestamp
  const dates = []
  const announcementsTrace = []
  const withdrawalsTrace = []
  //count no of messages based on type
  if (props.bgpMessageType(message) === 'Announce') {
    if (!announcementsCount.value[timestamp]) {
      announcementsCount.value[timestamp] = 0
    }
    announcementsCount.value[timestamp]++
  } else if (props.bgpMessageType(message) === 'Withdraw') {
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

// Update the time range based on the timestamp of the message
const updateTimeRange = (timestamp) => {
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
}

const renderChart = (dates, announcementsTrace, withdrawalsTrace) => {
  const data = [
    {
      x: dates,
      y: announcementsTrace,
      type: 'scatter',
      mode: 'none',
      name: 'Announcements',
      line: { shape: 'linear' },
      fill: 'tonexty',
      marker: { size: 8 }
    },
    {
      x: dates,
      y: withdrawalsTrace,
      type: 'scatter',
      mode: 'none',
      name: 'Withdrawals',
      line: { shape: 'linear' },
      fill: 'tozeroy',
      marker: { size: 8 }
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
    emit('disable-live-mode')
    addVerticalLine(timestamp)
    emit('setSelectedMaxTimestamp', timestamp)
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
    updateTimeRange(props.rawMessages.at(-1).floor_timestamp)
    const { dates, announcementsTrace, withdrawalsTrace } = await generateLineChartData(
      props.rawMessages.at(-1)
    )
    renderChart(dates, announcementsTrace, withdrawalsTrace)
    adjustQSliderWidth(false)
  }
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

onMounted(() => {
  init()
})
</script>

<template>
  <div v-if="rawMessages.length === 0" class="noData">
    <h1>No data available</h1>
    <h3>Try Changing the Input Parameters or you can wait</h3>
    <h6>Note: Some prefixes become active after some time.</h6>
  </div>
  <div v-else>
    <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
    <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
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
          @update:model-value="updateSlider"
          v-model="selectedMaxTimestamp"
          :min="minTimestamp === Infinity ? 0 : minTimestamp"
          :max="maxTimestamp === -Infinity ? 0 : maxTimestamp"
          label-always
          :label-value="
            maxTimestamp === -Infinity ? 'No Data' : timestampToUTC(selectedMaxTimestamp)
          "
          color="accent"
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
