<script setup>
import NetworkDelayAlarmsTable from '../tables/NetworkDelayAlarmsTable.vue'
import { Query, NetworkDelayAlarmsQuery } from '@/plugins/IhrApi'
import { ref, watch, onMounted, inject } from 'vue'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const DEFAULT_MIN_DEVIATION = 10

const props = defineProps({
  minDeviation: {
    type: Number,
    default: DEFAULT_MIN_DEVIATION,
    required: true
  },
  selectedType: {
    type: String,
    default: 'AS',
    required: false
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  fetch: {
    type: Boolean,
    required: true
  },
  filter: {
    type: String,
    default: ''
  }
})

const emits = defineEmits(['loading', 'network-delay-alarms-data-loaded'])

const tableData = ref([])
const plot = ref({
  startpoint_name: '',
  startpoint_type: '',
  endpoints: [],
  clear: 1
})
const loading = ref(true)

const apiCall = () => {
  const networkDelayAlarmsFilter = new NetworkDelayAlarmsQuery()
    .deviation(props.minDeviation, Query.GTE)
    .startPointType(props.selectedType)
    .timeInterval(props.startTime, props.endTime)
  loading.value = true
  emits('loading', loading.value)
  ihr_api.network_delay_alarms(
    networkDelayAlarmsFilter,
    (result) => {
      let data = []
      result.results.forEach((alarm) => {
        alarm['event_type'] = 'network_delay'
        data.push(alarm)
      })
      tableData.value = data
      loading.value = false
      emits('network-delay-alarms-data-loaded', data)
      emits('loading', loading.value)
    },
    (error) => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

watch(
  () => props.minDeviation,
  () => {
    apiCall()
  }
)

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
  <div class="IHR_chart">
    <div>
      <NetworkDelayAlarmsTable
        :start-time="startTime"
        :stop-time="endTime"
        :data="tableData"
        :loading="loading"
        :filter="filter"
      />
    </div>
  </div>
</template>
