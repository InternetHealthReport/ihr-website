<script setup>
import NetworkDelayAlarmsTable from '../tables/NetworkDelayAlarmsTable.vue'
import { Query, NetworkDelayAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { ref, computed, watch, onMounted, inject } from 'vue'

const ihr_api = inject('ihr_api')

const DEFAULT_MIN_DEVIATION = 10
const DEFAULT_AS_FAMILY = AS_FAMILY.v4

const props = defineProps({
  minDeviation: {
    type: Number,
    default: DEFAULT_MIN_DEVIATION,
    required: true,
  },
  selectedType: {
    type: String,
    default: 'AS',
    required: false,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  fetch: {
    type: Boolean,
    required: true,
  },
  filter: {
    type: String,
    default: '',
  },
})

const emits = defineEmits({
  'network-delay-alarms-data-loaded': () => {
    return true
  }
})

const networkDelayAlarmsFilterLocal = new NetworkDelayAlarmsQuery()
  .deviation(props.minDeviation, Query.GTE)
  .startPointType(props.selectedType)
  .timeInterval(props.startTime, props.endTime)
  //TODO add IXPs

const table = ref({
  activeTab: 'alarms',
  data: [],
  tableVisible: true,
  selectedRow: [],
})
const plot = ref({
  startpoint_name: '',
  startpoint_type: '',
  endpoints: [],
  clear: 1,
})
const loading = ref(true)
const delayFilter = ref(null)
const networkDelayAlarmsFilter = ref(networkDelayAlarmsFilterLocal)
const filters = ref([networkDelayAlarmsFilterLocal])

const apiCall = () => {
  loading.value = true
  table.value.tableVisible = true
  ihr_api.network_delay_alarms(
    networkDelayAlarmsFilter.value,
    result => {
      let data = []
      result.results.forEach(alarm => {
        data.push(alarm)
      })
      table.value.data = data
      loading.value = false
      emits('network-delay-alarms-data-loaded', data)
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

watch(() => props.minDeviation, () => {
  filters.value.forEach(filter => {
    filter.deviation(newValue, NetworkDelayAlarmsQuery.GTE)
  })
  apiCall()
})

onMounted(() => {
  apiCall()
})
</script>

<template>
  <div class="IHR_chart">
    <div>
      <NetworkDelayAlarmsTable
        :start-time="startTime"
        :stop-time="endTime"
        :data="table.data"
        :loading="loading"
        :filter="filter"
      />
    </div>
  </div>
</template>