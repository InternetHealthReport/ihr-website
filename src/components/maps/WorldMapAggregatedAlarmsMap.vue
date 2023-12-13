<script setup>
import { P } from 'plotly.js-dist';
import ReactiveChart from '../charts/ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'

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
  }
})

const layout = ref({
  hovermode: 'closest',
  margin: { t: 80, b: 10, l: 80, r: 80 },
  title: 'Aggregated Alarms by Countries',
  geo: {
    showframe: false,
    showcoastlines: false,
    showland: true,
    landcolor: 'rgb(215, 215, 215)',
    countrycolor: 'rgb(235, 235, 235)',
    showcountries: true,
  },
  height: 400
})
const traces = ref([
  {
    type: 'choropleth',
    locations: [],
    z: [],
    text: [],
    name: '',
    customdata: [],
    hovertemplate: '',
    colorscale: 'Viridis',
    showscale: true,
    marker: {
      line: {
        color: 'rgb(255,255,255)',
        width: 1,
      },
    },
    hoverlabel: {
      bgcolor: 'white',
    },
    colorbar: {
      title: 'Alarm Counts',
      len: 0.9,
    }
  },
])
const noData = ref('')

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
}

watch(() => props.data, () => {
  clearDataViz()
  setTraces()
})

onMounted(() => {
  clearDataViz()
  setTraces()
})
</script>

<template>
  <div class="IHR_disco-chart">
    <ReactiveChart :layout="layout" :traces="traces" :no-data="noData" @plotly-click="plotlyClickedDataHandler" />
  </div>
</template>