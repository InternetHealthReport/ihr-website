<template>
  <div class="IHR_chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      ref="chart"
    />
    <div>
      <q-tabs
        v-model="details.activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="delay" :label="$t('charts.delays.tables.title')" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="delay">
          <delay-alarms-table
            :start-time="startTime"
            :stop-time="endTime"
            :data="details.data"
            :loading="details.loading"
            @prefix-details="$emit('prefix-details', $event)"
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
                <label for="delayAlarms">{{$t('charts.delayAndForwarding.tables.delay.title')}}</label>
              </td>
              <td>
                <a :href="delayAlarmsUrl" target="_blank" id="delayAlarms">{{delayAlarmsUrl}}</a>
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
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "../CommonChartMixin";
import DelayAlarmsTable from "../tables/DelayAlarmsTable";
import { DelayQuery, DelayAlarmsQuery, AS_FAMILY } from "@/plugins/IhrApi";

const DEFAULT_MIN_NPROBES = 10;
const DEFAULT_MIN_DEVIATION = 150;
const DEFAULT_MIN_DIFFMEDIAN = 15;
const DEFAULT_MAX_DIFFMEDIAN = 300;
const DEFAULT_AS_FAMILY = AS_FAMILY.v4;

export default {
  mixins: [CommonChartMixin],
  components: {
    DelayAlarmsTable
  },
  props: {
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
    }
  },
  data() {
    let delayAlarmsFilter = new DelayAlarmsQuery()
      .numberOfProbes(this.minNprobes, DelayQuery.GTE)
      .deviation(this.minDeviation, DelayQuery.GTE)
      .medianDifference(this.minDiffmedian, DelayQuery.GTE)
      .medianDifference(this.maxDiffmedian, DelayQuery.LTE)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.traces = [];
        this.loading = true;
        this.loadingDelay = true;
        this.queryDelayAlarmsAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      details: {
        activeTab: "delay",
        data: [],
        tableVisible: false,
        loading: true
      },
      debouncedApiCall: debouncedApiCall,
      loading: true,
      delayFilter: null,
      delayAlarmsFilter: delayAlarmsFilter,
      filters: [delayAlarmsFilter],
      traces: [],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: this.$t("charts.delays.yaxis"),
          autorange: true,
          automargin: true
        },
        margin: {
          t: 50,
          b: 50
        },
        height: 350,
        showlegend: true,
        legend: {
          x: 0,
          y: 1.2,
          orientation: "h"
        }
      }
    };
  },
  methods: {
    queryDelayAlarmsAPI() {
      this.loading = true;
      this.details.tableVisible = true;
      this.details.loading = true;
      this.$ihr_api.delay_alarms(
        this.delayAlarmsFilter,
        result => {
          console.log("queryDelayAlarmsAPI", result)
          this.details.data = result.results;
          let asn_list = [];
          this.details.data.forEach(alarm => {
            if(!asn_list.some(asn => { return alarm.asn == asn })) {
              asn_list.push(alarm.asn);
            }
          })
          this.queryDelayAPI(asn_list);
          this.details.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryDelayAPI(asn_list) {
      if(asn_list.length == 0) {
        console.log("shure?")
        this.loading = false;
        return;
      }
      this.delayFilter = new DelayQuery()
        .asNumber(asn_list)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime();

      this.$ihr_api.delay(
        this.delayFilter,
        result => {
          this.fetchDelay(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchDelay(data) {
      let tracesMap = {};
      this.traces = [];
      data.forEach(elem => {
        let trace = tracesMap[elem.asn];
        if (trace === undefined) {
          trace = {
            x: [],
            y: [],
            name: this.$options.filters.ihr_getAsOrIxp(elem.asn),
          };
          this.traces.push(trace);
          tracesMap[elem.asn] = trace;
        }
        trace.x.push(elem.timebin);
        trace.y.push(elem.magnitude);
      });
      console.log(this.traces)
      this.layout.datarevision = new Date().getTime();
    }
  },
  computed: {
    delayUrl() {
      return this.$ihr_api.getUrl(this.delayFilter);
    },
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.delayAlarmsFilter);
    }
  }
};

export {
  DEFAULT_MIN_NPROBES,
  DEFAULT_MIN_DEVIATION,
  DEFAULT_MIN_DIFFMEDIAN,
  DEFAULT_MAX_DIFFMEDIAN,
  DEFAULT_AS_FAMILY
};
</script>

<style lang="stylus">
@import '~@/styles/charts/common.styl';
</style>
