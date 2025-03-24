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
    const groupData = {}
    arrayOfObjects.forEach(obj => {
      Object.keys(obj).forEach(group => {
        let y = []
        if (obj[group]) {
          Object.keys(obj[group]).forEach(asn => {
            y.push(obj[group][asn].size)
          })
          const groupName = group.split('-')[1]
          if (!groupData[groupName]) {
            groupData[groupName] = {
              y: [],
              x: []
            }
          }
          groupData[groupName].y = [...groupData[groupName].y, ...y]
          groupData[groupName].x = [...groupData[groupName].x, ...y.map(_ => group.split('-')[0])]
        }
      })
    })    
    Object.keys(groupData).forEach(group => {
      const notOtherX = groupData[group].x.filter(val => val !== "Other");
      const notOtherY = groupData[group].y.filter((_, index) => groupData[group].x[index] !== "Other");
      const otherX = groupData[group].x.filter(val => val === "Other");
      const otherY = groupData[group].y.filter((_, index) => groupData[group].x[index] === "Other");
      data.push({
        type: 'box',
        y: [...notOtherY, ...otherY],
        x: [...notOtherX, ...otherX],
        name: group,
        ...props.config,
      })
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
