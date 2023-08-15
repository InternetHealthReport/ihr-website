<template>
    <div class="IHR_chart">
        <time-series-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
            @filter-alarms-by-time="filterAlarmsByTimeHandler" />
    </div>
</template>
    
<script>
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
                title: 'Alarm Alarms by Countries, ASNs, and Time',
                xaxis: {
                    title: 'Date',
                },
                yaxis: {
                    title: 'Total Alarm Counts',
                },
                hovermode: 'closest',
                showlegend: true,
                legend: {
                    x: 1,
                    xanchor: 'top',
                    y: 1
                },
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
        etl(alarms, aggregatedAttrsZipped, countryName) {
            const timeSeriesTraces = TimeSeriesAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName)
            const areTimeSeriesTracesEmpty = !timeSeriesTraces.length
            if (areTimeSeriesTracesEmpty) {
                this.clearDataViz()
            } else {
                const chartTitle = countryName ? `Aggregated Alarms by ASNs, and Time for ${countryName}` : 'Alarm Alarms by Countries, ASNs, and Time'
                this.initTreeMap(timeSeriesTraces, chartTitle)
            }
        },
        clearDataViz() {
            this.initTreeMap([], 'Alarm Alarms by Countries, ASNs, and Time')
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

<style>
.IHR_chart {
    height: 380px;
}
</style>



