<template>
  <div class="IHR_chart">
    <reactive-chart :layout="layout" :traces="traces" @loaded="loading = false" @plotly-click="showTable" :ref="myId" :no-data="noData" />
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
        <q-tab name="delay" :label="$t('charts.delayAndForwarding.tables.delay.title')" />
        <q-tab name="forwarding" :label="$t('charts.delayAndForwarding.tables.forwarding.title')" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <div v-if="loading" class="IHR_loading-spinner">
        <q-spinner color="secondary" size="15em" />
      </div>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="delay">
          <delay-alarms-table
            :start-time="details.delayData.startTime"
            :stop-time="details.delayData.stopTime"
            :data="details.delayData.data"
            :loading="details.delayData.loading"
            @prefix-details="$emit('prefix-details', $event)"
          />
        </q-tab-panel>
        <q-tab-panel name="forwarding">
          <forwarding-alarms-table :data="details.forwardingData.data" :loading="details.forwardingData.loading" />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
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
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import { extend } from 'quasar'
import CommonChartMixin from './CommonChartMixin'
import DelayAlarmsTable from './tables/DelayAlarmsTable'
import ForwardingAlarmsTable from './tables/ForwardingAlarmsTable'
import { DELAY_AND_FORWARDING_LAYOUT } from './layouts'
import 'datejs'

import { ForwardingQuery, DelayQuery, DelayAlarmsQuery, ForwardingAlarmsQuery } from '@/plugins/IhrApi'

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

export default {
  mixins: [CommonChartMixin],
  components: {
    DelayAlarmsTable,
    ForwardingAlarmsTable,
  },
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
  },
  data() {
    let delayFilter = new DelayQuery().asNumber(this.asNumber).timeInterval(this.startTime, this.endTime).orderedByTime()

    let forwardingFilter = new ForwardingQuery().asNumber(this.asNumber).timeInterval(this.startTime, this.endTime).orderedByTime()

    return {
      details: {
        activeTab: 'delay',
        delayData: null,
        delayAlarmsFilter: new DelayAlarmsQuery().asNumber(this.asNumber),
        forwardingData: null,
        forwardingAlarmsFilter: new ForwardingAlarmsQuery().asNumber(this.asNumber),
        tableVisible: false,
      },
      loadingDelay: true,
      loadingForwarding: true,
      delayFilter: delayFilter,
      forwardingFilter: forwardingFilter,
      filters: [delayFilter, forwardingFilter],
      traces: [],
      layout: DELAY_AND_FORWARDING_LAYOUT,
    }
  },
  methods: {
    apiCall() {
      this.traces = extend(true, [], DEFAULT_TRACES)
      this.loadingDelay = true
      this.loadingForwarding = true
      this.queryForwardingAPI()
      this.queryDelayAPI()
    },
    showTable(clickData) {
      let chosenTime = Date.parse(clickData.points[0].x + ' GMT') //adding timezone to string...

      if (clickData.points[0].data.yaxis == 'y2') {
        this.details.activeTab = 'forwarding'
      } else {
        this.details.activeTab = 'delay'
      }

      this.details.delayData = {
        dateTime: chosenTime,
        startTime: new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
        stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
        data: [],
        loading: true,
      }

      this.details.forwardingData = {
        dateTime: chosenTime,
        data: [],
        loading: true,
      }

      this.$ihr_api.delay_alarms(
        this.details.delayAlarmsFilter.timeBin(chosenTime),
        results => {
          let data = []
          results.results.forEach(alarm => {
            data.some(elem => {
              return alarm.asn == elem.asn && alarm.link == elem.link && alarm.timebin == elem.timebin
            }) || data.push(alarm)
          })
          this.details.delayData.data = data
          this.details.tableVisible = true
          this.details.delayData.loading = false
          this.details.delayAlarmsFilter = this.details.delayAlarmsFilter.clone()
        },
        error => {
          console.error(error) //TODO better error handling
        }
      )

      this.$ihr_api.forwarding_alarms(
        this.details.forwardingAlarmsFilter.timeBin(chosenTime),
        results => {
          this.details.forwardingData.data = results.results
          this.details.tableVisible = true
          this.details.forwardingData.loading = false
          this.details.forwardingAlarmsFilter = this.details.forwardingAlarmsFilter.clone()
        },
        error => {
          console.error(error) //TODO better error handling
        }
      )
    },
    queryForwardingAPI() {
      this.loadingForwarding = true
      this.$ihr_api.forwarding(
        this.forwardingFilter,
        result => {
          this.fetchForwarding(result.results)
          this.loadingForwarding = false
          this.loading = this.loadingDelay || this.loadingForwarding
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    queryDelayAPI() {
      this.loadingDelay = true
      this.$ihr_api.delay(
        this.delayFilter,
        result => {
          this.fetchDelay(result.results)
          this.loadingDelay = false
          this.loading = this.loadingDelay || this.loadingForwarding
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    fetchData(trace, data) {
      data.forEach(resp => {
        trace.y.push(resp.magnitude)
        trace.x.push(resp.timebin)
      })
      if (trace.x.length == 0) this.noData = 'No data available for this network'
      else this.noData = null

      this.layout.datarevision = new Date().getTime()
    },
    fetchDelay(data) {
      console.log('fetchDelay')
      this.fetchData(this.traces[0], data)
    },
    fetchForwarding(data) {
      console.log('fetchForwarding')
      this.fetchData(this.traces[1], data)
    },
  },
  computed: {
    delayUrl() {
      return this.$ihr_api.getUrl(this.delayFilter)
    },
    forwardingUrl() {
      return this.$ihr_api.getUrl(this.forwardingFilter)
    },
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.details.delayAlarmsFilter)
    },
    forwardingAlarmsUrl() {
      return this.$ihr_api.getUrl(this.details.forwardingAlarmsFilter)
    },
  },
  watch: {
    asNumber(newValue) {
      this.filters.forEach(filter => {
        filter.asNumber(newValue)
      })
      this.debouncedApiCall()
    },
  },
}
</script>

<style lang="stylus">
@import '~@/styles/charts/common.styl';
</style>
