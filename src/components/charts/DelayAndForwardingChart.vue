<script setup>
import { QCard, QCardSection, QBtn, QTabs, QSpinner, QTabPanels, QTabPanel, extend } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ForwardingQuery, DelayQuery, DelayAlarmsQuery, ForwardingAlarmsQuery } from '@/plugins/IhrApi'
import { ref, inject, computed, watch, onMounted } from 'vue'
import { DELAY_AND_FORWARDING_LAYOUT } from '@/plugins/layouts/layoutsChart'
import DelayAlarmsTable from '../tables/DelayAlarmsTable.vue'
import ForwardingAlarmsTable from '../tables/ForwardingAlarmsTable.vue'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const DEFAULT_TRACES = [
  {
    x: [],
    y: [],
    yaxis: 'y',
    name: 'Delay',
    showlegend: false,
  },
  {
    x: [],
    y: [],
    yaxis: 'y2',
    name: 'Forwarding',
    showlegend: false,
  },
]
const DELAY_ALARM_INTERVAL = 5 * 3600 * 1000 //5 minutes in milliseconds

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']


const props = defineProps({
  asNumber: {
    type: Number,
    required: true,
  },
  startTime: {
    type: Object,
    required: true
  },
  endTime: {
    type: Object,
    required: true
  },
  fetch: {
    type: Boolean,
    required: true
  }
})

const emits = defineEmits({
  'prefix-details': (event) => {
    if (event !== null) {
      return true
    } else {
      console.warn('Event is missing!');
      return false
    }
  }
})

const details = ref({
  activeTab: 'delay',
  delayData: null,
  delayAlarmsFilter: new DelayAlarmsQuery().asNumber(props.asNumber),
  forwardingData: null,
  forwardingAlarmsFilter: new ForwardingAlarmsQuery().asNumber(props.asNumber),
  tableVisible: false,
})
const loadingDelay = ref(true)
const loadingForwarding = ref(true)
const delayFilter = ref(new DelayQuery().asNumber(props.asNumber).timeInterval(props.startTime, props.endTime).orderedByTime())
const forwardingFilter = ref(new ForwardingQuery().asNumber(props.asNumber).timeInterval(props.startTime, props.endTime).orderedByTime())
const filters = ref([delayFilter.value, forwardingFilter.value])
const traces = ref([])
const layout = ref(DELAY_AND_FORWARDING_LAYOUT)
const loading = ref(true)
const noData = ref('')

const apiCall = () => {
  traces.value = extend(true, [], DEFAULT_TRACES)
  loadingDelay.value = true
  loadingForwarding.value = true
  queryForwardingAPI()
  queryDelayAPI()
}

const showTable = (clickData) => {
  let chosenTime = new Date(clickData.points[0].x + ' GMT') //adding timezone to string...

  if (clickData.points[0].data.yaxis == 'y2') {
    details.value.activeTab = 'forwarding'
  } else {
    details.value.activeTab = 'delay'
  }

  details.value.delayData = {
    dateTime: chosenTime,
    startTime: new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
    stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
    data: [],
    loading: true,
  }

  details.value.forwardingData = {
    dateTime: chosenTime,
    data: [],
    loading: true,
  }

  ihr_api.delay_alarms(
    details.value.delayAlarmsFilter.timeBin(chosenTime),
    results => {
      let data = []
      results.results.forEach(alarm => {
        data.some(elem => {
          return alarm.asn == elem.asn && alarm.link == elem.link && alarm.timebin == elem.timebin
        }) || data.push(alarm)
      })
      details.value.delayData.data = data
      details.value.tableVisible = true
      details.value.delayData.loading = false
      details.value.delayAlarmsFilter = details.value.delayAlarmsFilter.clone()
    },
    error => {
      console.error(error) //TODO better error handling
    }
  )

  ihr_api.forwarding_alarms(
    details.value.forwardingAlarmsFilter.timeBin(chosenTime),
    results => {
      details.value.forwardingData.data = results.results
      details.value.tableVisible = true
      details.value.forwardingData.loading = false
      details.value.forwardingAlarmsFilter = details.value.forwardingAlarmsFilter.clone()
    },
    error => {
      console.error(error) //TODO better error handling
    }
  )
}

