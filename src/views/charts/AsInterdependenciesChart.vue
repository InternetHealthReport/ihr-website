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
    <q-card v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
        <q-card-section class="q-pa-xs">
          <div class="row items-center">
              <div class="col">
                  <div class="text-h3"> {{details.date | ihrUtcString}} </div>
              </div>
              <div class="col-auto">
                <q-btn class="IHR_table-close-button" size="sm" round flat @click="details.tableVisible=false" icon="fa fa-times-circle"></q-btn>
              </div>
          </div>
        </q-card-section>
      <q-tabs
        dense
        v-model="details.activeTab"
        class="table-card text-grey inset-shadow"
        indicator-color="secondary"
        active-color="primary"
        active-bg-color="white"
        align="justify"
        narrow-indicator
      >
        <q-tab name="dependency" :label="$t('charts.asInterdependencies.table.dependencyTitle')" />
        <q-tab name="dependent" :label="$t('charts.asInterdependencies.table.dependentTitle')" />
        <q-tab name="bgpPlay" label="AS Graph" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
      <div v-if="loading" class="IHR_loading-spinner">
        <q-spinner color="secondary" size="15em" />
      </div>
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
        <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{$t("charts.asInterdependencies.table.apiTitle")}}</h3>
          <table>
            <tr>
              <td><p class="text-subtitle1">{{$t("charts.asInterdependencies.table.dependencyTitle")}}</p></td>
              <td><a :href="dependencyUrl" target="_blank" id="tableUrl">{{dependencyUrl}}</a></td>
            </tr>
            <tr>
              <td><p class="text-subtitle1">{{$t("charts.asInterdependencies.table.dependentTitle")}}</p></td>
              <td><a :href="dependentUrl" target="_blank" id="tableUrl">{{dependentUrl}}</a></td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import CommonChartMixin, {DEFAULT_DEBOUNCE} from "./CommonChartMixin"
import { debounce, extend } from "quasar";
import AsInterdependenciesTable from "./tables/AsInterdependenciesTable";
import Bgplay from "@/components/ripe/Bgplay";
import { AS_INTERDEPENDENCIES_LAYOUT } from "./layouts"
import i18n from "@/locales/i18n";


