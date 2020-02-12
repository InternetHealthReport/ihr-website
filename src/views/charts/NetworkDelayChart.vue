<template>
  <div class="IHR_chart">
      <div class="row justify-center" v-if="searchBar">
          <div class="col-5 q-pa-sm">
            <location-search-bar
                @select="addStartLocation"
                :hint="$t('searchBar.locationSource')"
                :label="$t('searchBar.locationHint')"
                :selected="startPointNameStr()"
            />
          </div>
          <div class="col-5 q-pa-sm">
            <location-search-bar
                @select="addEndLocation"
                :hint="$t('searchBar.locationDestination')"
                :label="$t('searchBar.locationHint')"
            />
        </div>
          <div class="col-2 q-pa-sm">
            <q-btn @click='debouncedApiCall' color='secondary' class="q-ml-sm">Add</q-btn>
            <q-btn @click='clearGraph' class="q-ml-sm">Clear all</q-btn>
        </div>
      </div>
      <div class="row">
          <div class="col">
            <reactive-chart
                :layout="layout"
                :traces="traces"
                @plotly-click="showTable"
                :ref="myId"
                :no-data="noData"
            />
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
                  <div class="text-h3"> {{details.delayData.dateTime | ihrUtcString}} </div>
              </div>
              <div class="col-auto">
                <q-btn class="IHR_table-close-button" size="sm" round flat @click="details.tableVisible=false" icon="fa fa-times-circle"></q-btn>
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
                <label for="delay">{{$t('charts.delayAndForwarding.yaxis')}}</label>
              </td>
              <td>
                <a :href="delayUrl" target="_blank" id="delay">{{delayUrl}}</a>
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
import { debounce } from "quasar";
import LocationSearchBar from "@/components/search_bar/LocationSearchBar";
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "./CommonChartMixin";
import NetworkDelayTable from "./tables/NetworkDelayTable";
import { NetworkDelayQuery, NetworkDelayLocation, AS_FAMILY } from "@/plugins/IhrApi";
import { NET_DELAY_LAYOUT } from "./layouts";

const DELAY_ALARM_INTERVAL = 5 * 3600 * 1000; //5 minutes in milliseconds

export default {
  mixins: [CommonChartMixin],
  components: { LocationSearchBar, NetworkDelayTable },
  props: {
    startPointType: {
      type: String,
        default: () => ["AS"]
    },
    startPointName: {
      type: String,
        default: () => ["2497"]
    },
    endPointName: {
        type: Array,
        default: () => ["CT4Tokyo, Tokyo, JP", "CT4Singapore, Central Singapore, SG", "CT4Ashburn, Virginia, US", "CT4London, England, GB", "IP4", "AS415169", "AS425152"]
    },
    asFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
    searchBar: {
      type: Boolean,
      default: false
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
    return {
      details: {
        activeTab: "delay",
        delayData: {},
        tableVisible: false,
        loading: true,
        filter: ''
      },
      apiFilter: null,
      openClose: true,
      traces: [],
      layout: NET_DELAY_LAYOUT,
      selectedStart: '',
      selectedEnd: ''
    };
  },
  computed:{
    delayUrl() {
      return this.$ihr_api.getUrl(this.apiFilter);
    },
  },
  methods: {
    setFilter() { 
        this.apiFilter = new NetworkDelayQuery()
        .startPointName(this.startPointName)
        .startPointType(this.startPointType)
        .endPointKey(this.endPointName)
        .endpointAf(this.asFamily)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime();
    },
    apiCall() {
      this.traces = [];
      this.loadingDelay = true;
      this.setFilter()
      this.loading = true;
      this.$ihr_api.network_delay(
        this.apiFilter,
        result => {
            this.$nextTick(function () {
                this.fetchNetworkDelay(result.results);
            })
        },
        error => {
          console.error(error); //FIXME do a correct alert
          this.loading = false;
        }
      );
    },
    addStartLocation(loc) {
        this.apiFilter.startPointName(loc.name)
        this.apiFilter.startPointType(loc.type)
    },
    addEndLocation(loc) {
        this.apiFilter.endPointKey(loc.type+this.asFamily+loc.name)
    },
    clearGraph(){
        this.traces = []
        this.layout.datarevision = new Date().getTime();
    },
    showTable(clickData) {
      if(this.noTable) return;
      let chosenTime = new Date(clickData.points[0].x + "+00:00"); //adding timezone to string...
      this.details.activeTab = "delay"
      this.details.filter = this.apiFilter.clone()

      this.details.delayData = {
        dateTime: chosenTime,
        startTime:  new Date(chosenTime.getTime() - DELAY_ALARM_INTERVAL),
        stopTime: new Date(chosenTime.getTime() + DELAY_ALARM_INTERVAL),
        data: [],
        loading: true,
      };

      this.$ihr_api.network_delay(
        this.details.filter.timeBin(chosenTime),
        results => {
          let data = [];
          results.results.forEach(delay => {
            data.push(delay);
          });
          this.details.delayData.data = data;
          this.details.tableVisible = true;
          this.details.delayData.loading = false;
          this.details.filter = this.apiFilter.clone();
        },
        error => {
          console.error(error); //TODO better error handling
        }
      );

    },
    fetchNetworkDelay(data) {
      let trace = [];
      let traces = {};
      data.forEach(elem => {
        let key = elem.startpoint_type;
        key += elem.startpoint_af;
        key += elem.startpoint_name;
        key += elem.endpoint_type;
        key += elem.endpoint_af;
        key += elem.endpoint_name;

        let trace = traces[key];
        if (trace === undefined) {
            let startname = elem.startpoint_type+elem.startpoint_name
            if (elem.startpoint_type === 'CT'){
                startname = elem.startpoint_name.split(',')[0]
            }
            let endname = elem.endpoint_type+elem.endpoint_name
        
            if (elem.endpoint_type === 'CT'){
                endname = elem.endpoint_name.split(',')[0]
            }
            let nbtracks = elem.nbtracks;
          
          trace = {
            x: [],
            y: [],
            //name: `${elem.startpoint_type} ${elem.startpoint_name} ipv${elem.startpoint_af} => ${elem.endpoint_type} ${elem.endpoint_name} ipv${elem.endpoint_af}`
            name: `${startname} to ${endname}`,
            hovertemplate:
              "<b>" +
              startname+" to "+endname +
              "</b><br><br>" +
              "%{x}<br>"+
              "%{yaxis.title.text}: <b>%{y:.2f}</b>"+
              "<extra></extra>"
          };
          traces[key] = trace;
          this.traces.push(trace);
        }

        trace.y.push(elem.median);
        trace.x.push(elem.timebin);
      });
        this.loading = false;
        this.layout.datarevision = new Date().getTime();
    },
    startPointNameStr(){
        if(isNaN(this.startPointName)){
            return this.startPointName;
        }
        else{
            return this.startPointType.toString()+this.startPointName.toString()
        }
    }
  },
  watch: { 
    startPointName(newValue){
        this.queryNetworkDelayApi();
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
