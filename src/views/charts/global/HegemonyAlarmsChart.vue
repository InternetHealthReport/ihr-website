<template>
  <div class="IHR_chart">
    <as-interdependencies-chart
        :start-time="startTime"
        :end-time="endTime"
        :as-number="plot.originasn"
        :fetch="fetch"
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
        <q-tab name="alarms" :label="$t('charts.hegemonyAlarms.table.title')" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="table.activeTab" animated>
        <q-tab-panel name="alarms">
          <hegemony-alarms-table
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
                <label>{{$t('charts.hegemonyAlarms.table.title')}}</label>
              </td>
              <td>
                <a :href="hegemonyAlarmsUrl" target="_blank" id="hegemonyAlarms">{{hegemonyAlarmsUrl}}</a>
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
import HegemonyAlarmsTable from "../tables/HegemonyAlarmsTable";
import AsInterdependenciesChart from "@/views/charts/AsInterdependenciesChart";
import { Query, HegemonyAlarmsQuery, AS_FAMILY } from "@/plugins/IhrApi";
import { HEGEMONY_ALARMS_LAYOUT } from "../layouts";

const DEFAULT_MIN_DEVIATION = 10;
const DEFAULT_AS_FAMILY = AS_FAMILY.v4;

export default {
  mixins: [CommonChartMixin],
  components: {
    HegemonyAlarmsTable, AsInterdependenciesChart
  },
  props: {
    minDeviation: {
      type: Number,
      default: DEFAULT_MIN_DEVIATION,
      required: true
    },
  },
  data() {
    let hegemonyAlarmsFilter = new HegemonyAlarmsQuery()
      .deviation(this.minDeviation, Query.GTE)
      .timeInterval(this.startTime, this.endTime);

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.loading = true;
        this.queryHegemonyAlarmsAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      myId: `ihrHegemonyAlarmsChart${this._uid}`,
      table: {
        activeTab: "alarms",
        data: [],
        tableVisible: true,
        loading: true,
        selectedRow: []
      },
      plot: {
        originasn: 0,
        clear: 1
      },
      loading: true,
      delayFilter: null,
      debouncedApiCall: debouncedApiCall, 
      hegemonyAlarmsFilter: hegemonyAlarmsFilter,
      filters: [hegemonyAlarmsFilter],
      layout: HEGEMONY_ALARMS_LAYOUT
    };
  },
  methods: {
    queryHegemonyAlarmsAPI() {
      this.loading = true;
      this.table.tableVisible = true;
      this.table.loading = true;
      this.$ihr_api.hegemony_alarms(
        this.hegemonyAlarmsFilter,
        result => {
          let data = [];
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
        this.plot.originasn = newSelection[0].originasn;
    }
  },
  computed: {
    hegemonyAlarmsUrl() {
      return this.$ihr_api.getUrl(this.hegemonyAlarmsFilter);
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
        filter.originasn(newValue);
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
