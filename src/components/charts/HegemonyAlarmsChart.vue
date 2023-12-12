<script setup>
import HegemonyAlarmsTable from '../tables/HegemonyAlarmsTable.vue'
import { Query, HegemonyAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { HEGEMONY_ALARMS_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { ref, onMounted, computed, watch, inject } from 'vue'

const ihr_api = inject('ihr_api')

const DEFAULT_MIN_DEVIATION = 10
const DEFAULT_AS_FAMILY = AS_FAMILY.v4

const props = defineProps({
  minDeviation: {
    type: Number,
    default: DEFAULT_MIN_DEVIATION,
    required: true,
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
  'hegemony-alarms-data-loaded': () => {
    return true
  }
})

let hegemonyAlarmsFilterLocal = new HegemonyAlarmsQuery()
  .deviation(props.minDeviation, Query.GTE)
  .timeInterval(props.startTime, props.endTime)

const tableData = ref([])
const loading = ref(true)

const apiCall = () => {
  const hegemonyAlarmsFilter = new HegemonyAlarmsQuery().deviation(props.minDeviation, Query.GTE).timeInterval(props.startTime, props.endTime)
  loading.value = true
  ihr_api.hegemony_alarms(
    hegemonyAlarmsFilter,
    result => {
      let data = []
      result.results.forEach(alarm => {
        data.push(alarm)
      })
      tableData.value = data
      loading.value = false
      emits('hegemony-alarms-data-loaded', data)
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

watch(() => props.minDeviation, () => {
  apiCall()
})

watch(() => props.endTime, () => {
  apiCall()
})

onMounted(() => {
  apiCall()
})
</script>

<template>
  <div class="IHR_chart">
      <HegemonyAlarmsTable
          :start-time="startTime"
          :stop-time="endTime"
          :data="tableData"
          :loading="loading"
          :filter="filter"
      />
  </div>
</template>