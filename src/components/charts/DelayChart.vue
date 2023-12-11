<script setup>
import DelayAlarmsTable from '../tables/DelayAlarmsTable.vue'
import { DelayQuery, DelayAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { DELAY_CHART_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { ref, computed, watch, inject, onMounted } from 'vue'
import { uid } from 'quasar'
import { DEFAULT_MIN_NPROBES, DEFAULT_MIN_DEVIATION, DEFAULT_MIN_DIFFMEDIAN, DEFAULT_MAX_DIFFMEDIAN, DEFAULT_AS_FAMILY } from '@/plugins/delay'

const ihr_api = inject('ihr_api')

const props = defineProps({
  minNprobes: {
    type: Number,
    default: DEFAULT_MIN_NPROBES,
    required: true,
  },
  minDeviation: {
    type: Number,
    default: DEFAULT_MIN_DEVIATION,
    required: true,
  },
  minDiffmedian: {
    type: Number,
    default: DEFAULT_MIN_DIFFMEDIAN,
    required: true,
  },
  maxDiffmedian: {
    type: Number,
    default: DEFAULT_MAX_DIFFMEDIAN,
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

const emits = defineEmits(['filteredRows', {
'prefix-details': function(event) {
    if (event !== null) {
      return true
    } else {
      console.warn('Event is missing!');
      return false
    }
  },
}])

const delayAlarmsFilterLocal = new DelayAlarmsQuery()
  .numberOfProbes(props.minNprobes, DelayQuery.GTE)
  .deviation(props.minDeviation, DelayQuery.GTE)
  .medianDifference(props.minDiffmedian, DelayQuery.GTE)
  .medianDifference(props.maxDiffmedian, DelayQuery.LTE)
  .timeInterval(props.startTime, props.endTime)
  .orderedByTime()

const myId = ref(`ihrDelayChart${uid()}`)
const details = ref({
  activeTab: 'delay',
  data: [],
  tableVisible: false,
  loading: true,
})
const loading = ref(true)
const delayFilter = ref(null)
const delayAlarmsFilter = ref(delayAlarmsFilterLocal)
const filters = ref([delayAlarmsFilterLocal])
const traces = ref([])
const layout = DELAY_CHART_LAYOUT

const apiCall = () => {
  traces.value = []
  loading.value = true
  details.value.tableVisible = true
  details.value.loading = true
  ihr_api.delay_alarms(
    delayAlarmsFilter.value,
    result => {
      // console.log('queryDelayAlarmsAPI', result)
      let data = []
      let asn_list = []
      result.results.forEach(alarm => {
        data.some(elem => {
          return alarm.asn == elem.asn && alarm.link == elem.link && alarm.timebin == elem.timebin
        }) || data.push(alarm)
        asn_list.some(asn => alarm.asn == asn) || asn_list.push(alarm.asn)
      })
      details.value.data = data
      details.value.loading = false
      loading.value = false
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const delayAlarmsUrl = computed(() => {
  return ihr_api.getUrl(delayAlarmsFilter.value)
})

watch(() => props.minNprobes, () => {
  filters.value.forEach(filter => {
    filter.numberOfProbes(newValue, DelayQuery.GTE)
  })
  apiCall()
})

watch(() => props.minDeviation, () => {
  filters.value.forEach(filter => {
    filter.deviation(newValue, DelayQuery.GTE)
  })
  apiCall()
})

watch(() => props.minDiffmedian, () => {
  filters.value.forEach(filter => {
    filter.medianDifference(newValue, DelayQuery.GTE)
  })
  apiCall()
})

watch(() => props.maxDiffmedian, () => {
  filters.value.forEach(filter => {
    filter.medianDifference(newValue, DelayQuery.LTE)
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
      <DelayAlarmsTable
        :start-time="startTime"
        :stop-time="endTime"
        :data="details.data"
        :loading="details.loading"
        :filter="filter"
        show-asn
        @prefix-details="emits('prefix-details', $event)"
      />
    </div>
  </div>
</template>