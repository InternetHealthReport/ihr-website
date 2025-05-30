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
  },
  groupTopNAndExceptAsOthers: {
    type: Number,
    default: 3
  }
})

const localChartData = ref([])
const actualChartData = ref([])
const actualChartLayout = ref({})

const renderChart = () => {
  let data = []

  if (props.config.groupKey) {
    // find all different values for the groupping field
    let group_values = []
    localChartData.value.forEach((item) => {
      if (!group_values.includes(item[props.config.groupKey])) {
        group_values.push(item[props.config.groupKey])
      }
    })

    console.log(group_values)

    group_values.forEach((group) => {
      const filtData = localChartData.value.filter((item) => item[props.config.groupKey] == group)

      const formattedData = formatChartData(filtData)
      const groupedData = groupTopNAndExceptAsOthers(formattedData)

      data.push({
        name: group,
        x: groupedData.labels,
        y: groupedData.data,
        type: 'bar'
      })
    })
  } else {
    const formattedData = formatChartData(localChartData.value)
    const groupedData = groupTopNAndExceptAsOthers(formattedData)

    data.push({
      x: groupedData.labels,
      y: groupedData.data,
      type: 'bar'
    })
  }

  const layout = {
    ...props.chartLayout
  }

  actualChartLayout.value = layout
  actualChartData.value = data
}

const formatChartData = (arrayOfObjects) => {
  if (!arrayOfObjects || arrayOfObjects.length === 0) {
    return []
  }
  const map = {}
  let prefix = props.config.xlabel_prefix ? props.config.xlabel_prefix : ''
  arrayOfObjects.forEach((item) => {
    let keys = item[props.config.key]
    if (!Array.isArray(keys)) {
      keys = [keys]
    }
    keys.forEach((key) => {
      let value = props.config.value ? item[props.config.value] : 1
      if (!map[prefix + String(key)]) {
        map[prefix + String(key)] = value
      } else {
        map[prefix + String(key)] += value
      }
    })
  })
  return [{ data: Object.values(map), labels: Object.keys(map) }]
}

const groupTopNAndExceptAsOthers = (formattedData) => {
  // following is to clean the data to plot the chart (top N, and except as others)
  // mapping data and labels
  let arr = []
  for (let i = 0; i < formattedData[0].data.length; i++) {
    arr.push({ cc: formattedData[0].labels[i], data: formattedData[0].data[i] })
  }

  // sorting the arr (array) with the data property
  let sortedChartData = arr.slice().sort((a, b) => b.data - a.data)

  // grouping top N and except as others
  const topN = sortedChartData.slice(0, props.groupTopNAndExceptAsOthers)
  const othersSum = sortedChartData
    .slice(props.groupTopNAndExceptAsOthers)
    .reduce((sum, obj) => sum + obj.data, 0)

  let chartValues = []
  let chartLabels = []
  for (let i = 0; i < topN.length; i++) {
    chartValues.push(topN[i].data)
    chartLabels.push(topN[i].cc)
  }

  if (othersSum > 0) {
    chartValues.push(othersSum)
    chartLabels.push('Others')
  }

  return { labels: chartLabels, data: chartValues }
}

const init = () => {
  if (props.chartData && props.chartData.length > 0) {
    localChartData.value = props.chartData
    renderChart()
  } else {
    actualChartData.value = []
    actualChartLayout.value = {
      ...props.layout
    }
  }
}

watch(
  () => props,
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
