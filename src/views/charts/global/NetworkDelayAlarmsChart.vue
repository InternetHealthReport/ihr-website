<template>
  <div class="IHR_chart">
    <div>
      <network-delay-alarms-table
        :start-time="startTime"
        :stop-time="endTime"
        :data="table.data"
        :loading="loading"
        :filter="filterValue"
        @filteredRows="filteredRows"
      />
    </div>
  </div>
</template>

<script>
import CommonChartMixin from '../CommonChartMixin'
import NetworkDelayAlarmsTable from '../tables/NetworkDelayAlarmsTable'
import { Query, NetworkDelayAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'

const DEFAULT_MIN_DEVIATION = 10
const DEFAULT_AS_FAMILY = AS_FAMILY.v4

export default {
  mixins: [CommonChartMixin],
  components: {
    NetworkDelayAlarmsTable,
  },
  props: {
    minDeviation: {
      type: Number,
      default: DEFAULT_MIN_DEVIATION,
      required: true,
    },
    selectedType: {
      type: String,
      default: 'AS',
      required: false,
    },
  },
  data() {
    let networkDelayAlarmsFilter = new NetworkDelayAlarmsQuery()
      .deviation(this.minDeviation, Query.GTE)
      .startPointType(this.selectedType)
      .timeInterval(this.startTime, this.endTime)
    //TODO add IXPs

    return {
      myId: `ihrNetworkDelayAlarmsChart${this._uid}`,
      table: {
        activeTab: 'alarms',
        data: [],
        tableVisible: true,
        selectedRow: [],
      },
      plot: {
        startpoint_name: '',
        startpoint_type: '',
        endpoints: [],
        clear: 1,
      },
      loading: true,
      delayFilter: null,
      networkDelayAlarmsFilter: networkDelayAlarmsFilter,
      filters: [networkDelayAlarmsFilter],
    }
  },
  methods: {
    apiCall() {
      this.loading = true
      this.table.tableVisible = true
      this.$ihr_api.network_delay_alarms(
        this.networkDelayAlarmsFilter,
        result => {
          let data = []
          result.results.forEach(alarm => {
            data.push(alarm)
          })
          this.table.data = data
          this.loading = false
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
  },
  computed: {
    delayAlarmsUrl() {
      return this.$ihr_api.getUrl(this.delayAlarmsFilter)
    },
  },
  watch: {
    minDeviation(newValue) {
      this.filters.forEach(filter => {
        filter.deviation(newValue, NetworkDelayAlarmsQuery.GTE)
      })
      this.debouncedApiCall()
    },
  },
}

export { DEFAULT_MIN_DEVIATION, DEFAULT_AS_FAMILY }
</script>

<style lang="stylus">
@import '~@/styles/charts/common.styl';
</style>
