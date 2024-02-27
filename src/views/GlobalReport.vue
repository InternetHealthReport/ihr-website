<script setup>
import { QExpansionItem, QItemSection, QIcon, QInput, QCard, QCardSection } from 'quasar'
import DateTimePicker from '@/components/DateTimePicker.vue'
import { ref, computed, watch, nextTick, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useRoute, useRouter } from 'vue-router'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/plugins/disco'
import { DEFAULT_MIN_NPROBES, DEFAULT_MIN_DEVIATION, DEFAULT_MIN_DIFFMEDIAN, DEFAULT_MAX_DIFFMEDIAN } from '@/plugins/delay'
import AggregatedAlarmsController from '@/components/controllers/AggregatedAlarmsController.vue'
import { Query, HegemonyAlarmsQuery, NetworkDelayAlarmsQuery, DiscoEventQuery } from '@/plugins/IhrApi'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'

const ihr_api = inject('ihr_api')

const route = useRoute()
const router = useRouter()

const timeRange = route.query.last ? route.query.last : 1

let { interval, utcString, fetch, reportDateFmt, minDate, maxDate, setReportDate, startTime, endTime } = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const PARAMETERS_LEVEL = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

const PRAMETERS_PRESETS = {
  DISCO_AVG_LEVEL: [7, DEFAULT_DISCO_AVG_LEVEL, 10],
  MIN_NPROBES: [5, DEFAULT_MIN_NPROBES, 12],
  MIN_DEVIATION: [100, DEFAULT_MIN_DEVIATION, 120],
  MIN_DIFFMEDIAN: [10, DEFAULT_MIN_DIFFMEDIAN, 20],
  MAX_DIFFMEDIAN: [150, DEFAULT_MAX_DIFFMEDIAN, 300],
}

let setFilterLevel = Number(route.query.filter_level)
setFilterLevel = setFilterLevel ? setFilterLevel : PARAMETERS_LEVEL.MEDIUM

const aggregatedAlarmsExpanded = ref(true)
const filterLevel = ref(setFilterLevel)
const minAvgLevel = ref(PRAMETERS_PRESETS.DISCO_AVG_LEVEL[filterLevel])
const minNprobes = ref(PRAMETERS_PRESETS.MIN_NPROBES[filterLevel])
const minDeviation = ref(PRAMETERS_PRESETS.MIN_DEVIATION[filterLevel])
const minDeviationNetworkDelay = ref(20)
const minDiffmedian = ref(PRAMETERS_PRESETS.MIN_DEVIATION[filterLevel])
const maxDiffmedian = ref(PRAMETERS_PRESETS.MAX_DIFFMEDIAN[filterLevel])
const loading = ref({
  hegemony: true,
  network_delay: true,
  network_disconnection: true
})
const hegemonyAlarms = ref([])
const networkDelayAlarms = ref([])
const networkDisconnectionAlarms = ref([])
const selectedType = ref('AS')

const hegemonyLoading = (val) => {
  nextTick(() => {
    loading.value.hegemony = val
  })
}

const networkDelayLoading = (val) => {
  nextTick(() => {
    loading.value.network_delay = val
  })
}

const discoLoading = (val) => {
  nextTick(() => {
    loading.value.network_disconnection = val
  })
}

const pushRoute = () => {
  router.push({
    replace: true,
    query: {
      filter_level: filterLevel.value,
      last: interval.value.dayDiff(),
      date: utcString(interval.value.end).split('T')[0],
    },
    hash: route.hash,
  })

  minAvgLevel.value = PRAMETERS_PRESETS.DISCO_AVG_LEVEL[filterLevel.value]
  minNprobes.value = PRAMETERS_PRESETS.MIN_NPROBES[filterLevel.value]
  minDeviation.value = PRAMETERS_PRESETS.MIN_DEVIATION[filterLevel.value]
  minDiffmedian.value = PRAMETERS_PRESETS.MIN_DIFFMEDIAN[filterLevel.value]
  maxDiffmedian.value = PRAMETERS_PRESETS.MAX_DIFFMEDIAN[filterLevel.value]
}

