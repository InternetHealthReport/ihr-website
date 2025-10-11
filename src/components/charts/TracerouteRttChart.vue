<script setup>
import { QRange, QDate, QInput, QIcon, QPopupProxy, QTime, QSpinner, QSpace, QBtn } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch } from 'vue'
import {
  calculateMedian,
  convertUnixTimestamp,
  convertDateTimeToSeconds
} from '../../plugins/tracerouteFunctions'
import '@/styles/chart.css'

const props = defineProps({
  intervalValue: {
    type: Number
  },
  isOneOff: {
    type: Boolean
  },
  minRtt: {
    type: Number
  },
  maxRtt: {
    type: Number
  },
  timeRange: {
    type: Object
  },
  metaData: {
    type: Object
  },
  rttOverTime: {
    type: Array
  },
  isLoading: {
    type: Boolean
  }
})

const emit = defineEmits(['loadMeasurementOnTimeRange'])

const timeRangeModel = ref({ min: 0, max: 0, disable: true })
const sliderWidthInit = ref(false)
const actualChartData = ref([])
const actualChartLayout = ref({})
const showOneOffMessage = ref(false)
const showTooSmallMessage = ref(false)
const showNoDataMessage = ref(true)
const leftDateTimePicker = ref(convertUnixTimestamp(0))
const rightDateTimePicker = ref(convertUnixTimestamp(0))

const leftDateTimePickerTemp = ref(convertUnixTimestamp(0))
const rightDateTimePickerTemp = ref(convertUnixTimestamp(0))

const leftLabel = computed(() => {
  return convertUnixTimestamp(timeRangeModel.value.min) ?? ''
})

const rightLabel = computed(() => {
  return convertUnixTimestamp(timeRangeModel.value.max) ?? ''
})

const updateLeftDatePicker = (timePickerTemp) => {
  leftDateTimePicker.value = timePickerTemp
}

const updateRightDatePicker = (timePickerTemp) => {
  rightDateTimePicker.value = timePickerTemp
}

