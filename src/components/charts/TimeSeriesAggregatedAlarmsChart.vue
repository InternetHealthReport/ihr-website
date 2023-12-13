<script setup>
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch, onMounted } from 'vue'
import * as TimeSeriesAggregatedAlarmsDataModel from '@/plugins/models/TimeSeriesAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  alarms: {
    type: Array,
  },
  aggregatedAttrsSelected: {
    type: Object,
  },
  countryName: {
    type: String,
  },
  alarmTypeTitlesMap: {
    type: Object
  }
})

const layout = ref({
  margin: { t: 50, b: 65, l: 40, r: 0 },
  title: 'Alarms for all Countries over Time',
  xaxis: {
    title: 'Date',
  },
  yaxis: {
    title: 'Number of Alarms',
  },
  hovermode: 'closest',
  showlegend: true,
  legend: {
    x: 1,
    xanchor: 'top',
    y: 1
  },
  height: 400
})
const traces = ref([])

const noData = computed(() => {
  if (!props.loading && !traces.value.length) {
    return 'No data to show'
  } else if (!props.loading) {
    return false
  } else {
    return 'Loading...'
  }
})

const init = (alarms, aggregatedAttrsSelected, countryName, alarmTypeTitlesMap) => {
  const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
  const timeSeriesTraces = TimeSeriesAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap)
  if (!timeSeriesTraces.length) {
    clearDataViz()
  } else {
    const chartTitle = countryName ? `Alarms by ASNs over Time for ${countryName}` : 'Alarms for all Countries over Time'
    traces.value = timeSeriesTraces
    layout.value.title = chartTitle
  }
}

const clearDataViz = () => {
  traces.value = []
  layout.value.title = 'Alarms for all Countries over Time'
}

watch(() => props.alarms, () => {
  init(props.alarms, props.aggregatedAttrsSelected, props.countryName, props.alarmTypeTitlesMap)
})

onMounted(() => {
  init(props.alarms, props.aggregatedAttrsSelected, props.countryName, props.alarmTypeTitlesMap)
})
</script>

<template>
  <div class="IHR_chart">
    <div class="IHR_disco-chart">
        <ReactiveChart :layout="layout" :traces="traces" :no-data="noData" />
    </div>
  </div>
</template>