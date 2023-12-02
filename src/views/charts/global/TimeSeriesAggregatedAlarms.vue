<template>
  <div class="IHR_chart">
    <div class="button-container">
      <button @click="onResetTime" type="button" :disabled="resetTimeButtonDisabled">Reset Time</button>
      <button @click="onShowAllCountries" type="button" :disabled="countryClicked === null">{{ showAllCountriesText
      }}</button>
    </div>
    <time-series-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
      @filter-alarms-by-time="onFilterAlarmsByTime" @timeseries-legend-clicked="onTimeseriesLegendClicked" />
  </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as TimeSeriesAggregatedAlarmsDataModel from '@/models/TimeSeriesAggregatedAlarmsDataModel'
import TimeSeriesAggregatedAlarmsReactive from './TimeSeriesAggregatedAlarmsReactive'
import { AGGREGATED_ALARMS_TIMESERIES_LAYOUT } from '../layouts'
export default {
  components: {
    TimeSeriesAggregatedAlarmsReactive,
  },
  emits: {
    'filter-alarms-by-time': function (newDateTimeFilter) {
      if (newDateTimeFilter) {
        return true;
      } else {
        return false;
      }
    },
  }, margin: { t: 50, b: 0, l: 0, r: 0 },
  height: 400,
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
    },
    timeFilters: {
      type: Object,
      required: true
    },
    alarms: {
      type: Array,
      required: false,
      default: () => []
    },
    countryClicked: {
      type: String,
      required: false,
      default: () => null
    },
    alarmTypeTitlesMap: {
      type: Object,
      required: false,
      default: () => { }
    },
    aggregatedAttrsZipped: {
      type: Array,
      required: false,
      default: () => []
    },
    isASGranularity: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  data() {
    const chart = {
      uuid: 'timeseries',
      traces: [],
      layout: {
        ...AGGREGATED_ALARMS_TIMESERIES_LAYOUT,
        title: TimeSeriesAggregatedAlarmsDataModel.getChartTitle([], [], null, null, false)
      }
    }
    return {
      chart: chart,
      timeSeriesTraces: [],
      timeFiltersCopied: this.timeFilters,
    }
  },
  computed: {
    startEndDateTimeFormatted() {
      const { startUnixTime, endUnixTime } = this.timeFilters
      let startDateFormatted = new Date(startUnixTime * 1000).toISOString().split('T')[0];
      let endDateFormatted = new Date(endUnixTime * 1000).toISOString().split('T')[0];
      startDateFormatted = TimeSeriesAggregatedAlarmsDataModel.formatDate(startDateFormatted)
      endDateFormatted = TimeSeriesAggregatedAlarmsDataModel.formatDate(endDateFormatted)
      return { startDateFormatted, endDateFormatted }
    },
    resetTimeButtonDisabled() {
      const { startUnixTime, endUnixTime } = this.timeFilters
      if ((this.timeFiltersCopied.startUnixTime == startUnixTime && this.timeFiltersCopied.endUnixTime == endUnixTime) || this.loadingVal) {
        return true
      } else {
        return false
      }
    },
    showAllCountriesText() {
      return this.isASGranularity ? 'Show All ASes' : 'Show All Countries'
    }
  },
  mounted() {
    const legendSelected = null; const countryClicked = null; const renderTimeSeries = true
    this.etl(this.alarms, this.aggregatedAttrsZipped, countryClicked, this.alarmTypeTitlesMap, legendSelected, this.isASGranularity, renderTimeSeries)
  },
  methods: {
    etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, legend, isASGranularity, renderTimeSeries, startEndDateTimeFormatted = this.startEndDateTimeFormatted) {
      if (!renderTimeSeries) return this.initTimeSeries(this.timeSeriesTraces, countryName, startEndDateTimeFormatted, legend, isASGranularity);
      this.timeSeriesTraces = TimeSeriesAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, legend, isASGranularity)
      return !this.timeSeriesTraces.length ? this.clearDataViz() : this.initTimeSeries(this.timeSeriesTraces, countryName, startEndDateTimeFormatted, legend, isASGranularity)
    },
    initTimeSeries(traces, countryName, startEndDateTimeFormatted, legendSelected, isASGranularity) {
      const chartTitle = TimeSeriesAggregatedAlarmsDataModel.getChartTitle(traces, countryName, startEndDateTimeFormatted, legendSelected, isASGranularity)
      AggregatedAlarmsUtils.resetChartZooming(this.chart)
      this.$set(this.chart, 'traces', traces)
      this.$set(this.chart.layout, 'title', chartTitle)
      this.$set(this.chart.layout, 'datarevision', new Date().getTime())
    },
    clearDataViz() {
      this.initTimeSeries([], null, this.startEndDateTimeFormatted, null, false)
    },
    onShowAllCountries() {
      this.$emit('reset-granularity')
    },
    onResetTime() {
      this.$emit('reset-time');
    },
    onFilterAlarmsByTime(newPlotlyDateTimeFilter) {
      this.$emit('filter-alarms-by-time', newPlotlyDateTimeFilter)
    },
    onTimeseriesLegendClicked(legend) {
      this.$emit('timeseries-legend-clicked', legend)
    }
  },
};
</script>

<style scoped>
.IHR_chart {
  height: 350px;
}

.button-container {
  margin: 0px 0px 15px 0px;
  display: flex;
  justify-content: space-between;
}

.button-container button {
  text-align: center;
  flex: 1;
}
</style>
