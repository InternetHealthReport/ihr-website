<template>
  <div class="IHR_chart">
    <network-delay-chart 
        :start-time="startTime" 
        :end-time="endTime" 
        :startPointName="plot.startpoint_name"
        :startPointType="plot.startpoint_type"
        :endPointName="plot.endpoints"
        :clear="plot.clear"
        noTable
    />

    <div>
      <q-tabs
        v-model="table.activeTab"
        dense
        class="text-grey inset-shadow"
        active-color="primary"
        active-bg-color="white"
        indicator-color="secondary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="alarms" :label="$t('charts.networkDelayAlarms.table.title')" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="table.activeTab" animated>
        <q-tab-panel name="alarms">
          <network-delay-alarms-table
            :start-time="startTime"
            :stop-time="endTime"
            :data="table.data"
            :loading="table.loading"
            @selectedRow='selectRow'
          />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <table>
            <tr>
              <td>
                <label>{{$t('charts.networkDelayAlarms.table.title')}}</label>
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
import NetworkDelayAlarmsTable from "../tables/NetworkDelayAlarmsTable";
import NetworkDelayChart from "@/views/charts/NetworkDelayChart";
import { Query, NetworkDelayAlarmsQuery, AS_FAMILY } from "@/plugins/IhrApi";
import { NET_DELAY_ALARMS_LAYOUT } from "../layouts";

const DEFAULT_MIN_DEVIATION = 10;
const DEFAULT_MIN_DIFFMEDIAN = 15;
const DEFAULT_AS_FAMILY = AS_FAMILY.v4;
const MAX_NETDELAY_PLOTS = 5;

export default {
  mixins: [CommonChartMixin],
  components: {
    NetworkDelayAlarmsTable, NetworkDelayChart
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
      layout: NET_DELAY_ALARMS_LAYOUT
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
    selectRow(newSelection){ 
        this.table.selectedRow = newSelection;
        this.plot.clear += 1;
        var val = newSelection[0];
        this.plot.endpoints = [];

        // Compute endpoints keys
        for(const key of Object.keys(val.endpoints)){
            var type = key.substring(0,2);
            var name = key.substring(2);
            var af = '4'; //TODO get this value from global settings
            this.plot.endpoints.push(type+af+name);
        }

        // Limit the number of values to display
        if(this.plot.endpoints.length>MAX_NETDELAY_PLOTS){ 
            this.plot.endpoints = this.plot.endpoints.slice(0, MAX_NETDELAY_PLOTS);
        }
            
        this.plot.startpoint_type = 'AS';
        this.plot.startpoint_name = String(val.asNumber);

    }
  },
  computed: {
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.delayAlarmsFilter);
    }
  },
  watch: {
    minDeviation(newValue) {
      this.filters.forEach(filter => {
        filter.deviation(newValue, DelayQuery.GTE);
      });
      this.debouncedApiCall();
    },
    selectedAsn(newValue) {
      this.filters.forEach(filter => {
        filter.asNumber(newValue);
      });
      this.debouncedApiCall();
    }
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