import { HegemonyQuery, HegemonyConeQuery, AS_FAMILY } from "@/plugins/IhrApi";

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: "y2",
    name: i18n.t('charts.asInterdependencies.defaultTrace'),
    showlegend: false,
    hovertemplate:
        "%{x}<br>"+
        "%{yaxis.title.text}: <b>%{y:.2f}</b>"+
        "<extra></extra>"
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
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
    clear: {
      type: Number,
      default: 1
    },
    noTable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    //prevent calls within 500ms and execute only the last one
      let debouncedApiCall = debounce(
        () => {
            if(!this.fetch) return;
            this.loadBothPlots()
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
      loadingHegemony: true,
      loadingHegemonyCone: true,
      hegemonyFilter: null,
      hegemonyConeFilter: null,
      traces: DEFAULT_TRACE,
      layout: AS_INTERDEPENDENCIES_LAYOUT
    };
  },
  beforeMount() {
      this.updateAxesLabel()
  },
  methods: {
    updateAxesLabel(){
        this.layout.yaxis.title = `AS`+this.asNumber+` ${this.$t("charts.asInterdependencies.yaxis")}`;
        this.layout.yaxis2.title = `${this.$t("charts.asInterdependencies.yaxis2")} AS`+this.asNumber;
    },
    makeHegemonyFilter(){

        return new HegemonyQuery()
        .originAs(this.asNumber)
        .addressFamily(this.addressFamily)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime();
    },
    makeHegemonyConeFilter(){
        return new HegemonyConeQuery()
        .asNumber(this.asNumber)
        .addressFamily(this.addressFamily)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime();

    },
    loadBothPlots(){
        if(this.asNumber==0) return;
        this.updateAxesLabel()
        this.hegemonyFilter= this.makeHegemonyFilter()
        this.hegemonyConeFilter= this.makeHegemonyConeFilter()
        this.traces = extend(true, [], DEFAULT_TRACE);
        this.loading = true;
        this.loadingHegemony = true;
        this.loadingHegemonyCone = true;
        this.queryHegemonyAPI();
        this.queryHegemonyConeAPI();
    },
    showTable(clickData) {
      let plot = clickData.points[0];
      if(plot.x.length < 14){
        // at midnight no time is given
        this.details.date = new Date(plot.x+" 00:00+00:00")//adding timezone to string...
      }
      else{
        this.details.date = new Date(plot.x + "+00:00")//adding timezone to string...
      }
      let intervalEnd = this.details.date;
      //getting the previus point closest to x
      let xIndex = plot.pointIndex - 1;
      let endTime = intervalEnd.getTime();
      while (xIndex >= 0 && Date.parse(plot.data.x[xIndex]) == endTime) {
        xIndex--;
      }
      let intervalStart = xIndex < 0 ? intervalEnd : new Date(plot.data.x[xIndex]);
        console.log(intervalStart)
        console.log(intervalEnd)

      let dependencyFilter = this.hegemonyFilter.clone().timeInterval(intervalStart, intervalEnd);
      let dependentFilter = dependencyFilter.clone().originAs().asNumber(this.asNumber);
      this.updateTable("dependency", "asn", dependencyFilter, intervalStart, intervalEnd);
      this.updateTable("dependent", "originasn", dependentFilter, intervalStart, intervalEnd);
      if(plot.data.yaxis == "y2"){
        this.details.activeTab = "dependent";
      }
      else{
        this.details.activeTab = "dependency"
      }
    },
    updateTable(tableType, hegemonyComparator, filter, intervalStart, intervalEnd) {
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
              let asn = elem[hegemonyComparator];
              if (asn != 0){
                if (elem.timebin == startString) {
                    data[asn] = elem;
                } else {
                    if (data[asn] != undefined) {
                      elem.increment = 100*((elem.hege - data[asn].hege)/data[asn].hege);
                      res.push(elem);
                      delete data[asn];
                    } 
                    else{
                      elem.increment = 100;
                      res.push(elem);
                    }
                }
              }
            });

            for(var unprocessed in data){
                data[unprocessed].increment = -100;
                data[unprocessed].hege = 0;
                res.push(data[unprocessed]);
            }
            results.results = res;
          }

          this.details.tableVisible = true;
          this.details.tablesData[tableType] = {
            data: results.results,
            loading: false,
            filter: filter
          };
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
      data.forEach(elem => {
        if (elem.asn == this.asNumber) return;

        let trace = traces[elem.asn];
        if (trace === undefined) {
          trace = {
            x: [],
            y: [],
            name:
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              " " +
              elem.asn_name.split(" ")[0],
            hovertemplate:
              "<b>" +
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              " " +
              elem.asn_name.split(" ")[0]+
              "</b><br><br>" +
              "%{x}<br>"+
              "%{yaxis.title.text}: <b>%{y:.2f}</b>"+
              "<extra></extra>"
          };
          traces[elem.asn] = trace;
          this.traces.push(trace);
        }

        trace.y.push(elem.hege);
        trace.x.push(elem.timebin);
      });
      this.noData |= Object.keys(traces).length == 0;
      this.layout.datarevision = new Date().getTime();
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
          console.error("error", a, b, b-a)
        }
      }
      this.noData |= trace.length == 0;
      this.layout.datarevision = new Date().getTime();
    },
    clearGraph(){
        this.traces = []
        this.layout.datarevision = new Date().getTime();
    },
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
    addressFamily(newValue) {
      this.loadBothPlots();
    },
    asNumber(newValue) {
      this.loadBothPlots();
    },
    clear(newValue){
        this.clearGraph();
        this.$nextTick(function () {
            this.loading = true;
        })
    }
  }
};
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";

</style>
