<script setup>
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  chartData: {
    type: Array,
    default: () => []
  },
  chartLayout: {
    type: Object,
    default: () => ({})
  },
  config: {
    type: Object,
    default: () => ({})
  }
})

const localChartData = ref([])
const actualChartData = ref([])
const actualChartLayout = ref({})

const renderChart = () => {
  let data = formatChartData(localChartData.value)

  let layout = {
    ...props.chartLayout
  }

  actualChartData.value = data
  actualChartLayout.value = layout
}

const formatChartData = (arrayOfObjects) => {
  if (!arrayOfObjects || arrayOfObjects.length === 0) {
    return []
  }

  let data = []
  if (arrayOfObjects.length) {
    const groupKey1 = props.config.keys[0]
    const groupKey2 = props.config.keys[1]
    const groupByLabel = arrayOfObjects.reduce((acc, current) => {
      if (!acc[current[groupKey1]]) {
        acc[current[groupKey1]] = {}
      }
      if (!acc[current[groupKey1]][current[groupKey2]]) {
        acc[current[groupKey1]][current[groupKey2]] = new Set()
      }
      acc[current[groupKey1]][current[groupKey2]].add(current[props.config.keyValue]?.toLowerCase())
      return acc
    }, {})

    Object.keys(groupByLabel).forEach(group => {
      let y = []
      Object.keys(groupByLabel[group]).forEach(asn => {
        y.push(groupByLabel[group][asn].size)
      })
      data.push({
        type: 'box',
        y: y,
        name: group,
        ...props.config
      })
    })

    data.sort((a, b) => {
      if (a.name === 'Other') {
        return 1
      }
      if (b.name === 'Other') {
        return -1
      }
    })
  }

  return data
}

const init = () => {
  if (props.chartData && props.chartData.length > 0) {
    localChartData.value = props.chartData
    renderChart()
  }
}

watch(
  () => props.chartData,
  () => {
    init()
  },
  { deep: true }
)

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
