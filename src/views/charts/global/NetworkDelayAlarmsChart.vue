<template>
  <div class="IHR_chart">
    <div>
        <network-delay-alarms-table
        :start-time="startTime"
        :stop-time="endTime"
        :data="table.data"
        :loading="table.loading"
        :filter="filterValue"
          />
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import CommonChartMixin, { DEFAULT_DEBOUNCE } from "../CommonChartMixin";
import NetworkDelayAlarmsTable from "../tables/NetworkDelayAlarmsTable";
import { Query, NetworkDelayAlarmsQuery, AS_FAMILY } from "@/plugins/IhrApi";

const DEFAULT_MIN_DEVIATION = 10;
const DEFAULT_MIN_DIFFMEDIAN = 15;
const DEFAULT_AS_FAMILY = AS_FAMILY.v4;

export default {
  mixins: [CommonChartMixin],
  components: {
    NetworkDelayAlarmsTable
  },
  props: {
    minDeviation: {
      type: Number,
      default: DEFAULT_MIN_DEVIATION,
      required: true
    },
    selectedType: {
      type: String,
      default: "AS",
      required: false
    },
    filter:{ 
      type: String,
      default: ''
    }
  },
  data() {
    let networkDelayAlarmsFilter = new NetworkDelayAlarmsQuery()
      .deviation(this.minDeviation, Query.GTE)
      .startPointType(this.selectedType)
      .timeInterval(this.startTime, this.endTime);
      //TODO add IXPs

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.loading = true;
        this.queryNetworkDelayAlarmsAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      myId: `ihrNetworkDelayAlarmsChart${this._uid}`,
      table: {
        activeTab: "alarms",
        data: [],
        tableVisible: true,
        loading: true,
        selectedRow: []
      },
      plot: {
        startpoint_name: '',
        startpoint_type: '',
        endpoints: [],
        clear: 1
      },
      loading: true,
      delayFilter: null,
      debouncedApiCall: debouncedApiCall, 
      networkDelayAlarmsFilter: networkDelayAlarmsFilter,
      filters: [networkDelayAlarmsFilter],
    };
  },
  methods: {
    queryNetworkDelayAlarmsAPI() {
      this.loading = true;
      this.table.tableVisible = true;
      this.table.loading = true;
      this.$ihr_api.network_delay_alarms(
        this.networkDelayAlarmsFilter,
        result => {
          let data = [];
          let asn_list = [];
          result.results.forEach(alarm => {
            data.push(alarm);
          });
          this.table.data = data;
          this.table.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
  },
  computed: {
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.delayAlarmsFilter);
    },
    filterValue(){
        return this.filter
    }
  },
  watch: {
    minDeviation(newValue) {
      this.filters.forEach(filter => {
        filter.deviation(newValue, DelayQuery.GTE);
      });
      this.debouncedApiCall();
    },
  }
};

export {
  DEFAULT_MIN_DEVIATION,
  DEFAULT_AS_FAMILY
};
</script>

<style lang="stylus">
@import '~@/styles/charts/common.styl';
</style>
