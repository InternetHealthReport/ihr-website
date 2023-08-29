<template>
    <div class="IHR_chart">
        <time-series-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
            @filter-alarms-by-time="filterAlarmsByTimeHandler" />
    </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as TimeSeriesAggregatedAlarmsDataModel from '@/models/TimeSeriesAggregatedAlarmsDataModel'
import TimeSeriesAggregatedAlarmsReactive from './TimeSeriesAggregatedAlarmsReactive'

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
  },
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
    }
  },
  data() {
    const chart = {
      uuid: 'timeseries',
      traces: [],
      layout: {
        margin: { t: 50, b: 65, l: 40, r: 0 },
        title: 'Alarms for all Countries over Time',
        xaxis: {
          title: 'Date',
        },
        yaxis: {
          title: 'Number of Alarms',
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
          x: 1,
          xanchor: 'top',
          y: 1
        },
        height: 400
      }
    }

    return {
      chart: chart
    }
  },
  methods: {
    filterAlarmsByTimeHandler(newPlotlyDateTimeFilter) {
      newPlotlyDateTimeFilter.startDateTime += 'Z'
      newPlotlyDateTimeFilter.endDateTime += 'Z'
      this.$emit('filter-alarms-by-time', newPlotlyDateTimeFilter)
    },
    etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap) {
      const alarmsCopied = AggregatedAlarmsUtils.deepCopy(alarms)
      const timeSeriesTraces = TimeSeriesAggregatedAlarmsDataModel.etl(alarmsCopied, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap)
      const areTimeSeriesTracesEmpty = !timeSeriesTraces.length
      if (areTimeSeriesTracesEmpty) {
        this.clearDataViz()
      } else {
        const chartTitle = countryName ? `Alarms by ASNs over Time for ${countryName}` : 'Alarms for all Countries over Time'
        this.initTreeMap(timeSeriesTraces, chartTitle)
      }
    },
    clearDataViz() {
      this.initTreeMap([], 'Alarms for all Countries over Time')
    },
    initTreeMap(traces, chartTitle) {
      this.$set(this.chart, 'traces', traces)
      this.$set(this.chart.layout, 'title', chartTitle)
      this.zoomoutByDefault()
    },
    zoomoutByDefault() {
      Object.assign(this.chart.layout.xaxis, { autorange: true })
      Object.assign(this.chart.layout.yaxis, { autorange: true })
    },

  },
};
</script>

<style scoped>
.IHR_chart {
    height: 300px;
}
</style>
