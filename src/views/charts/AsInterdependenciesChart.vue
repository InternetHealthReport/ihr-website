<template>
  <div class="IHR_interdependencies-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      @plotly-click="showTable"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
    <div v-if="details.tableData !== null">
      <q-tabs
        v-model="details.activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="table" :label="$t('charts.hegemonyTable')" />
        <q-tab name="bgpPlay" label="BGP play" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="table">
          <as-interdependencies-table
            :as-number="asNumber"
            :date-time="details.tableData.dateTime"
            :data="details.tableData.data"
            :loading="details.tableData.loading"
          />
        </q-tab-panel>
        <q-tab-panel name="bgpPlay">bgp Play</q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <table>
            <tr>
              <td><label name="hagemony">Hagemony</label></td>
              <td><a :href="hegemonyUrl" target="_blank" id="hagemony">{{hegemonyUrl}}</a></td>
            </tr>
            <tr>
              <td><label name="hagemonyCone">Hagemony cone</label></td>
              <td><a :href="hegemonyConeUrl" target="_blank" id="hagemonyCone">{{hegemonyConeUrl}}</a></td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import ReactiveChart from "@/components/ReactiveChart";
import DateTimePicker from "@/components/DateTimePicker";
import AsInterdependenciesTable from "./tables/AsInterdependenciesTable";

import { HegemonyQuery, HegemonyConeQuery, AS_FAMILY } from "@/plugins/IhrApi";

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: "y2",
    name: "Number of dependents",
    showlegend: false
  }
];

const DEFAULT_DEBOUNCE = 800;

export default {
  components: {
    ReactiveChart,
    DateTimePicker,
    AsInterdependenciesTable
  },
  props: {
    asNumber: {
      type: Number,
      required: true
    },
    asFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
    startTime: {
      type: Date,
      require: true
    },
    endTime: {
      type: Date,
      require: true
    },
    fetch: {
      type: Boolean
    }
  },
  data() {
    let hegemonyFilter = new HegemonyQuery()
      .originAs(this.asNumber)
      .asFamily(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    let hegemonyConeFilter = new HegemonyConeQuery()
      .asNumber(this.asNumber)
      .asFamily(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.traces = [...DEFAULT_TRACE];
        this.loading = true;
        this.loadingHegemony = true;
        this.loadingHegemonyCone = true;
        this.queryHegemonyAPI();
        this.queryHegemonyConeAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      details: {
        activeTab: "table",
        tableData: null,
        enableBgpPlay: false
      },
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingHegemony: true,
      loadingHegemonyCone: true,
      hegemonyFilter: hegemonyFilter,
      hegemonyConeFilter: hegemonyConeFilter,
      traces: [],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: `AS${this.asNumber} ${this.$t(
            "charts.tables.asInterdependencies.dependencies"
          )}`,
          domain: [0.55, 1],
          range: [0, 1.1],
          automargin: true
        },
        yaxis2: {
          title:
            this.$t("charts.tables.asInterdependencies.yaxis2") + this.asNumber,
          domain: [0, 0.45],
          autorange: true,
          automargin: true
        },
        margin: {
          t: 50,
          b: 50
        },
        showlegend: true,
        legend: {
          x: 0,
          y: 1.2,
          orientation: "h"
        }
      }
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    showTable(clickData) {
      let plot = clickData.points[0];

      this.enableBgpPlay = plot.yaxis._id == "y";
      let intervalEnd = new Date(plot.x + "+00:00"); //adding timezone to string...
      this.details.tableData = {
        dateTime: intervalEnd,
        data: [],
        loading: true
      };
      //getting the previus point closest to x
      let xIndex = plot.pointIndex - 1;
      let endTime = intervalEnd.getTime();
      while (xIndex >= 0 && Date.parse(plot.data.x[xIndex]) == endTime) {
        xIndex--;
      }
      //if first point select the query must get an exact point
      let intervalStart =
        xIndex < 0 ? intervalEnd : new Date(plot.data.x[xIndex]);
      let clickFilter = this.hegemonyFilter
        .clone()
        .timeInterval(intervalStart, intervalEnd);

      this.$ihr_api.hegemony(
        clickFilter,
        results => {
          console.log(results);
          if (intervalStart != intervalEnd) {
            let startString = intervalStart.toISOString().replace(".000", "");
            let data = {};
            let res = [];
            results.results.forEach(elem => {
              if (elem.timebin == startString) {
                data[elem.originasn] = elem.hege;
              } else if (data[elem.originasn] != undefined) {
                elem.increment = elem.hege - data[elem.originasn];
                res.push(elem);
              }
            });
            results.results = res;
          }
          console.log(results.results);
          this.details.tableData.data = results.results;
          this.details.tableData.loading = false;
        },
        error => {
          console.error(error); //TODO better error handling
        }
      );
    },
    queryHegemonyAPI() {
      this.loadingHegemony = true;
      this.$ihr_api.hegemony(
        this.hegemonyFilter,
        result => {
          this.fetchHegemony(result.results);
          this.loadingHegemony = false;
          this.loading = this.loadingHegemony || this.loadingHegemonyCone;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryHegemonyConeAPI() {
      this.loadingHegemonyCone = true;
      this.$ihr_api.hegemony_cone(
        this.hegemonyConeFilter,
        result => {
          this.fetchHegemonyCone(result.results);
          this.loadingHegemonyCone = false;
          this.loading = this.loadingHegemony || this.loadingHegemonyCone;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchHegemony(data) {
      console.log("fetchHegemony");
      let traces = {};
      data.forEach(resp => {
        if (resp.asn == this.asNumber) return;

        let trace;
        if (!(resp.asn in traces)) {
          trace = {
            x: [],
            y: [],
            name:
              this.$ihr_api.getAsOrIxp(resp.asn) +
              " " +
              resp.asn_name.split(" ")[0]
          };
          traces[resp.asn] = trace;
          this.traces.push(trace);
        } else {
          trace = traces[resp.asn];
        }

        trace.y.push(resp.hege);
        trace.x.push(resp.timebin);
      });
    },
    fetchHegemonyCone(data) {
      console.log("fetchHegemonyCone");
      let trace = this.traces[0];
      data.forEach(resp => {
        trace.y.push(resp.conesize);
        trace.x.push(resp.timebin);
      });
      this.layout.datarevision = new Date().getTime();
    }
  },
  watch: {
    startTime() {
      this.hegemonyFilter.startTime(this.startTime, HegemonyQuery.GTE);
      this.hegemonyConeFilter.startTime(this.startTime, HegemonyConeQuery.GTE);
      this.debouncedApiCall();
    },
    endTime() {
      this.hegemonyFilter.endTime(this.endTime, HegemonyQuery.LTE);
      this.hegemonyConeFilter.endTime(this.endTime, HegemonyConeQuery.LTE);
      this.debouncedApiCall();
    },
    fetch() {
      this.debouncedApiCall();
    }
  },
  computed: {
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter);
    },
    hegemonyConeUrl() {
      return this.$ihr_api.getUrl(this.hegemonyConeFilter);
    },
  }
};
</script>

<style lang="stylus">
.IHR_
  &interdependencies-chart
    text-align center
    position relative

    &h1
      font-size 25pt
      margin-bottom 0px
      font-weight 400
      line-height 1

  &loading-spinner
    position absolute
    top 50%
    left 49%

  &api-table
    & table
      display inline-block
      margin 0 auto
    & label
      text-align right
      display inline-block
      font-weight 600
      width 100%
</style>
