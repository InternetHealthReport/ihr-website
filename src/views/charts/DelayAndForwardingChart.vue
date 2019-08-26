<template>
  <div class="IHR_chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      @plotly-click="showTable"
      :ref="myId"
      :no-data="noData"
    />
    <h2 v-if="details.tableVisible">
      {{details.delayData.dateTime | ihrUtcString}}
    </h2>
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
    <div v-if="details.tableVisible">
      <span class="IHR_table-close-button" @click="details.tableVisible=false">x</span>
      <q-tabs
        v-model="details.activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="delay" :label="$t('charts.delayAndForwarding.tables.delay.title')" />
        <q-tab name="forwarding" :label="$t('charts.delayAndForwarding.tables.forwarding.title')" />
        <q-tab name="api" label="API" />
      </q-tabs>
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
          <forwarding-alarms-table
            :data="details.forwardingData.data"
            :loading="details.forwardingData.loading"
          />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <table>
            <tr>
              <td>
                <label for="delay">{{$t('charts.delayAndForwarding.yaxis')}}</label>
              </td>
              <td>
                <a :href="delayUrl" target="_blank" id="delay">{{delayUrl}}</a>
              </td>
            </tr>
            <tr>
              <td>
                <label for="forwarding">{{$t('charts.delayAndForwarding.yaxis2')}}</label>
              </td>
              <td>
                <a :href="forwardingUrl" target="_blank" id="forwarding">{{forwardingUrl}}</a>
              </td>
            </tr>
            <tr>
              <td>
                <label for="delayAlarms">{{$t('charts.delayAndForwarding.tables.delay.title')}}</label>
              </td>
              <td>
                <a :href="delayAlarmsUrl" target="_blank" id="delayAlarms">{{delayAlarmsUrl}}</a>
              </td>
            </tr>
            <tr>
              <td>
                <label
                  name="forwardingAlarms"
                >{{$t('charts.delayAndForwarding.tables.forwarding.title')}}</label>
              </td>
              <td>
                <a
                  :href="forwardingAlarmsUrl"
                  target="_blank"
                  id="forwardingAlarms"
                >{{forwardingAlarmsUrl}}</a>
              </td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import CommonChartMixin, {DEFAULT_DEBOUNCE} from "./CommonChartMixin"
import DelayAlarmsTable from "./tables/DelayAlarmsTable";
import ForwardingAlarmsTable from "./tables/ForwardingAlarmsTable";
import { DELAY_AND_FORWARDING_LAYOUT } from "./layouts"

import {
  ForwardingQuery,
  DelayQuery,
  DelayAlarmsQuery,
  ForwardingAlarmsQuery
} from "@/plugins/IhrApi";

const DEFAULT_TRACES = [
  {
    x: [],
    y: [],
    yaxis: "y",
    name: "Delay",
    showlegend: false
  },
  {
    x: [],
    y: [],
    yaxis: "y2",
    name: "Forwarding",
    showlegend: false
  }
];
const DELAY_ALARM_INTERVAL = 5 * 3600 * 1000; //5 minutes in milliseconds

export default {
  mixins: [CommonChartMixin],
  components: {
    DelayAlarmsTable,
    ForwardingAlarmsTable
  },
  props: {
    asNumber: {
      type: Number,
      required: true
    }
  },
  data() {
    let delayFilter = new DelayQuery()
      .asNumber(this.asNumber)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    let forwardingFilter = new ForwardingQuery()
      .asNumber(this.asNumber)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.traces = [...DEFAULT_TRACES];
        this.loading = true;
        this.loadingDelay = true;
        this.loadingForwarding = true;
        this.queryForwardingAPI();
        this.queryDelayAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      details: {
        activeTab: "delay",
        delayData: null,
        delayAlarmsFilter: new DelayAlarmsQuery().asNumber(this.asNumber),
        forwardingData: null,
        forwardingAlarmsFilter: new ForwardingAlarmsQuery().asNumber(
          this.asNumber
        ),
        tableVisible: false
      },
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingDelay: true,
      loadingForwarding: true,
      delayFilter: delayFilter,
      forwardingFilter: forwardingFilter,
      filters: [delayFilter, forwardingFilter],
      traces: [],
      layout: DELAY_AND_FORWARDING_LAYOUT
    };
  },
  methods: {
    showTable(clickData) {
      let chosenTime = new Date(clickData.points[0].x + "+00:00"); //adding timezone to string...

      this.details.delayData = {
        dateTime: chosenTime,
        startTime:  new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
        stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
        data: [],
        loading: true
      };

      this.details.forwardingData = {
        dateTime: chosenTime,
        data: [],
        loading: true
      };

      this.$ihr_api.delay_alarms(
        this.details.delayAlarmsFilter.timeBin(chosenTime),
        results => {
          let data = [];
          results.results.forEach(alarm => {
            data.some(elem => {
              return alarm.asn == elem.asn &&
                     alarm.link == elem.link &&
                     alarm.timebin == elem.timebin;
            }) || data.push(alarm);
          });
          this.details.delayData.data = data;
          this.details.tableVisible = true;
          this.details.delayData.loading = false;
          this.details.delayAlarmsFilter = this.details.delayAlarmsFilter.clone();
        },
        error => {
          console.error(error); //TODO better error handling
        }
      );

      this.$ihr_api.forwarding_alarms(
        this.details.forwardingAlarmsFilter.timeBin(chosenTime),
        results => {
          this.details.forwardingData.data = results.results;
          this.details.tableVisible = true;
          this.details.forwardingData.loading = false;
          this.details.forwardingAlarmsFilter = this.details.forwardingAlarmsFilter.clone();
        },
        error => {
          console.error(error); //TODO better error handling
        }
      );
    },
    queryForwardingAPI() {
      this.loadingForwarding = true;
      this.$ihr_api.forwarding(
        this.forwardingFilter,
        result => {
          this.fetchForwarding(result.results);
          this.loadingForwarding = false;
          this.loading = this.loadingDelay || this.loadingForwarding;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryDelayAPI() {
      this.loadingDelay = true;
      this.$ihr_api.delay(
        this.delayFilter,
        result => {
          this.fetchDelay(result.results);
          this.loadingDelay = false;
          this.loading = this.loadingDelay || this.loadingForwarding;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchData(trace, data) {
      data.forEach(resp => {
        trace.y.push(resp.magnitude);
        trace.x.push(resp.timebin);
      });
      this.layout.datarevision = new Date().getTime();
    },
    fetchDelay(data) {
      console.log("fetchDelay");
      this.fetchData(this.traces[0], data);
    },
    fetchForwarding(data) {
      console.log("fetchForwarding");
      this.fetchData(this.traces[1], data);
    }
  },
  computed: {
    delayUrl() {
      return this.$ihr_api.getUrl(this.delayFilter);
    },
    forwardingUrl() {
      return this.$ihr_api.getUrl(this.forwardingFilter);
    },
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.details.delayAlarmsFilter);
    },
    forwardingAlarmsUrl() {
      return this.$ihr_api.getUrl(this.details.forwardingAlarmsFilter);
    }
  },
  watch: {
    asNumber(newValue) {
      this.filters.forEach((filter) => {
        filter.asNumber(newValue);
      });
      this.debouncedApiCall();
    }
  }
};
</script>

<style lang="stylus">
@import '~@/styles/charts/common.styl';
</style>
