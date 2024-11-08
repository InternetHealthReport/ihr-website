<script setup>
import { RIR_COUNTRY_SUNBURST_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { ref, onMounted } from 'vue'
import ReactiveChart from './ReactiveChart.vue'

const colors = new Map([
  ['ARIN', '#e41a1c'],
  ['RIPE NCC', '#377eb8'],
  ['APNIC', '#4daf4a'],
  ['AFRINIC', '#984ea3'],
  ['LACNIC', '#ff7f00'],
  ['Other', '#8C564B']
])

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const traces = ref([])
const layout = ref({ ...RIR_COUNTRY_SUNBURST_LAYOUT, sunburstcolorway: [] })
const chartTitle = ref(null)
const noData = ref('')

const watcher = (newData) => {
  const labels = ['Total']
  const parents = ['']
  const values = [0]
  const hovertext = ['']
  var total = 0
  var rir_values = []
  for (const [label, parent, value, htext] of newData) {
    labels.push(label)
    parents.push(parent)
    values.push(value)
    hovertext.push(htext)
    if (parent != 'Total') {
      total += value
    } else {
      rir_values.push([value, label])
    }
  }
  // We need to know the order of the RIRs to assign the colorway in the correct order...
  rir_values.sort(function (a, b) {
    return b[0] - a[0]
  })
  for (const rir of rir_values) {
    layout.value.sunburstcolorway.push(colors.get(rir[1]))
  }
  values[0] = total
  if (total == 0) {
    noData.value = 'No data available.'
  }
  traces.value = [{ type: 'sunburst', labels, parents, values, hovertext, branchvalues: 'total' }]
}

onMounted(() => {
  watcher(props.data)
})
</script>

<template>
  <div>
    <ReactiveChart :layout="layout" :traces="traces" :chart-title="chartTitle" :no-data="noData" />
  </div>
</template>
