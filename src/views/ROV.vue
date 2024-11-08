<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/plugins/disco'
import { AS_FAMILY } from '@/plugins/IhrApi'
import { isoCountries } from '@/plugins/countryName'
import report from '@/plugins/report'
import DateTimePicker from '@/components/DateTimePicker.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import Feedback from '@/components/Feedback.vue'
import '@/styles/chart.css'

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1
}

const CHART_REFS = [
  'countryHegemonyChart',
  'prefixHegemonyChart',
  'networkDelayChart',
  'delayAndForwardingChart',
  'ihrChartDisco'
]

const route = useRoute()
const router = useRouter()

const asNumber = ref(2497)
const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)
const loadingStatus = ref(LOADING_STATUS.LOADING)
const countryCode = ref(route.params.cc)
const countryName = ref(null)
const charRefs = ref(CHART_REFS)
const minAvgLevel = ref(DEFAULT_DISCO_AVG_LEVEL)
const show = ref({
  disco: true,
  disco_disable: false,
  hegemony: true,
  hegemony_disable: false,
  net_delay: true,
  net_delay_disable: false
})
const majorEyeballs = ref([])
const majorEyeballsThreshold = ref(10)

const timeRange = route.query.last ? route.query.last : 3

let {
  interval,
  minDate,
  maxDate,
  fetch,
  utcString,
  reportDateFmt,
  setReportDate,
  startTime,
  endTime
} = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const family = computed(() => {
  return addressFamily.value == 6 ? AS_FAMILY.v6 : AS_FAMILY.v4
})
const addressFamilyText = computed(() => {
  return addressFamily.value ? 'IPv4' : 'IPv6'
})
const showGraphs = computed(() => {
  return loadingStatus.value == LOADING_STATUS.LOADED
})
const headerString = computed(() => {
  if (loadingStatus.value == LOADING_STATUS.LOADING) {
    return t('Networks.headerString.loading')
  } else if (loadingStatus.value == LOADING_STATUS.NOT_FOUND) {
    return t('Networks.headerString.notFound')
  } else if (loadingStatus.value == LOADING_STATUS.EXPIRED) {
    return t('Networks.headerString.expired')
  } else if (loadingStatus.value == LOADING_STATUS.LOADED) {
    return isoCountries[countryCode]
  } else {
    return t('genericErrors.ups')
  }
})
const subHeader = computed(() => {
  if (loadingStatus.value == LOADING_STATUS.LOADING) {
    return t('Networks.subHeader.loading')
  } else if (loadingStatus.value == LOADING_STATUS.NOT_FOUND) {
    return t('Networks.subHeader.notFound')
  } else if (loadingStatus.value == LOADING_STATUS.EXPIRED) {
    return t('Networks.subHeader.expired')
  } else if (loadingStatus.value == LOADING_STATUS.LOADED) {
    return countryCode
  } else {
    return t('genericErrors.badHappened')
  }
})

const pushRoute = () => {
  router.push({
    replace: true,
    query: Object.assign({}, route.query, {
      af: family.value,
      last: interval.value.dayDiff(),
      date: utcString(interval.value.end).split('T')[0],
      rov_tb: 'routes'
    })
  })
  loadingStatus.value = LOADING_STATUS.LOADED
  fetch.value = true
}
watch(addressFamily, () => {
  pushRoute()
})
watch(interval, () => {
  pushRoute()
})
onMounted(() => {
  pushRoute()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div>
      <h1 class="text-center"><q-icon name="fas fa-route" />&nbsp; Route Origin Validation</h1>
      <h3 class="text-center">
        {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
        <DateTimePicker
          :min="minDate"
          :max="maxDate"
          :value="endTime"
          hide-time
          @input="setReportDate"
        />
      </h3>
    </div>
    <PrefixHegemonyChart :start-time="startTime" :end-time="endTime" :fetch="fetch" />
    <!-- <button @click="generateReport()" class="np-btn">Generate Report</button> -->
  </div>
  <Feedback />
</template>
