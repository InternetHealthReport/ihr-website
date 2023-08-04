<template>
    <div class="IHR_chart">
        <time-series-aggregated-alarms-reactive :chart="chart" :loading="loadingVal" />
    </div>
</template>
    
<script>
import * as TimeSeriesAggregatedAlarmsDataModel from '@/models/TimeSeriesAggregatedAlarmsDataModel'
import TimeSeriesAggregatedAlarmsReactive from './TimeSeriesAggregatedAlarmsReactive'

export default {
    components: {
        TimeSeriesAggregatedAlarmsReactive,
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
            chart: chart,
        }
    },

    methods: {
        etl(alarms, aggregatedAttrsZipped, countryName) {
            const timeSeriesTraces = TimeSeriesAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName)
            const areTimeSeriesTracesEmpty = !timeSeriesTraces.length
            if (areTimeSeriesTracesEmpty) {
                this.clearDataViz()
            } else {
                const chartTitle = countryName ? `Aggregated Alarms by ASNs, and Time for ${countryName}` : 'Alarm Alarms by Countries, ASNs, and Time'
                this.$set(this.chart, 'traces', timeSeriesTraces)
                this.$set(this.chart.layout, 'title', chartTitle)
            }
        },
        clearDataViz() {
            this.$set(this.chart, 'traces', [])
            this.$set(this.chart.layout, 'title', 'Alarm Alarms by Countries, ASNs, and Time')
        },
    },
};
</script>

<style>
.IHR_chart {
    height: 380px;
}
</style>



