<script setup>
import { QBtn, QSlider } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, inject, reactive, onMounted, computed, watch } from 'vue'
import report from '@/plugins/report'

const props  = defineProps({
	prefix: {
		type: String
	},
  rawMessages: {
		type: Array,
    default: () => [],
	},
	maxHops: {
		type: Number
	},
	selectedPeers: {
		type: Array,
		default: () => [],
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
		emit('setSelectedMaxTimestamp', maxTimestamp.value)
    selectedMaxTimestamp.value = maxTimestamp.value
  }
}

const renderChart = (dates, announcementsTrace, withdrawalsTrace) => {
  const data = [
		{
			x: dates,
			y: announcementsTrace,
			type: 'scatter',
			mode: 'lines',
			name: 'Announcements',
			line: { shape: 'linear' },
			marker: { size: 8 }
		},
		{
			x: dates,
			y: withdrawalsTrace,
			type: 'scatter',
			mode: 'lines',
			name: 'Withdrawals',
			line: { shape: 'linear' },
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
		yaxis: { title: '123', rangemode: 'tozero' },
		shapes: []
	}

  actualChartData.value = data
  actualChartLayout.value = layout
}

const handlePlotlyClick = (event) => {
  const point = event.points[0]
  if (point) {
    const timestamp = Math.floor(new Date(point.x + 'Z').getTime() / 1000)
    // disableLiveMode()
    selectedMaxTimestamp.value = timestamp
    addVerticalLine(timestamp)
  }
}

const addVerticalLine = (timestamp) => {
  const x = new Date(timestamp * 1000).toISOString()
  shapes.value = [{
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
  }]
  // updateMessagesRecivedLineChart()
}

const enableLiveMode = () => {
	emit('enable-live-mode')
	shapes.value = []
}

const init = async () => {
  if (props.rawMessages && props.rawMessages.length > 0) {
		updateTimeRange(props.rawMessages.at(-1).floor_timestamp)
    const { dates, announcementsTrace, withdrawalsTrace } = await generateLineChartData(props.rawMessages.at(-1))
		renderChart(dates, announcementsTrace, withdrawalsTrace)
  }
}

watch(() => props.rawMessages, () => {
  init()
}, { deep: true })

onMounted(() => {
  init()
})
</script>

<template>
	<QBtn :color="isLiveMode && isPlaying ? 'negative' : 'grey-9'" :label="'Live'" />
	<ReactiveChart 
		:layout="actualChartLayout"
		:traces="actualChartData"
		:shapes="shapes"
		@plotly-click="handlePlotlyClick"
	/>
	<div v-if="rawMessages.length === 0" class="noData">
		<h1>No data available</h1>
		<h3>Try Changing the Input Parameters or you can wait</h3>
		<h6>Note: Some prefixes become active after some time.</h6>
	</div>
	<div class="timetampSlider">
		<div class="timeStampControls">
			<div v-if="!isLiveMode">
				<QBtn @click="enableLiveMode" :color="'grey-9'" :label="'Switch to Live Mode'" />
			</div>
			<span>Using: {{ usedMessagesCount + '/' + rawMessages.length }} Messages</span>
		</div>
		<div class="timetampSliderContainer">
			<QSlider
				@update:model-value="emit('disable-live-mode')"
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
</template>