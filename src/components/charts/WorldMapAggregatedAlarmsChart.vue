<script setup>
import { QCardSection } from 'quasar'
import { ref, onMounted, watch } from 'vue'
import * as WorldMapAggregatedAlarmsDataModel from '@/plugins/models/WorldMapAggregatedAlarmsDataModel'
import WorldMapAggregatedAlarmsMap from '@/components/maps/WorldMapAggregatedAlarmsMap.vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: true
  },
  alarms: {
    type: Array
  },
  aggregatedAttrsSelected: {
    type: Object
  },
  alarmTypeTitlesMap: {
    type: Object
  },
  selectedCountry: {
    type: String,
    default: () => null
  }
})

const emits = defineEmits(['country-clicked'])

const worldMapTrace = ref({})
const chartTitle = ref('')

const init = (alarms, alarmCountsSelected, alarmTypeTitlesMap, selectedCountry, legendSelected) => {
  worldMapTrace.value = WorldMapAggregatedAlarmsDataModel.etl(
    alarms,
    alarmCountsSelected.counts,
    alarmTypeTitlesMap
  )
  chartTitle.value = WorldMapAggregatedAlarmsDataModel.getChartTitle(
    worldMapTrace.value,
    alarms,
    selectedCountry,
    legendSelected
  )
}

watch(
  () => props.alarms,
  () => {
    init(
      props.alarms,
      props.aggregatedAttrsSelected,
      props.alarmTypeTitlesMap,
      props.selectedCountry
    )
  }
)

onMounted(() => {
  init(props.alarms, props.aggregatedAttrsSelected, props.alarmTypeTitlesMap, props.selectedCountry)
})

defineExpose({ init })
</script>
<template>
  <div class="IHR_chart">
    <QCardSection>
      <div class="text-h6 center">{{ chartTitle }}</div>
    </QCardSection>
    <WorldMapAggregatedAlarmsMap
      :data="worldMapTrace"
      :loading="props.loading"
      @country-clicked="emits('country-clicked', $event)"
    />
  </div>
</template>
