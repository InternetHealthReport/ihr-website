<template>
  <div class="IHR_chart">
    <div class="row justify-center" v-if="searchBar">
      <div class="col-4 q-pa-sm">
        <location-search-bar
          @select="addStartLocation"
          :hint="$t('searchBar.locationSource')"
          :label="$t('searchBar.locationHint')"
          :selected="startPointNameStr"
        />
      </div>
      <div class="col-4 q-pa-sm">
        <location-search-bar @select="addEndLocation" :hint="$t('searchBar.locationDestination')" :label="$t('searchBar.locationHint')" />
      </div>
      <div class="col-3 q-pa-sm">
        <q-btn @click="debouncedApiCall" color="secondary" class="q-ml-sm">Add</q-btn>
        <q-btn @click="clearGraph" class="q-ml-sm">Clear all</q-btn>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <reactive-chart :layout="layout" :traces="traces" @plotly-click="showTable" :ref="myId" :no-data="noData" :yMax="yMax" />
      </div>
    </div>
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div>
      <q-card v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
        <q-card-section class="q-pa-xs">
          <div class="row items-center">
            <div class="col">
              <div class="text-h3">
                {{ details.delayData.dateTime | ihrUtcString }}
              </div>
            </div>
            <div class="col-auto">
              <q-btn
                class="IHR_table-close-button"
                size="sm"
                round
                flat
                @click="details.tableVisible = false"
                icon="fa fa-times-circle"
              ></q-btn>
            </div>
          </div>
        </q-card-section>
        <q-tabs
          v-model="details.activeTab"
          dense
          class="text-grey inset-shadow"
          active-color="primary"
          active-bg-color="white"
          indicator-color="secondary"
          align="justify"
          narrow-indicator
        >
          <q-tab name="delay" :label="$t('charts.networkDelay.table.title')" />
          <q-tab name="api" label="API" />
        </q-tabs>
        <q-tab-panels v-model="details.activeTab" animated>
          <q-tab-panel name="delay">
            <network-delay-table
              :start-time="startTime"
              :stop-time="endTime"
              :data="details.delayData.data"
              :loading="details.delayData.loading"
              show-start
              @prefix-details="$emit('prefix-details', $event)"
            />
          </q-tab-panel>
          <q-tab-panel name="api" class="IHR_api-table">
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
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </div>
</template>

