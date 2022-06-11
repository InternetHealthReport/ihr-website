<template>
    <div class="IHR_chart">
        <hegemony-alarms-table
            :start-time="startTime"
            :stop-time="endTime"
            :data="table.data"
            :loading="loading"
            :filter="filterValue"
            @filteredRows="filteredRows"
        />
    </div>
</template>

<script>
import CommonChartMixin from '../CommonChartMixin'
import HegemonyAlarmsTable from '../tables/HegemonyAlarmsTable'
import { Query, HegemonyAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { HEGEMONY_ALARMS_LAYOUT } from '../layouts'

const DEFAULT_MIN_DEVIATION = 10
const DEFAULT_AS_FAMILY = AS_FAMILY.v4

export default {
  mixins: [CommonChartMixin],
  components: {
    HegemonyAlarmsTable,
  },
  props: {
    minDeviation: {
      type: Number,
      default: DEFAULT_MIN_DEVIATION,
      required: true,
    },
  },
  data() {
    let hegemonyAlarmsFilter = new HegemonyAlarmsQuery()
      .deviation(this.minDeviation, Query.GTE)
      .timeInterval(this.startTime, this.endTime)

    return {
      myId: `ihrHegemonyAlarmsChart${this._uid}`,
      table: {
        activeTab: 'alarms',
        data: [],
        tableVisible: true,
        selectedRow: [],
      },
      loading: true,
      delayFilter: null,
      hegemonyAlarmsFilter: hegemonyAlarmsFilter,
      filters: [hegemonyAlarmsFilter],
      layout: HEGEMONY_ALARMS_LAYOUT,
    }
  },
  methods: {
    apiCall() {
      this.loading = true
      this.table.tableVisible = true
      this.$ihr_api.hegemony_alarms(
        this.hegemonyAlarmsFilter,
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
    hegemonyAlarmsUrl() {
      return this.$ihr_api.getUrl(this.hegemonyAlarmsFilter)
    },
  },
  watch: {
    minDeviation(newValue) {
      this.filters.forEach(filter => {
        filter.deviation(newValue, HegemonyAlarmsQuery.GTE)
      })
      this.debouncedApiCall()
    },
    selectedAsn(newValue) {
      this.filters.forEach(filter => {
        filter.originasn(newValue)
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