const plotRTTChart = async () => {
  if (!props.intervalValue) {
    showOneOffMessage.value = true
    showNoDataMessage.value = false
    return
  }

  const timeInterval = props.intervalValue
  const groupedData = {}

  filteredRttOverTime.value.forEach((dataPoint) => {
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
      type: 'scatter',
      mode: 'lines',
      name: 'Median RTT'
    }

    for (const [timeSlot, rtts] of Object.entries(groupedData)) {
      trace.x.push(new Date(timeSlot * 1000))
      trace.y.push(calculateMedian(rtts))
    }

    actualChartData.value = [trace]
    actualChartLayout.value = {
      height: '300',
      xaxis: { title: 'Time' },
      yaxis: { title: 'Median RTT (ms)' }
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
  leftDateTimePicker.value = convertUnixTimestamp(min)
  rightDateTimePicker.value = convertUnixTimestamp(max)
  return props.rttOverTime.filter((dataPoint) => {
    return dataPoint.timestamp >= min && dataPoint.timestamp <= max
  })
})

// Handling one-off measurement's median RTT
const oneOffMedianRtt = computed(() => {
  if (props.isOneOff) {
    return calculateMedian(
      filteredRttOverTime.value.map((rttObj) => rttObj.rtt).filter((rtt) => rtt !== null)
    )
  }

  return 0
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
  emit('loadMeasurementOnTimeRange', event)
}

watch([leftDateTimePicker, rightDateTimePicker], () => {
  if (leftDateTimePicker.value != leftDateTimePickerTemp.value) {
    leftDateTimePickerTemp.value = leftDateTimePicker.value
  }
  if (rightDateTimePicker.value != rightDateTimePickerTemp.value) {
    rightDateTimePickerTemp.value = rightDateTimePicker.value
  }
  emit('loadMeasurementOnTimeRange', {
    min: Math.max(convertDateTimeToSeconds(leftDateTimePicker.value), minTime.value),
    max: Math.min(convertDateTimeToSeconds(rightDateTimePicker.value), maxTime.value)
  })
})

watch(
  () => props.timeRange,
  () => {
    timeRangeModel.value = props.timeRange
    if (!('min' in timeRangeModel.value)) {
      timeRangeModel.value.min = null
    }
    if (!('max' in timeRangeModel.value)) {
      timeRangeModel.value.max = null
    }
  },
  { deep: true }
)
watch(filteredRttOverTime, () => {
  showOneOffMessage.value = false
  showTooSmallMessage.value = false
  showNoDataMessage.value = true
  plotRTTChart()
  adjustQSliderWidth(false)
})
</script>

<template>
  <template v-if="metaData.target">
    <div
      v-if="isOneOff == true"
      class="col q-ml-md"
    >
      <div class="text-h6">
        One-off measurement stats:
      </div>
      <ul>
        <li class="text-body">
          Minimum RTT: <strong>{{ minRtt }} ms</strong>
        </li>
        <li class="text-body">
          Median RTT: <strong>{{ oneOffMedianRtt }} ms</strong>
        </li>
        <li>
          Maximum RTT: <strong>{{ maxRtt }} ms</strong>
        </li>
      </ul>
    </div>
    <div v-else>
      <div v-if="showNoDataMessage">
        <span>No data</span>
      </div>
      <div v-else-if="showOneOffMessage">
        <span>No interval found (probably one-off measurement)</span>
      </div>
      <div v-else>
        <div v-if="showTooSmallMessage">
          <span>Interval too small</span>
        </div>
        <ReactiveChart
          v-else
          :layout="actualChartLayout"
          :traces="actualChartData"
          @plotly-relayout="adjustQSliderWidth(true)"
        />
      </div>
      <div class="timetampSlider">
        <div class="timetampSliderContainer">
          <QRange
            v-model="timeRangeModel"
            :disable="timeRangeModel.disable"
            :min="minTime"
            :max="maxTime"
            :left-label-value="leftLabel"
            :right-label-value="rightLabel"
            label-always
            drag-range
            @change="rangeOnChane"
          />
          <div class="row justify-center">
            <div class="col-2 q-pr-md">
              <QInput
                v-model="leftDateTimePicker"
                label="Selected Start Date Time in (UTC)"
                class="input"
                outlined
              >
                <template #append>
                  <QIcon
                    name="event"
                    class="cursor-pointer"
                  >
                    <QPopupProxy
                      no-route-dismiss
                      cover
                    >
                      <div class="row q-pa-md q-gutter-md row items-start">
                        <QDate
                          v-model="leftDateTimePickerTemp"
                          flat
                          mask="YYYY-MM-DD, HH:mm"
                        />
                        <QTime
                          v-model="leftDateTimePickerTemp"
                          flat
                          mask="YYYY-MM-DD, HH:mm"
                          format24h
                        />
                      </div>
                      <div class="row items-center justify-end q-ma-md">
                        <QBtn
                          v-close-popup
                          class="closeBtnStyle q-mr-md"
                          label="Close"
                          outline
                        />
                        <QBtn
                          v-close-popup
                          class="bg-primary applyBtnStyle"
                          label="Apply"
                          outline
                          @click="updateLeftDatePicker(leftDateTimePickerTemp)"
                        />
                      </div>
                    </QPopupProxy>
                  </QIcon>
                </template>
              </QInput>
            </div>
            <div class="col-2 q-pl-md">
              <QInput
                v-model="rightDateTimePicker"
                label="Selected End Date Time in (UTC)"
                class="input"
                outlined
              >
                <template #append>
                  <QIcon
                    name="event"
                    class="cursor-pointer"
                  >
                    <QPopupProxy
                      no-route-dismiss
                      cover
                    >
                      <div class="row q-pa-md q-gutter-md row items-start">
                        <QDate
                          v-model="rightDateTimePickerTemp"
                          flat
                          mask="YYYY-MM-DD, HH:mm"
                        />
                        <QTime
                          v-model="rightDateTimePickerTemp"
                          flat
                          mask="YYYY-MM-DD, HH:mm"
                          format24h
                        />
                      </div>
                      <div class="row items-center justify-end q-ma-md">
                        <QBtn
                          v-close-popup
                          class="closeBtnStyle q-mr-md"
                          label="Close"
                          outline
                        />
                        <QBtn
                          v-close-popup
                          class="bg-primary applyBtnStyle"
                          label="Apply"
                          outline
                          @click="updateRightDatePicker(rightDateTimePickerTemp)"
                        />
                      </div>
                    </QPopupProxy>
                  </QIcon>
                </template>
              </QInput>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="isLoading"
      class="rttSpinner"
    >
      <QSpinner
        color="secondary"
        size="15em"
      />
    </div>
  </template>
  <template v-else>
    <div class="placeholder-message">
      No Traceroute RTT chart data available.
    </div>
  </template>
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

.rttSpinner {
  position: absolute;
  top: 5%;
  left: 60%;
}
.rttSpinner > * {
  width: 25%;
  height: 25%;
}
.placeholder-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
  font-size: 1.2em;
}

.applyBtnStyle {
  color: rgba(255, 255, 255);
}
.closeBtnStyle {
  background-color: rgba(0, 0, 0, 0.171);
}
</style>