const queryForwardingAPI = () => {
  loadingForwarding.value = true
  ihr_api.forwarding(
    forwardingFilter.value,
    result => {
      fetchForwarding(result.results)
      loadingForwarding.value = false
      loading.value = loadingDelay.value || loadingForwarding.value
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const queryDelayAPI = () => {
  loadingDelay.value = true
  ihr_api.delay(
    delayFilter.value,
    result => {
      fetchDelay(result.results)
      loadingDelay.value = false
      loading.value = loadingDelay.value || loadingForwarding.value
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const fetchData = (trace, data) => {
  data.forEach(resp => {
    trace.y.push(resp.magnitude)
    trace.x.push(resp.timebin)
  })
  if (trace.x.length == 0) {
    noData.value = 'No data available for this network'
  } else {
    noData.value = ''
  }

  layout.value.datarevision = new Date().getTime()
}

const fetchDelay = (data) => {
  fetchData(traces.value[0], data)
}

const fetchForwarding = (data) => {
  fetchData(traces.value[1], data)
}

const getUTCFormat = (chosenTime) => {
  return `${MONTHS_SHORT[chosenTime.getUTCMonth()]} ${chosenTime.getUTCDate()}, ${chosenTime.getUTCFullYear()}, ${chosenTime.getUTCHours()}:${chosenTime.getUTCMinutes()} UTC`
}

const delayUrl = computed(() => {
  return ihr_api.getUrl(delayFilter.value)
})
const forwardingUrl = computed(() => {
  return ihr_api.getUrl(forwardingFilter.value)
})
const delayAlarmsUrl = computed(() => {
  return ihr_api.getUrl(details.value.delayAlarmsFilter)
})
const forwardingAlarmsUrl = computed(() => {
  return ihr_api.getUrl(details.value.forwardingAlarmsFilter)
})

watch(() => props.asNumber, () => {
  // filters.value.forEach(filter => {
  //   filter.asNumber(newValue)
  // })
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
    <ReactiveChart :layout="layout" :traces="traces" @loaded="loading" @plotly-click="showTable" :no-data="noData" />
    <QCard v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
      <QCardSection class="q-pa-xs">
        <div class="row items-center">
          <div class="col">
            <div class="text-h3">
              {{ getUTCFormat(details.delayData.dateTime) }}
            </div>
          </div>
          <div class="col-auto">
            <QBtn
              class="IHR_table-close-button"
              size="sm"
              round
              flat
              @click="details.tableVisible = false"
              icon="fa fa-times-circle"
            ></QBtn>
          </div>
        </div>
      </QCardSection>
      <QTabs
        v-model="details.activeTab"
        dense
        class="text-grey inset-shadow"
        active-color="primary"
        active-bg-color="white"
        indicator-color="secondary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="delay" :label="$t('charts.delayAndForwarding.tables.delay.title')" />
        <q-tab name="forwarding" :label="$t('charts.delayAndForwarding.tables.forwarding.title')" />
        <q-tab name="api" label="API" />
      </QTabs>
      <div v-if="loading" class="IHR_loading-spinner">
        <QSpinner color="secondary" size="15em" />
      </div>
      <QTabPanels v-model="details.activeTab" animated>
        <QTabPanel name="delay">
          <DelayAlarmsTable
            :start-time="details.delayData.startTime"
            :stop-time="details.delayData.stopTime"
            :data="details.delayData.data"
            :loading="details.delayData.loading"
            @prefix-details="emits('prefix-details', $event)"
          />
        </QTabPanel>
        <QTabPanel name="forwarding">
          <ForwardingAlarmsTable :data="details.forwardingData.data" :loading="details.forwardingData.loading" @prefix-details="emits('prefix-details', $event)" />
        </QTabPanel>
        <QTabPanel name="api" class="IHR_api-table">
          <h3>{{ $t('charts.delayAndForwarding.apiTitle') }}</h3>
          <table>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.delayAndForwarding.yaxis') }}
                </p>
              </td>
              <td>
                <a :href="delayUrl" target="_blank" id="delay">{{ delayUrl }}</a>
              </td>
            </tr>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.delayAndForwarding.yaxis2') }}
                </p>
              </td>
              <td>
                <a :href="forwardingUrl" target="_blank" id="forwarding">{{ forwardingUrl }}</a>
              </td>
            </tr>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.delayAndForwarding.tables.delay.title') }}
                </p>
              </td>
              <td>
                <a :href="delayAlarmsUrl" target="_blank" id="delayAlarms">{{ delayAlarmsUrl }}</a>
              </td>
            </tr>
            <tr>
              <td>
                <p class="text-subtitle1" name="forwardingAlarms">
                  {{ $t('charts.delayAndForwarding.tables.forwarding.title') }}
                </p>
              </td>
              <td>
                <a :href="forwardingAlarmsUrl" target="_blank" id="forwardingAlarms">{{ forwardingAlarmsUrl }}</a>
              </td>
            </tr>
          </table>
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus">
</style>