<script setup>
import { QBtn, QCard, QCardSection, QTabs, QTab, QTabPanels, QTabPanel, QSpinner } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, inject, nextTick, computed, onMounted } from 'vue'
import { NetworkDelayQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { NET_DELAY_LAYOUT } from '@/plugins/layouts/layoutsChart'
import networkName from '@/plugins/networkName'
import NetworkDelayTable from '../tables/NetworkDelayTable.vue'

const ihr_api = inject('ihr_api')

const DELAY_ALARM_INTERVAL = 5 * 3600 * 1000 //5 minutes in milliseconds

const LINE_COLORS = [
  '#1f77b4', // muted blue
  '#ff7f0e', // safety orange
  '#2ca02c', // cooked asparagus green
  '#d62728', // brick red
  '#9467bd', // muted purple
  '#8c564b', // chestnut brown
  '#e377c2', // raspberry yogurt pink
  '#7f7f7f', // middle gray
  '#bcbd22', // curry yellow-green
  '#17becf', // blue-teal
]

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const props = defineProps({
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  startPointType: {
    type: String,
    default: () => '',
  },
  startPointName: {
    type: String,
    default: () => '',
  },
  startPointNames: {
    type: Array,
    default: () => [],
  },
  endPointNames: {
    type: Array,
    default: () => ['CT4Singapore, Central Singapore, SG', 'CT4Ashburn, Virginia, US', 'CT4London, England, GB', 'AS415169', 'AS425152'],
  },
  asFamily: {
    type: Number,
    default: AS_FAMILY.v4,
  },
  searchBar: {
    type: Boolean,
    default: false,
  },
  clear: {
    type: Number,
    default: 1,
  },
  noTable: {
    type: Boolean,
    default: false,
  },
  yMax: {
    type: Number,
    default: 1,
  },
  noYLabel: {
    type: Boolean,
    default: false,
  },
  group: {
    type: String,
    default: '',
  },
  fetch: {
    type: Boolean
  }
})

const emits = defineEmits({
  'prefix-details': (event) => {
    if (event !== null) {
      return true
    } else {
      console.warn('Event is missing!')
      return false
    }
  },
  'max-value': (newMaxY) => {
    if (newMaxY !== null) {
      return true;
    } else {
      console.warn('NewMaxY is missing!')
      return false
    }
  },
  'display': (isDisplayed) => {
    if (isDisplayed !== null) {
      return true;
    } else {
      console.warn('IsDisplayed is missing!')
      return false
    }
  }
})

const layout = ref(NET_DELAY_LAYOUT)
const details = ref({
  activeTab: 'delay',
  delayData: {},
  tableVisible: false,
  loading: true,
  filter: '',
})
const apiFilter = ref(null)
const openClose = ref(true)
const traces = ref([])
const selectedStart = ref('')
const selectedEnd = ref('')
const endPointKeysFilter = ref(props.endPointNames)
const startPointNameFilter = ref(props.startPointName)
const startPointTypeFilter = ref(props.startPointType)
const startPointKeysFilter = ref(props.startPointNames)
const loading = ref(false)
const noData = ref('')

const setFilter = () => {
  if (props.startPointName == '') {
    apiFilter.value = new NetworkDelayQuery()
      .startPointKey(startPointKeysFilter.value)
      .endPointKey(endPointKeysFilter.value)
      .timeInterval(props.startTime, props.endTime)
      .orderByEndPointName()
      .orderedByTime()
  } else {
    apiFilter.value = new NetworkDelayQuery()
      .startPointName(startPointNameFilter.value)
      .startPointType(startPointTypeFilter.value)
      .endPointKey(endPointKeysFilter.value)
      .timeInterval(props.startTime, props.endTime)
      .orderByEndPointName()
      .orderedByTime()
  }
}
const apiCall = () => {
  setFilter()
  loading.value = true
  ihr_api.network_delay(
    apiFilter.value,
    result => {
      nextTick(() => {
        fetchNetworkDelay(result.results)
        loading.value = false
      })
    },
    error => {
      console.error(error) //FIXME do a correct alert
      loading.value = false
    }
  )
}

const addStartLocation = (loc) => {
  startPointTypeFilter.value = loc.type
  startPointNameFilter.value = loc.name
}

const addEndLocation = (loc) => {
  endPointKeysFilter.value = [loc.type + props.asFamily + loc.name]
}

const clearGraph = () => {
  traces.value = []
  layout.value.datarevision = new Date().getTime()
}

const showTable = (clickData) => {
  if (props.noTable) {
    return
  }
  const chosenTime = new Date(clickData.points[0].x + ' GMT') //adding timezone to string...
  details.value.activeTab = 'delay'
  details.value.filter = apiFilter.value.clone()

  details.value.delayData = {
    dateTime: `${MONTHS_SHORT[chosenTime.getUTCMonth()]} ${chosenTime.getUTCDate()}, ${chosenTime.getUTCFullYear()}, ${chosenTime.getUTCHours()}:${chosenTime.getUTCMinutes()} UTC`,
    startTime: new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
    stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
    data: [],
    loading: true,
  }
  ihr_api.network_delay(
    details.value.filter.timeBin(chosenTime),
    results => {
      details.value.delayData.data = results.results
      details.value.tableVisible = true
      details.value.delayData.loading = false
      details.value.filter = apiFilter.value.clone()
    },
    error => {
      console.error(error) //TODO better error handling
    }
  )
}

const notifyDisplay = (displayed) => {
  emits('display', displayed)
}

const fetchNetworkDelay = (data) => {
  const localTraces = {}
  let maxValue = 0
  let timeResolution = 1800 * 1000
  const groups = []
  data.forEach(elem => {
    let key = elem.startpoint_type
    key += elem.startpoint_af
    key += elem.startpoint_name
    key += elem.endpoint_type
    key += elem.endpoint_af
    key += elem.endpoint_name
    elem.median = Math.abs(elem.median)
    let trace = localTraces[key]
    if (trace === undefined) {
      let startname = elem.startpoint_type + elem.startpoint_name
      if (elem.startpoint_type === 'CT') {
        startname = elem.startpoint_name.split(',')[0]
      }
      let endname = elem.endpoint_type + elem.endpoint_name

      if (elem.endpoint_type === 'CT') {
        endname = elem.endpoint_name.split(',')[0]
      }

      startname = networkName(startname)
      endname = networkName(endname)

      trace = {
        x: [],
        y: [],
        mode: 'lines',
        type: 'scatter',
        //name: `${elem.startpoint_type} ${elem.startpoint_name} ipv${elem.startpoint_af} => ${elem.endpoint_type} ${elem.endpoint_name} ipv${elem.endpoint_af}`
        name: `${startname} to ${endname}`,
        hovertemplate:
          '<b>' +
          startname +
          ' to ' +
          endname +
          '</b><br><br>' +
          '%{x}<br>' +
          '%{yaxis.title.text}: <b>%{y:.2f}</b>' +
          '<extra></extra>',
      }

      // Group localTraces if needed
      if (props.group == 'start') {
        let idx = groups.indexOf(startname)
        if (idx == -1) {
          groups.push(startname)
          idx = groups.length - 1
        } else {
          trace.showlegend = false
        }
        trace.name = startname
        trace.legendgroup = startname
        trace.line = { color: LINE_COLORS[idx] }
      }

      localTraces[key] = trace
    }

    maxValue = maxValue > elem.median ? maxValue : elem.median

    // Add null if there is missing data
    let prevDate = new Date(trace.x.slice(-1)[0]).getTime()
    let currDate = new Date(elem.timebin).getTime()
    if (currDate > prevDate + timeResolution + 1) {
      trace.y.push(null)
      trace.x.push(elem.timbin)
    }

    trace.y.push(elem.median)
    trace.x.push(elem.timebin)
  })
  // Sort traces by alphabetical order
  let keys = Object.keys(localTraces).sort()
  keys.forEach(key => traces.value.push(localTraces[key]))
  // emit max value
  emits('max-value', maxValue)
  if (keys.length == 0) {
    noData.value = 'No data available.'
  }

  loading.value = false
  notifyDisplay(traces.value.length > 0)
  layout.value.datarevision = new Date().getTime()
}

const isCovid = computed(() => {
  return window.location.href.includes('covid')
})
const delayUrl = computed(() => {
  return ihr_api.getUrl(apiFilter.value)
})
const startPointNameStr = computed(() => {
  if (isNaN(startPointNameFilter.value)) {
    return startPointNameFilter.value
  } else {
    return startPointTypeFilter.value.toString() + startPointNameFilter.value.toString()
  }
})

onMounted(() => {
  apiCall()
})
</script>

<template>
  <div class="IHR_chart">
    <div class="justify-center" v-if="searchBar">
      <div v-if="isCovid">
        <div class="q-pa-sm"
        >
          <!-- <location-search-bar
            @select="addStartLocation"
            :hint="$t('searchBar.locationSource')"
            :label="$t('searchBar.locationHint')"
            :selected="startPointNameStr"
            style="width: 65%;margin: auto; margin-bottom: -6px;"
            /> -->
        </div>
        <div class="q-pa-sm"
        >
          <!-- <location-search-bar
          @select="addEndLocation"
          :hint="$t('searchBar.locationDestination')"
          :label="$t('searchBar.locationHint')"
          :selected="startPointNameStr"
          style="width: 65%;margin: auto;margin-bottom: -6px;"
          /> -->
        </div>
        <div style="display: block;">
      <div class="col-3 q-pa-sm">
        <QBtn @click="debouncedApiCall" color="secondary" class="q-ml-sm">Add</QBtn>
        <QBtn @click="clearGraph" class="q-ml-sm">Clear all</QBtn>
      </div>
      </div>
      </div>
      <div v-else>
        <div class="row justify-center">
      <div class="col-4 q-pa-sm">
        <!-- <location-search-bar
          @select="addStartLocation"
          :hint="$t('searchBar.locationSource')"
          :label="$t('searchBar.locationHint')"
          :selected="startPointNameStr"
        /> -->
      </div>
      <div class="col-4 q-pa-sm">
        <!-- <location-search-bar @select="addEndLocation" :hint="$t('searchBar.locationDestination')" :label="$t('searchBar.locationHint')" /> -->
      </div>
      <div class="col-3 q-pa-sm">
        <QBtn @click="debouncedApiCall" color="secondary" class="btn">Add</QBtn>
        <QBtn @click="clearGraph" class="btn">Clear all</QBtn>
      </div>
      </div>
    </div>
    </div>
    <div class="row">
      <div class="col">
        <ReactiveChart :layout="layout" :traces="traces" @plotly-click="showTable" :no-data="noData" :yMax="yMax" />
      </div>
    </div>
    <div v-if="loading" class="IHR_loading-spinner">
      <QSpinner color="secondary" size="15em" />
    </div>
    <div>
      <QCard v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
        <QCardSection class="q-pa-xs">
          <div class="row items-center">
            <div class="col">
              <div class="text-h3">
                {{ details.delayData.dateTime }}
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
          <QTab name="delay" :label="$t('charts.networkDelay.table.title')" />
          <QTab name="api" label="API" />
        </QTabs>
        <QTabPanels v-model="details.activeTab" animated>
          <QTabPanel name="delay">
            <NetworkDelayTable
              :start-time="startTime"
              :stop-time="endTime"
              :data="details.delayData.data"
              :loading="details.delayData.loading"
              show-start
              @prefix-details="emits('prefix-details', $event)"
            />
          </QTabPanel>
          <QTabPanel name="api" class="IHR_api-table">
            <table>
              <tr>
                <td>
                  <label for="delay">{{ $t('charts.delayAndForwarding.yaxis') }}</label>
                </td>
                <td>
                  <a :href="delayUrl" target="_blank" id="delay">{{ delayUrl }}</a>
                </td>
              </tr>
            </table>
          </QTabPanel>
        </QTabPanels>
      </QCard>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.IHR_
  &charts-title
    overflow hidden
    ~/last
      right 50px
  &searchbar
    position absolute
    transition top .6s
  &showed-bar
    top 10px
    visibility visible
    opacity 1
  &hidden-bar
    top 60px
    opacity 0
  &loading-spinner
    & > *
      width 25%
      height 25%
.btn
    margin-bottom 10pt
    width 80pt
    margin-right 10pt
</style>