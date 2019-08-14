<template>
  <div class="IHR_chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      @plotly-click="showTable"
      ref="chart"
    />
    <h2 v-if="details.tableVisible">
      {{details.date | ihrUtcString}}
    </h2>
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
    <div v-if="details.tableVisible" class>
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
        <q-tab name="dependency" :label="$t('charts.asInterdependencies.table.dependencyTitle')" />
        <q-tab name="dependent" :label="$t('charts.asInterdependencies.table.dependentTitle')" />
        <q-tab name="bgpPlay" label="BGP play" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="dependency">
          <as-interdependencies-table
            :data="networkDependencyData"
            :loading="details.tablesData.dependency.loading"
          />
        </q-tab-panel>
        <q-tab-panel name="dependent">
          <as-interdependencies-table
            :data="dependentNetworksData"
            use-origin-asn
            :loading="details.tablesData.dependent.loading"
          />
        </q-tab-panel>
        <q-tab-panel name="bgpPlay">
          <bgplay :as-number="asNumber" :date-time="details.date" />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <table>
            <tr>
              <td><label for="hagemony">Hagemony</label></td>
              <td><a :href="hegemonyUrl" target="_blank" id="hagemony">{{hegemonyUrl}}</a></td>
            </tr>
            <tr>
              <td><label for="hagemonyCone">Hagemony cone</label></td>
              <td><a :href="hegemonyConeUrl" target="_blank" id="hagemonyCone">{{hegemonyConeUrl}}</a></td>
            </tr>
            <tr>
              <td><label for="tableUrl">{{$t("charts.asInterdependencies.table.dependencyTitle")}}</label></td>
              <td><a :href="dependencyUrl" target="_blank" id="tableUrl">{{dependencyUrl}}</a></td>
            </tr>
            <tr>
              <td><label for="tableUrl">{{$t("charts.asInterdependencies.table.dependentTitle")}}</label></td>
              <td><a :href="dependentUrl" target="_blank" id="tableUrl">{{dependentUrl}}</a></td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<script>
import CommonChartMixin, {DEFAULT_DEBOUNCE} from "./CommonChartMixin"
import { debounce } from "quasar";
import AsInterdependenciesTable from "./tables/AsInterdependenciesTable";
import Bgplay from "@/components/ripe/Bgplay";

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

export default {
  mixins: [CommonChartMixin],
  components: {
    AsInterdependenciesTable,
    Bgplay
  },
  props: {
    asNumber: {
      type: Number,
      required: true
    },
    asFamily: {
      type: Number,
      default: AS_FAMILY.v4
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
        activeTab: "dependency",
        date: null,
        tablesData: {
          dependency: null,
          dependent: null
        },
        tableVisible: false,
        enableBgpPlay: false,
      },
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingHegemony: true,
      loadingHegemonyCone: true,
      hegemonyFilter: hegemonyFilter,
      hegemonyConeFilter: hegemonyConeFilter,
      filters: [hegemonyFilter, hegemonyConeFilter],
      traces: [],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: `AS${this.asNumber} ${this.$t('charts.asInterdependencies.yaxis')}`,
          domain: [0.55, 1],
          range: [0, 1.1],
          automargin: true
        },
        yaxis2: {
          title:
            this.$t('charts.asInterdependencies.yaxis2') + this.asNumber,
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
  methods: {
    showTable(clickData) {
      let plot = clickData.points[0];
      this.details.date = new Date(plot.x + "+00:00")//adding timezone to string...
      let intervalEnd = this.details.date;
      //getting the previus point closest to x
      let xIndex = plot.pointIndex - 1;
      let endTime = intervalEnd.getTime();
      while (xIndex >= 0 && Date.parse(plot.data.x[xIndex]) == endTime) {
        xIndex--;
      }
      let intervalStart = xIndex < 0 ? intervalEnd : new Date(plot.data.x[xIndex]);

      let dependencyFilter = this.hegemonyFilter.clone().timeInterval(intervalStart, intervalEnd);
      let dependentFilter = dependencyFilter.clone().originAs().asNumber(this.asNumber);
      this.updateTable("dependency", "originasn", dependencyFilter, intervalStart, intervalEnd);
      this.updateTable("dependent", "asn", dependentFilter, intervalStart, intervalEnd);
    },
    updateTable(tableType, haegemonyComparator, filter, intervalStart, intervalEnd) {
      this.details.tablesData[tableType] = {
        data: [],
        loading: true,
        filter: filter
      };

      this.$ihr_api.hegemony(
        filter,
        results => {
          if (intervalStart != intervalEnd) {
            let startString = intervalStart.toISOString().replace(".000", "");
            let data = {};
            let res = [];
            results.results.forEach(elem => {
              let asn = elem[haegemonyComparator];
              if (elem.timebin == startString) {
                data[asn] = elem.hege;
              } else if (data[asn] != undefined) {
                elem.increment = elem.hege - data[asn];
                res.push(elem);
              }
            });
            results.results = res;
          }

          this.details.tablesData[tableType].data = results.results;
          this.details.tableVisible = true;
          this.details.tablesData[tableType].loading = false;
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
              this.$options.filters.ihr_getAsOrIxp(resp.asn) +
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
      for(let i = 1; i < trace.length; i++) {
        let a = new Date(trace[i-1].x);
        let b = new Date(trace[i].x);
        if(isNaN(a) || isNaN(b) || b-a < 0) {
          console.log("error", a, b, b-a)
        }
      }
      this.layout.datarevision = new Date().getTime();
    }
  },
  computed: {
    networkDependencyData() {
      return this.details.tablesData.dependency.data.filter((elem)=>{
        return elem.asn != this.asNumber;
      });
    },
    dependentNetworksData() {
      return this.details.tablesData.dependent.data.filter((elem)=>{
        return elem.originasn != this.asNumber;
      });
    },
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter);
    },
    hegemonyConeUrl() {
      return this.$ihr_api.getUrl(this.hegemonyConeFilter);
    },
    dependencyUrl() {
      return this.$ihr_api.getUrl(this.details.tablesData.dependency.filter);
    },
    dependentUrl() {
      return this.$ihr_api.getUrl(this.details.tablesData.dependent.filter);
    },
  },
  watch: {
    asFamily(oldValue, newValue) {
      this.filters.forEach((filter) => {
        filter.asFamily(newValue);
      });
      this.debouncedApiCall();
    }
  }
};
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";

</style>
