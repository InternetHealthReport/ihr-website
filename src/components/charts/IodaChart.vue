<script setup>
import { IODA_ALARMS_SPECIFIC_ENTRY_TIMESERIES_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { ref, onMounted, computed } from 'vue'
import ReactiveChart from './ReactiveChart.vue'
import * as IodaChartDataModel from '@/plugins/models/IodaChartDataModel'
import { watch } from 'vue'

const props = defineProps({
  entityValue: {
    type: String,
    required: true
  },
  filterByCountry: {
    type: Boolean,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
})

const layout = ref(IODA_ALARMS_SPECIFIC_ENTRY_TIMESERIES_LAYOUT)
const traces = ref([])
const loading = ref(false)
const iodaSourceParams = ref('WEB_SEARCH')
const noData = ref('')

const entityType = computed(() => {
  return props.filterByCountry ? 'country' : 'asn'
})

const apiCall = () => {
  loading.value = true
  const iodaAlarmTypesUnits = IodaChartDataModel.getIodaAlarmTypesUnits()
  IodaChartDataModel.etl(
    entityType.value,
    props.entityValue,
    props.startTime,
    props.endTime,
    iodaAlarmTypesUnits,
    iodaSourceParams.value
  )
    .then((res) => {
      traces.value = res
      layout.value.datarevision = new Date().getTime()
      loading.value = false
      noData.value = !res.length ? 'No data to show' : ''
    })
    .catch((error) => {
      console.error(error)
    })
}

watch(
  () => props.endTime,
  () => {
    apiCall()
  }
)

onMounted(() => {
  apiCall()
})
</script>

<template>
  <div>
    <ReactiveChart :layout="layout" :traces="traces" :noData="noData" />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
  </div>
</template>
