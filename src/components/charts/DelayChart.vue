<script setup>
import DelayAlarmsTable from '../tables/DelayAlarmsTable.vue'
import { DelayQuery, DelayAlarmsQuery } from '@/plugins/IhrApi'
import { ref, watch, inject, onMounted } from 'vue'
import {
  DEFAULT_MIN_NPROBES,
  DEFAULT_MIN_DEVIATION,
  DEFAULT_MIN_DIFFMEDIAN,
  DEFAULT_MAX_DIFFMEDIAN
} from '@/plugins/delay'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const props = defineProps({
  minNprobes: {
    type: Number,
    default: DEFAULT_MIN_NPROBES,
    required: true
  },
  minDeviation: {
    type: Number,
    default: DEFAULT_MIN_DEVIATION,
    required: true
  },
  minDiffmedian: {
    type: Number,
    default: DEFAULT_MIN_DIFFMEDIAN,
    required: true
  },
  maxDiffmedian: {
    type: Number,
    default: DEFAULT_MAX_DIFFMEDIAN,
    required: true
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

const emits = defineEmits([
  'loading',
  'filteredRows',
  {
    'prefix-details': function (event) {
      if (event !== null) {
        return true
      } else {
        console.warn('Event is missing!')
        return false
      }
    }
  }
])

const tableData = ref([])
const loading = ref(true)

const apiCall = () => {
  const delayAlarmsFilter = new DelayAlarmsQuery()
    .numberOfProbes(props.minNprobes, DelayQuery.GTE)
    .deviation(props.minDeviation, DelayQuery.GTE)
    .medianDifference(props.minDiffmedian, DelayQuery.GTE)
    .medianDifference(props.maxDiffmedian, DelayQuery.LTE)
    .timeInterval(props.startTime, props.endTime)
    .orderedByTime()
  loading.value = true
  emits('loading', loading.value)
  ihr_api.delay_alarms(
    delayAlarmsFilter,
    (result) => {
      // console.log('queryDelayAlarmsAPI', result)
      let data = []
      let asn_list = []
      result.results.forEach((alarm) => {
        data.some((elem) => {
          return alarm.asn == elem.asn && alarm.link == elem.link && alarm.timebin == elem.timebin
        }) || data.push(alarm)
        asn_list.some((asn) => alarm.asn == asn) || asn_list.push(alarm.asn)
      })
      tableData.value = data
      loading.value = false
      emits('loading', loading.value)
    },
    (error) => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

watch(
  () => props.minNprobes,
  () => {
    apiCall()
  }
)

watch(
  () => props.minDeviation,
  () => {
    apiCall()
  }
)

watch(
  () => props.minDiffmedian,
  () => {
    apiCall()
  }
)

watch(
  () => props.maxDiffmedian,
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
      <DelayAlarmsTable
        :start-time="startTime"
        :stop-time="endTime"
        :data="tableData"
        :loading="loading"
        :filter="filter"
        show-asn
        @prefix-details="emits('prefix-details', $event)"
      />
    </div>
  </div>
</template>
