<script setup>
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch, onMounted } from 'vue'
import * as TreeMapAggregatedAlarmsDataModel from '@/plugins/models/TreeMapAggregatedAlarmsDataModel'
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
    type: String
  },
  alarmTypeTitlesMap: {
    type: Object
  },
  networkName: {
    type: String
  }
})

const emits = defineEmits(['country-clicked'])

const layout = ref({
  margin: { t: 70, b: 0, l: 0, r: 0 },
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

const init = (alarms, aggregatedAttrsSelected, countryName, alarmTypeTitlesMap, networkName, isASGranularity) => {
  const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
  const treeMapTrace = [TreeMapAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, networkName, isASGranularity)]
  if (!treeMapTrace.length) {
    clearDataViz()
  } else {
    if (!Object.keys(treeMapTrace[0]).length) {
      clearDataViz()
    } else {
      traces.value = treeMapTrace
    }
  }
}

const clearDataViz = () => {
  traces.value = []
}

const plotlyClickedDataHandler = (val) => {
  emits('country-clicked', val)
}

watch(() => props.alarms, () => {
  if (props.networkName) {
    init(props.alarms, props.aggregatedAttrsSelected, props.countryName, props.alarmTypeTitlesMap, props.networkName, true)
  } else {
    init(props.alarms, props.aggregatedAttrsSelected, props.countryName, props.alarmTypeTitlesMap)
  }
})

onMounted(() => {
  init(props.alarms, props.aggregatedAttrsSelected, props.countryName, props.alarmTypeTitlesMap)
})
</script>

<template>
  <div class="IHR_chart">
    <div class="IHR_disco-chart">
        <ReactiveChart :layout="layout" :traces="traces" :no-data="noData" @plotly-click="plotlyClickedDataHandler" />
    </div>
  </div>
</template>