<template>
  <div class="IHR_network-chart">
    <q-expansion-item
      v-model="openClose"
      expand-separator
      header-class="IHR_charts-title"
      header-style="overflow: hidden"
      default-opened
    >
      <template v-slot:header>
        <q-item-section>{{$t('charts.networkDelay.title')}}</q-item-section>
      </template>

      <div class="row justify-center">
          <div class="col-5 q-pa-sm">
            <location-search-bar
                @select="addStartLocation"
                :hint="$t('searchBar.locationSource')"
                :label="$t('searchBar.locationHint')"
                :selected="startPointName"
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
            <q-btn @click='queryNetworkDelayApi' color='secondary' class="q-ml-sm">Add</q-btn>
            <q-btn @click='clearGraph' class="q-ml-sm">Clear all</q-btn>
        </div>
      </div>
      <div class="row">
          <div class="col">
            <reactive-chart
                :layout="layout"
                :traces="traces"
                @loaded="loading = false"
                :ref="myId"
                :no-data="noData"
            />
        </div>
      </div>
      <div v-if="loading" class="IHR_loading-spinner">
        <q-spinner color="secondary" size="15em" />
      </div>
    </q-expansion-item>
  </div>
</template>

<script>
import LocationSearchBar from "@/components/search_bar/LocationSearchBar";
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "./CommonChartMixin";
import { NetworkDelayQuery, NetworkDelayLocation, AS_FAMILY } from "@/plugins/IhrApi";
import { NET_DELAY_LAYOUT } from "./layouts";

export default {
  mixins: [CommonChartMixin],
  components: { LocationSearchBar },
  props: {
    startPointName: {
      type: String,
        default: () => ["2497"]
    },
    endPointName: {
        type: Array,
        default: () => ["Tokyo, Tokyo, JP", "Singapore, Central Singapore, SG", "Ashburn, Virginia, US", "London, England, GB"]
    },
    asFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
    startSearchBar: {
      type: Boolean,
      default: false
    },
    endSearchBar: {
      type: Boolean,
      default: true
    }
  },
  data() {
    let filter = new NetworkDelayQuery()
      .startPointName(this.startPointName)
      .endPointName(this.endPointName)
      .endpointAf(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    return {
      openClose: true,
      filter: filter,
      traces: [],
      layout: NET_DELAY_LAYOUT,
      selectedStart: '',
      selectedEnd: ''
    };
  },
  mounted() {
      if( this.startPointName != ""){
        this.queryNetworkDelayApi();
      }
  },
  methods: {
    queryNetworkDelayApi() {
      this.loading = true;
      this.$ihr_api.network_delay(
        this.filter,
        result => {
          this.fetchNewtworkDelay(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
          this.loading = false;
        }
      );
    },
    addStartLocation(loc) {
        this.filter.startPointName(loc.name)
    },
    addEndLocation(loc) {
        this.filter.endPointName(loc.name)
    },
    clearGraph(){
        this.traces = []
        this.layout.datarevision = new Date().getTime();
    },
    fetchNewtworkDelay(data) {
      console.log("fetchNewtworkDelay");
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
          
          trace = {
            x: [],
            y: [],
            //name: `${elem.startpoint_type} ${elem.startpoint_name} ipv${elem.startpoint_af} => ${elem.endpoint_type} ${elem.endpoint_name} ipv${elem.endpoint_af}`
            name: `${startname} to ${endname}`
          };
          traces[key] = trace;
          this.traces.push(trace);
        }

        trace.y.push(elem.median);
        trace.x.push(elem.timebin);
      });
      this.layout.datarevision = new Date().getTime();
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
