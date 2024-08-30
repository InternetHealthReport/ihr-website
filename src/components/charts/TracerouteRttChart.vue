<script setup>
import { QRange } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch } from 'vue'
import { calculateMedian } from "../../plugins/tracerouteFunctions"

const props = defineProps({
  intervalValue: {
    type: Number,
  },
  timeRange: {
    type: Object
  },
  metaData: {
    type: Object
  },
  leftLabelValue: {
    type: String
  },
  rightLabelValue: {
    type: String
  },
  rttOverTime: {
    type: Array
  }
})

const emit = defineEmits(["loadMeasurementOnTimeRange"])

const timeRangeModel = ref({})
const sliderWidthInit = ref(false)
const actualChartData = ref([])
const actualChartLayout = ref({})
const showOneOffMessage = ref(false)
const showTooSmallMessage = ref(false)
const showNoDataMessage = ref(true)

const plotRTTChart = async () => {
  if (!props.intervalValue) {
      showOneOffMessage.value = true
      showNoDataMessage.value = false
      return
  }

  const timeInterval = props.intervalValue
  const groupedData = {}
  
  filteredRttOverTime.value.forEach(dataPoint => {
    const timeSlot = Math.floor(dataPoint.timestamp / timeInterval) * timeInterval
    if (!groupedData[timeSlot]) {
      groupedData[timeSlot] = []
    }
    groupedData[timeSlot].push(dataPoint.rtt)
  })

  if (Object.keys(groupedData).length == 1) {
    showTooSmallMessage.value = true
    showNoDataMessage.value = false
    return
  } else {
    const trace = {
      x: [],
      y: [],
      type: "scatter",
      mode: "lines",
      name: "Median RTT"
    }

    for (const [timeSlot, rtts] of Object.entries(groupedData)) {
      trace.x.push(new Date(timeSlot * 1000))
      trace.y.push(calculateMedian(rtts))
    }

    actualChartData.value = [trace]
    actualChartLayout.value = {
      height: "300",
      xaxis: { title: "Time" },
      yaxis: { title: "Median RTT (ms)" }
    }
    showNoDataMessage.value = false
  }
}

const minTime = computed(() => props.metaData?.start_time || 0)
const maxTime = computed(() => props.metaData?.stop_time || 0)

const filteredRttOverTime = computed(() => {
  if (timeRangeModel.value.disable) {
    return props.rttOverTime
  }
  
  const { min, max } = timeRangeModel.value
  return props.rttOverTime.filter(dataPoint => {
    return dataPoint.timestamp >= min && dataPoint.timestamp <= max
  })
})

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

const rangeOnChane = (event) => {
  emit("loadMeasurementOnTimeRange", event)
}

watch(() => props.timeRange, () => {
  timeRangeModel.value = props.timeRange
})
watch(filteredRttOverTime, () => {
  showOneOffMessage.value = false
  showTooSmallMessage.value = false
  showNoDataMessage.value = true
  plotRTTChart()
  adjustQSliderWidth(false)
})
</script>

<template>
  <div v-if="showNoDataMessage">
    <span>No data</span>
  </div>
  <div v-else-if="showOneOffMessage">
    <span>No interval found (probably one-off measurement)</span>
  </div>
  <div v-else-if="showTooSmallMessage">
    <span>Interval too small</span>
  </div>
  <div v-else>
    <ReactiveChart
      :layout="actualChartLayout"
      :traces="actualChartData"
      @plotly-relayout="adjustQSliderWidth(true)"
    />
    <div class="timetampSlider">
      <div class="timetampSliderContainer">
        <QRange v-model="timeRangeModel" :disable="timeRangeModel.disable" :min="minTime" :max="maxTime"
          :left-label-value="leftLabelValue" :right-label-value="rightLabelValue" label-always
          drag-range @change="rangeOnChane" />
      </div>
    </div>
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

.timetampSliderContainer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
</style>