const hegemonyApiCall = () => {
  hegemonyLoading(true)
  const alarms = []
  const promises = []
  for (const hegemonyAlarmsFilter of hegemonyAlarmsFilters.value) {
    const newHegemonyAlarmsPromise = new Promise((resolve, reject) => {
      ihr_api.hegemony_alarms(
        hegemonyAlarmsFilter,
        result => {
          alarms.push(...result.results)
          resolve()
        }, error => {
          reject(error)
        }
      )
    })
    promises.push(newHegemonyAlarmsPromise)
  }
  Promise.all(promises).then(() => {
    alarms.forEach((alarm) => alarm.event_type = 'hegemony')
    hegemonyAlarms.value = alarms
    hegemonyLoading(false)
  })
}

const networkDelayApiCall = () => {
  networkDelayLoading(true)
  const alarms = []
  const promises = []
  for (const networkDelayFilter of networkDelayAlarmsFilters.value) {
    const newNetworkDelayAlarmsPromise = new Promise((resolve, reject) => {
      ihr_api.network_delay_alarms(
        networkDelayFilter,
        result => {
          alarms.push(...result.results)
          resolve()
        }, error => {
          reject(error)
        }
      )
    });
    promises.push(newNetworkDelayAlarmsPromise)
  }
  Promise.all(promises).then(() => {
    alarms.forEach((alarm) => alarm.event_type = 'network_delay')
    networkDelayAlarms.value = alarms
    networkDelayLoading(false)
  })
}

const networkDisconnectionApiCall = () => {
  discoLoading(true)
  const alarms = []
  const promises = []
  for (const networkDisconnectionFilter of networkDisconnectionAlarmsFilters.value) {
    const newNetworkDisconnectionAlarmsPromise = new Promise((resolve, reject) => {
      ihr_api.disco_events(
        networkDisconnectionFilter,
        result => {
          alarms.push(...result.results)
          resolve()
        }, error => {
          reject(error)
        }
      )
    })
    promises.push(newNetworkDisconnectionAlarmsPromise)
  }
  Promise.all(promises).then(() => {
    alarms.forEach((alarm) => alarm.event_type = 'network_disconnection')
    networkDisconnectionAlarms.value = alarms
    discoLoading(false)
  })
}

const aggregatedAlarmsKey = computed(() => {
  let renderingKey = ''
  const alarmTypes = Object.keys(ALARMS_INFO['ihr'].alarm_types)
  alarmTypes.forEach(alarmType => {
    const isAlarmTypeSelected = ALARMS_INFO['ihr'].alarm_types[alarmType].metadata.is_default_selected
    renderingKey += `${JSON.stringify({ [alarmType]: (isAlarmTypeSelected && loading.value[alarmType]) })}-`
  })
  return renderingKey
})

const hegemonyAlarmsFilters = computed(() => {
  const hegemonyAlarmsFilter1 = new HegemonyAlarmsQuery()
    .deviation(20, Query.GTE)
    .timeInterval(startTime.value, endTime.value)
  const hegemonyAlarmsFilter2 = new HegemonyAlarmsQuery()
    .deviation(-20, Query.LTE)
    .timeInterval(startTime.value, endTime.value)
  return [hegemonyAlarmsFilter1, hegemonyAlarmsFilter2]
})

const networkDelayAlarmsFilters = computed(() => {
  const networkDelayAlarmsFilter = new NetworkDelayAlarmsQuery()
    .deviation(20, Query.GTE)
    .startPointType(selectedType.value)
    .timeInterval(startTime.value, endTime.value)
  return [networkDelayAlarmsFilter]
})

const networkDisconnectionAlarmsFilters = computed(() => {
  const networkDisconnectionAlarmsFilter = new DiscoEventQuery()
    .streamName('')
    .timeInterval(startTime.value, endTime.value)
    .orderedByTime();
  return [networkDisconnectionAlarmsFilter]
})

