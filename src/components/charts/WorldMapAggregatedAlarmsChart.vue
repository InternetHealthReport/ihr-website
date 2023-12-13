<script setup>
import { ref, onMounted, watch } from 'vue'
import * as WorldMapAggregatedAlarmsDataModel from '@/plugins/models/WorldMapAggregatedAlarmsDataModel'
import WorldMapAggregatedAlarmsMap from '../maps/WorldMapAggregatedAlarmsMap.vue'
import { getCountryISOCode3 } from '@/plugins/countryName'

const props = defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  alarms: {
    type: Array,
  },
  aggregatedAttrsSelected: {
    type: Object,
  },
  alarmTypeTitlesMap: {
    type: Object
  }
})

const emits = defineEmits({
  'country-clicked': () => {

  }
})

const worldMapTrace = ref({})

// const plotlyClickedDataHandler = (newPlotlyClickedData) => {
//   console.log(newPlotlyClickedData)
// }

const init = (alarms, alarmCountsSelected, alarmTypeTitlesMap) => {
  worldMapTrace.value = WorldMapAggregatedAlarmsDataModel.etl(alarms, Object.keys(alarmCountsSelected.counts), alarmTypeTitlesMap)
  if (worldMapTrace.value.locations) {
    worldMapTrace.value.locations = worldMapTrace.value.locations.map(val => getCountryISOCode3(val))
  }
}


watch(() => props.alarms, () => {
  init(props.alarms, props.aggregatedAttrsSelected, props.alarmTypeTitlesMap)
})

onMounted(() => {
  init(props.alarms, props.aggregatedAttrsSelected, props.alarmTypeTitlesMap)
})
</script>

<template>
  <div class="IHR_chart">
    <WorldMapAggregatedAlarmsMap :data="worldMapTrace" :loading="props.loading" />
  </div>
</template>