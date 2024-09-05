<script setup>
import { QCardSection } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch, onMounted } from 'vue'
import * as TimeSeriesAggregatedAlarmsDataModel from '@/plugins/models/TimeSeriesAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'

const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  alarms: {
    type: Array
  },
  startTime: {
    type: Date
  },
  endTime: {
    type: Date
  },
  aggregatedAttrsSelected: {
    type: Object
  },
  countryName: {
    type: String
  },
  alarmTypeTitlesMap: {
    type: Object
  },
  isASGranularity: {
    type: Boolean
  },
  legendSelected: {
    type: String
  }
})

const emits = defineEmits(['timeseries-legend-clicked', 'select-time'])

const layout = ref({
  autosize: true,
  margin: { t: 32, b: 65, l: 40, r: 0 },
  xaxis: {
    title: 'Time (UTC)',
    autorange: true
  },
  yaxis: {
    title: 'Number of Alarms',
    autorange: true
  },
  hovermode: 'closest',
  showlegend: true,
  legend: {
    x: 1,
    xanchor: 'top',
    y: 1
  },
  height: 500
})
const traces = ref([])
const chartTitle = ref('')

const noData = computed(() => {
  if (!props.loading && !traces.value.length) {
    return 'No data to show'
  } else if (!props.loading) {
    return false
  } else {
    return 'Loading...'
  }
})

const init = (
  alarms,
  startTime,
  endTime,
  aggregatedAttrsSelected,
  countryName,
  alarmTypeTitlesMap,
  legendSelected,
  isASGranularity,
  render = true
) => {
  if (render) {
    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
    traces.value = TimeSeriesAggregatedAlarmsDataModel.etl(
      alarms,
      aggregatedAttrsZipped,
      countryName,
      alarmTypeTitlesMap,
      legendSelected,
      isASGranularity
    )
    if (layout.value.xaxis && layout.value.yaxis) {
      layout.value.xaxis.autorange = true
      layout.value.yaxis.autorange = true
    }
  }
  chartTitle.value = TimeSeriesAggregatedAlarmsDataModel.getChartTitle(
    traces.value,
    countryName,
    startTime,
    endTime,
    legendSelected,
    isASGranularity
  )
}

const plotlySelectTimeHandler = (obj) => {
  obj.startDateTime = obj.startDateTime.toISOString().slice(0, 16)
  obj.endDateTime = obj.endDateTime.toISOString().slice(0, 16)
  emits('select-time', obj)
}

const onTimeseriesLegendClicked = (legend) => {
  emits('timeseries-legend-clicked', legend)
}

watch(
  () => props.alarms,
  () => {
    init(
      props.alarms,
      props.startTime,
      props.endTime,
      props.aggregatedAttrsSelected,
      props.countryName,
      props.alarmTypeTitlesMap,
      props.legendSelected,
      props.isASGranularity
    )
  }
)

onMounted(() => {
  init(
    props.alarms,
    props.startTime,
    props.endTime,
    props.aggregatedAttrsSelected,
    props.countryName,
    props.alarmTypeTitlesMap,
    props.legendSelected,
    props.isASGranularity
  )
})

defineExpose({ init })
</script>

<template>
  <div class="IHR_chart">
    <QCardSection>
      <div class="text-h6 center">{{ chartTitle }}</div>
    </QCardSection>
    <div class="IHR_disco-chart">
      <ReactiveChart
        :layout="layout"
        :traces="traces"
        :no-data="noData"
        @plotly-legend-click="onTimeseriesLegendClicked"
        @plotly-time-filter="plotlySelectTimeHandler"
      />
    </div>
  </div>
</template>
