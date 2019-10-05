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
        <q-item-section @click.stop v-if="startSearchBar">
          <network-edge-search-bar
            :class="['IHR_searchbar', openClose? 'IHR_showed-bar': 'IHR_hidden-bar']"
          />
        </q-item-section>
        <q-item-section>{{$t('charts.networkDelay.title')}}</q-item-section>
        <q-item-section @click.stop v-if="endSearchBar">
          <network-edge-search-bar
            :class="['IHR_searchbar', 'IHR_last', openClose? 'IHR_showed-bar': 'IHR_hidden-bar']"
          />
        </q-item-section>
      </template>

      <reactive-chart
        :layout="layout"
        :traces="traces"
        @loaded="loading = false"
        :ref="myId"
        :no-data="noData"
      />
      <div v-if="loading" class="IHR_loading-spinner">
        <q-spinner color="secondary" size="15em" />
      </div>
    </q-expansion-item>
  </div>
</template>

<script>
import { debounce } from "quasar";
import NetworkEdgeSearchBar from "@/components/search_bar/NetworkEdgeSearchBar";
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "./CommonChartMixin";
import { NetworkDelayQuery, NetworkDelayLocation, AS_FAMILY } from "@/plugins/IhrApi";
import { DISCO_LAYOUT } from "./layouts";

const DEFAULT_STARTPOINT = {
  NAME: "2914",
  TYPE: NetworkDelayQuery.EDGE_TYPE.AS
};

export default {
  mixins: [CommonChartMixin],
  components: { NetworkEdgeSearchBar },
  props: {
    startPoint: {
      type: Boolean,
      default: false
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
      default: false
    }
  },
  data() {
    let filter = new NetworkDelayQuery()
      .startPointName(DEFAULT_STARTPOINT.NAME)
      .startPointType(DEFAULT_STARTPOINT.TYPE)
      .endPointName(["Tokyo, Tokyo, JP", "New York City, New York, US", "174"])
      .endpointAf(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.queryNetworkDelayApi();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      openClose: true,
      debouncedApiCall: debouncedApiCall,
      filters: [filter],
      traces: [],
      layout: DISCO_LAYOUT
    };
  },
  created() {},
  methods: {
    queryNetworkDelayApi() {
      this.loading = true;
      this.$ihr_api.network_delay(
        this.filters[0],
        result => {
          this.fetchNewtworkDelay(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    stop(event) {
      console.log("stop", event);
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
          trace = {
            x: [],
            y: [],
            //name: `${elem.startpoint_type} ${elem.startpoint_name} ipv${elem.startpoint_af} => ${elem.endpoint_type} ${elem.endpoint_name} ipv${elem.endpoint_af}`
            name: `${elem.startpoint_type} ${elem.startpoint_name} => ${elem.endpoint_type} ${elem.endpoint_name}`
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