<script>
import LocationSearchBar from '@/components/search_bar/LocationSearchBar'
import CommonChartMixin from './CommonChartMixin'
import NetworkDelayTable from './tables/NetworkDelayTable'
import { NetworkDelayQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { NET_DELAY_LAYOUT } from './layouts'

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

export default {
  mixins: [CommonChartMixin],
  components: { LocationSearchBar, NetworkDelayTable },
  props: {
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
  },
  data() {
    var layout = NET_DELAY_LAYOUT
    return {
      details: {
        activeTab: 'delay',
        delayData: {},
        tableVisible: false,
        loading: true,
        filter: '',
      },
      apiFilter: null,
      openClose: true,
      traces: [],
      layout: layout,
      selectedStart: '',
      selectedEnd: '',
      endPointKeysFilter: this.endPointNames,
      startPointNameFilter: this.startPointName,
      startPointTypeFilter: this.startPointType,
      startPointKeysFilter: this.startPointNames,
    }
  },
  methods: {
    setFilter() {
      if (this.startPointName == '') {
        this.apiFilter = new NetworkDelayQuery()
          .startPointKey(this.startPointKeysFilter)
          .endPointKey(this.endPointKeysFilter)
          .timeInterval(this.startTime, this.endTime)
          .orderByEndPointName()
          .orderedByTime()
      } else {
        this.apiFilter = new NetworkDelayQuery()
          .startPointName(this.startPointNameFilter)
          .startPointType(this.startPointTypeFilter)
          .endPointKey(this.endPointKeysFilter)
          .timeInterval(this.startTime, this.endTime)
          .orderByEndPointName()
          .orderedByTime()
      }
    },
    apiCall() {
      this.loadingDelay = true
      this.setFilter()
      this.loading = true
      this.$ihr_api.network_delay(
        this.apiFilter,
        result => {
          this.$nextTick(function () {
            this.fetchNetworkDelay(result.results)
          })
        },
        error => {
          console.error(error) //FIXME do a correct alert
          this.loading = false
        }
      )
    },
    addStartLocation(loc) {
      this.startPointTypeFilter = loc.type
      this.startPointNameFilter = loc.name
    },
    addEndLocation(loc) {
      this.endPointKeysFilter = [loc.type + this.asFamily + loc.name]
    },
    clearGraph() {
      this.traces = []
      this.layout.datarevision = new Date().getTime()
    },
    showTable(clickData) {
      if (this.noTable) return
      let chosenTime = Date.parse(clickData.points[0].x + ' GMT') //adding timezone to string...
      this.details.activeTab = 'delay'
      this.details.filter = this.apiFilter.clone()

      this.details.delayData = {
        dateTime: chosenTime,
        startTime: new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
        stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
        data: [],
        loading: true,
      }

      this.$ihr_api.network_delay(
        this.details.filter.timeBin(chosenTime),
        results => {
          let data = []
          results.results.forEach(delay => {
            data.push(delay)
          })
          this.details.delayData.data = data
          this.details.tableVisible = true
          this.details.delayData.loading = false
          this.details.filter = this.apiFilter.clone()
        },
        error => {
          console.error(error) //TODO better error handling
        }
      )
    },
    fetchNetworkDelay(data) {
      let traces = {}
      let maxValue = 0
      let timeResolution = 1800 * 1000
      let groups = []
      data.forEach(elem => {
        let key = elem.startpoint_type
        key += elem.startpoint_af
        key += elem.startpoint_name
        key += elem.endpoint_type
        key += elem.endpoint_af
        key += elem.endpoint_name
        elem.median = Math.abs(elem.median)
        let trace = traces[key]
        if (trace === undefined) {
          let startname = elem.startpoint_type + elem.startpoint_name
          if (elem.startpoint_type === 'CT') {
            startname = elem.startpoint_name.split(',')[0]
          }
          let endname = elem.endpoint_type + elem.endpoint_name

          if (elem.endpoint_type === 'CT') {
            endname = elem.endpoint_name.split(',')[0]
          }

          startname = this.prettyName(startname)
          endname = this.prettyName(endname)

          trace = {
            x: [],
            y: [],
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

          // Group traces if needed
          if (this.group == 'start') {
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

          traces[key] = trace
        }

        maxValue = maxValue > elem.median ? maxValue : elem.median

        // Add null if there is missing data
        let prevDate = Date.parse(trace.x.slice(-1)[0])
        let currDate = Date.parse(elem.timebin)
        if (currDate > prevDate + timeResolution + 1) {
          trace.y.push(null)
          trace.x.push(elem.timbin)
        }

        trace.y.push(elem.median)
        trace.x.push(elem.timebin)
      })
      // Sort traces by alphabetical order
      let keys = Object.keys(traces).sort()
      keys.forEach(key => this.traces.push(traces[key]))

      // emit max value
      this.$emit('max-value', maxValue)

      this.loading = false
      this.notifyDisplay(this.traces.length > 0)
      this.layout.datarevision = new Date().getTime()
    },
    notifyDisplay(displayed) {
      this.$emit('display', displayed)
    },
  },
  computed: {
    delayUrl() {
      return this.$ihr_api.getUrl(this.apiFilter)
    },
    startPointNameStr() {
      if (isNaN(this.startPointName)) {
        return this.startPointName
      } else {
        return this.startPointType.toString() + this.startPointName.toString()
      }
    },
  },
  watch: {
    startPointNames() {
      //reset filter
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    endPointNames() {
      //reset filter
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    startPointName() {
      //reset filter
      this.startPointNameFilter = this.startPointName
      this.startPointTypeFilter = this.startPointType
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    clear() {
      this.clearGraph()
      this.loading = true
    },
  },
}
</script>
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
</style>
