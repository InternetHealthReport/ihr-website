<script setup>
import { COMMON_FEATURE } from '@/plugins/layouts/layoutsChart.js'
import ReactiveChart from '../charts/ReactiveChart.vue'
import { ref, onMounted, watch, computed } from 'vue'

const props = defineProps({
  data: {
    type: Object,
    default: {
      customdata: [],
      hovertemplate: '',
      locations: [],
      text: [],
      z: []
    }
  },
  loading: {
    type: Boolean
  }
})

const emits = defineEmits(['country-clicked'])

const layout = ref({
  ...COMMON_FEATURE,
  hovermode: 'closest',
  geo: {
    showframe: false,
    showcoastlines: false,
    showland: true,
    landcolor: 'rgb(215, 215, 215)',
    countrycolor: 'rgb(235, 235, 235)',
    showcountries: true
  },
  height: 500
})
const traces = ref([
  {
    type: 'choropleth',
    locations: [],
    z: [],
    zmin: 0,
    zmax: 0,
    text: [],
    name: '',
    customdata: [],
    hovertemplate: '',
    colorscale: 'Viridis',
    showscale: true,
    marker: {
      line: {
        color: 'rgb(255,255,255)',
        width: 1
      }
    },
    hoverlabel: {
      bgcolor: 'white'
    },
    colorbar: {
      title: 'Alarm Density',
      len: 0.9
    }
  }
])
const zmax = ref(null)

const clearDataViz = () => {
  traces.value[0].locations = []
}

const setTraces = () => {
  clearDataViz()
  traces.value[0].customdata = props.data.customdata
  traces.value[0].hovertemplate = props.data.hovertemplate
  traces.value[0].locations = props.data.locations
  traces.value[0].text = props.data.text
  traces.value[0].z = props.data.z
  if (traces.value[0].customdata) {
    const max = Math.max(...traces.value[0].customdata.map((o) => o.hegemony_count), 0)
    if (zmax.value == null) {
      zmax.value = max
      traces.value[0].zmax = max
    } else {
      traces.value[0].zmax = zmax.value
    }
  }
}

watch(
  () => props.data,
  () => {
    clearDataViz()
    setTraces()
  }
)

const noData = computed(() => {
  if (!props.loading && !traces.value[0].locations?.length) {
    return 'No data to show'
  } else if (!props.loading) {
    return false
  } else {
    return 'Loading...'
  }
})

const plotlyClickedDataHandler = (val) => {
  const country = val.points[0].text
  emits('country-clicked', country)
}

onMounted(() => {
  setTraces()
})
</script>

<template>
  <div class="IHR_disco-chart">
    <ReactiveChart
      :layout="layout"
      :traces="traces"
      :no-data="noData"
      @plotly-click="plotlyClickedDataHandler"
    />
  </div>
</template>