const apiCalls = () => {
  hegemonyApiCall()
  networkDelayApiCall()
  networkDisconnectionApiCall()
}

watch(filterLevel, (newValue, oldValue) => {
  if (newValue != oldValue) {
    pushRoute()
  }
})

watch(interval, () => {
  pushRoute()
  apiCalls()
})

onMounted(() => {
  pushRoute()
  apiCalls()
  fetch.value = true
})

</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div class="q-mb-xs">
      <div class="text-center">
        <div class="text-h1">{{ $t('globalReport.title.global') }}</div>
        <div class="text-h3">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <DateTimePicker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime
            class="IHR_subtitle_calendar" />
        </div>
      </div>
    </div>
    <QExpansionItem caption="IHR Aggregated Alarms" header-class="IHR_charts-title" default-opened expand-icon-toggle
      v-model="aggregatedAlarmsExpanded">
      <template v-slot:header>
        <div class="graph-header-div">
          <QItemSection class="graph-header">
            <QItemSection avatar>
              <QIcon name="fas fa-bell" color="primary" text-color="white" />
            </QItemSection>

            <QItemSection>
              <a id="aggregatedAlarms"></a>
              <div class="text-primary">
                {{ $t('charts.aggregatedAlarms.title') }}
              </div>
              <div class="text-caption text-grey">IHR Aggregated Alarms</div>
            </QItemSection>
          </QItemSection>
        </div>
      </template>
      <AggregatedAlarmsController :startTime="startTime" :endTime="endTime" :hegemonyAlarms="hegemonyAlarms"
        :networkDelayAlarms="networkDelayAlarms" :key="aggregatedAlarmsKey" :hegemonyLoading="loading.hegemony"
        :networkDelayLoading="loading.network_delay" :networkDisconnectionAlarms="networkDisconnectionAlarms"
        :networkDisconnectionLoading="loading.network_disconnection" />
    </QExpansionItem>
  </div>
</template>


<style lang="stylus">
.stat-grid
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 20px;
  align-items: stretch;
@media screen and (max-width: 768px)
  .stat-grid
    grid-template-columns: repeat(2, 1fr);
@media screen and (max-width: 480px)
  .stat-grid
    grid-template-columns: 1fr;
.stat-cards
  width 100% !important
.stat-tab
  border-radius 10px
  min-height 120px
  background: white;
  border 1px solid #E9E8E8
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  display flex
  flex-direction column
  justify-content center
  align-items center
.IHR_global_stats
  text-decoration none;
  display flex;
  justify-content center;
  align-items center;
  flex-direction column;
.IHR_charts-body
  margin-top 10pt
  margin-right 10pt
  border-radius 20px
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
.IHR_charts-title
  width 100%
  margin-top 10px
.graph-header
  display flex
  justify-content flex-start
  align-items center
  flex-direction row !important
  width 100%
.graph-header-div
  display flex
  justify-content space-between
  align-items center
  width 100%
  font-size 18pt
.filter-div
  max-width 300px !important
.toggle-arrow
  padding 0px 0px 0px 16px
@media screen and (max-width: 650px)
  .graph-header-div
    flex-direction column
    justify-content center
    align-items flex-start
  .filter-div
    margin-top 5px
[dir=ltr] .q-item__section--side
  padding-right: 0;
  padding-left: 16px;
.IHR_
  &subtitle_calendar
      position relative
      top -5px
      left 5px

  &sidebar-filter-section-global
    & label
      margin 0pt 4pt
      font-weight 600

  &presets-name
    font-weight 500
    &-vertical
        font-size 18pt
        width 100%
        text-align center
        margin 8pt 0
        border-top rgb(164, 171, 171, 90) solid 2px
        transition font-weight 0.2s;

        &:last-of-type
          border-bottom rgb(164, 171, 171, 90) solid 2px

        &:hover
          font-weight 600

        & > span
          color $accent
          display inline-block
          padding 14px 0px
          transform rotate(-90deg)
          /*
          text-orientation upright
          letter-spacing -7px
          */
          cursor pointer
</style>