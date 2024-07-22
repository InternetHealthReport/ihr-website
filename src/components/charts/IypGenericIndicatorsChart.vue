<script setup>
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => [],
  },
  chartLayout: {
    type: Object,
    default: () => ({}),
  }
})

const localChartData = ref([])
const actualChartData = ref([])
const actualChartLayout = ref({})

const renderChart = () => {
  let data = formatChartData(localChartData.value)

  let layout = {
    ...props.chartLayout,
  }

  actualChartData.value = data
  actualChartLayout.value = layout
}

const formatChartData = (arrayOfObjects) => {
  if (!arrayOfObjects || arrayOfObjects.length === 0) {
    return []
  }

  let data = []
  if (arrayOfObjects.length === 1) {
    data = [
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[0].rank,
        title: {
          text: `<span style='font-size:1rem'>${arrayOfObjects[0].name}</span>`,
        },
        domain: { x: [0, 0.5], y: [0.5, 1] },
      },
    ]
  } else if (arrayOfObjects.length === 2) {
    data = [
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[0].rank,
        title: {
          text: arrayOfObjects[0].name,
        },
        domain: { x: [0, 0.5], y: [0.5, 1] },
      },
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[1].rank,
        title: {
          text: arrayOfObjects[1].name,
        },
        domain: { x: [0.6, 1], y: [0, 1] },
      },
    ]
  } else {
    data = [
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[0].rank,
        title: {
          text: arrayOfObjects[0].name,
        },
        domain: { x: [0, 0.5], y: [0.5, 1] },
      },
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[1].rank,
        title: {
          text: arrayOfObjects[1].name,
        },
        domain: { x: [0.6, 1], y: [0, 1] },
      },
      {
        type: 'indicator',
        mode: 'number',
        value: arrayOfObjects[2].rank,
        title: {
          text: arrayOfObjects[2].name,
        },
        domain: { x: [0, 0.5], y: [0, 0.5] },
      },
    ]
  }

  return data
}

const init = () => {
  if (props.chartData && props.chartData.length > 0) {
    localChartData.value = props.chartData
    renderChart()
  }
}

watch(() => props.chartData, () => {
  init()
}, { deep: true })

onMounted(() => {
  init()
})
</script>

<template>
  <ReactiveChart
    :layout="actualChartLayout"
    :traces="actualChartData"
    :chart-title="actualChartLayout && actualChartLayout.title"
  />
</template>