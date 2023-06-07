<template>
    <div class="IHR_chart">
        <div>
            <button @click="resetTimeSeries">Reset</button>
            <aggregated-alarms-time-series-reactive :chart="chart" :loading="loading" />
        </div>

    </div>
</template>
    
<script>
import { COMMON_FEATURE } from '../layouts';
import CommonChartMixin from '../CommonChartMixin'
import AggregatedAlarmsTimeSeriesReactive from './AggregatedAlarmsTimeSeriesReactive.vue'

export default {
    mixins: [CommonChartMixin],
    components: {
        AggregatedAlarmsTimeSeriesReactive,
    },
    props: {
        aggregatedAlarms: {
            type: Array,
            required: true,
            default: () => []
        },
        countryClicked: {
            type: String,
            required: false,
        }
    },
    emits: {
        'time-series-reset': function () {
            return false
        },
    },
    data() {
        const chartLayout = {
            ...COMMON_FEATURE,
            title: 'Aggregated Alarm Counts across Countries over the Time',
            xaxis: {
                title: 'Date',
            },
            yaxis: {
                title: 'Total Alarm Counts',
            },
            hovermode: 'closest',
            showlegend: true,
            margin: { t: -10 }
        };
        const chart = {
            uuid: 'aggregatedAlarmsTimeSeries',
            traces: [],
            layout: chartLayout
        }

        return {
            chart: chart,
        }
    },

    mounted() {
        this.loading = true
        if (this.aggregatedAlarms.length) {
            let groupedAlarms, legendName;

            if (this.countryClicked) {
                groupedAlarms = this.aggregatedAlarms.filter(item => item.country_iso_code3 === this.countryClicked && item.asn_name)
                groupedAlarms = this.groupAlarmsByASNNumber(groupedAlarms)
                legendName = 'asn_name'
            } else {
                groupedAlarms = this.groupAlarmsByCountry(this.aggregatedAlarms)
                legendName = 'country_name'
            }

            this.processAlarmCategories(groupedAlarms)
            this.processAggregatedAlarm(groupedAlarms)
            const customHoverData = this.getCustomHoverData(groupedAlarms)
            this.drawChart(groupedAlarms, customHoverData, legendName);
            this.loading = false
        }
    },

    methods: {
        resetTimeSeries() {
            if (this.chart.traces.length) {
                this.untoggleLegend(this.chart.traces)
                this.$emit('time-series-reset')
            }
        },
        untoggleLegend(traces) {
            for (let i = 0; i < traces.length; i++) {
                if (i == 0) {
                    traces[i].visible = true
                    traces[i].hoverinfo = 'all'
                } else {
                    traces[i].visible = 'legendonly'
                    traces[i].hoverinfo = 'none'
                }
            }
        },
        groupAlarmsByCountry(alarms) {
            const alarmsByCountry = alarms.reduce((result, obj) => {
                const existingEntry = result.find(
                    entry =>
                        entry.country_iso_code2 === obj.country_iso_code2 &&
                        entry.country_iso_code3 === obj.country_iso_code3 &&
                        entry.country_name === obj.country_name
                );

                if (existingEntry) {
                    existingEntry.hegemony_alarm_counts = existingEntry.hegemony_alarm_counts.concat(obj.hegemony_alarm_counts)
                    existingEntry.network_delay_alarm_counts = existingEntry.network_delay_alarm_counts.concat(obj.network_delay_alarm_counts)
                    existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                    existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                    existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                    existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                    existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)
                    existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                    existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                    existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                } else {
                    result.push({
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                        hegemony_alarm_counts: obj.hegemony_alarm_counts,
                        network_delay_alarm_counts: obj.network_delay_alarm_counts,
                        defcon_alarm_counts: obj.defcon_alarm_counts,
                        edges_alarm_counts: obj.edges_alarm_counts,
                        moas_alarm_counts: obj.moas_alarm_counts,
                        submoas_alarm_counts: obj.submoas_alarm_counts,
                        hegemony_alarm_timebins: obj.hegemony_alarm_timebins,
                        network_delay_alarm_timebins: obj.network_delay_alarm_timebins,
                        defcon_alarm_timebins: obj.defcon_alarm_timebins,
                        edges_alarm_timebins: obj.edges_alarm_timebins,
                        moas_alarm_timebins: obj.moas_alarm_timebins,
                        submoas_alarm_timebins: obj.submoas_alarm_timebins,
                    });
                }

                return result;
            }, []);
            return alarmsByCountry
        },

        groupAlarmsByASNNumber(alarms) {
            const alarmsByCountry = alarms.reduce((result, obj) => {
                const existingEntry = result.find(entry => entry.asn === obj.asn);

                if (existingEntry) {
                    existingEntry.hegemony_alarm_counts = existingEntry.hegemony_alarm_counts.concat(obj.hegemony_alarm_counts)
                    existingEntry.network_delay_alarm_counts = existingEntry.network_delay_alarm_counts.concat(obj.network_delay_alarm_counts)
                    existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                    existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                    existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                    existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                    existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)
                    existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                    existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                    existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                } else {
                    result.push({
                        asn_name: obj.asn_name,
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                        hegemony_alarm_counts: obj.hegemony_alarm_counts,
                        network_delay_alarm_counts: obj.network_delay_alarm_counts,
                        defcon_alarm_counts: obj.defcon_alarm_counts,
                        edges_alarm_counts: obj.edges_alarm_counts,
                        moas_alarm_counts: obj.moas_alarm_counts,
                        submoas_alarm_counts: obj.submoas_alarm_counts,
                        hegemony_alarm_timebins: obj.hegemony_alarm_timebins,
                        network_delay_alarm_timebins: obj.network_delay_alarm_timebins,
                        defcon_alarm_timebins: obj.defcon_alarm_timebins,
                        edges_alarm_timebins: obj.edges_alarm_timebins,
                        moas_alarm_timebins: obj.moas_alarm_timebins,
                        submoas_alarm_timebins: obj.submoas_alarm_timebins,
                    });
                }

                return result;
            }, []);
            return alarmsByCountry
        },

        processAlarmCategories(alarmByCountryGroupedData) {
            const alarmCategories = ["hegemony", "network_delay", "defcon", "edges", "moas", "submoas"];
            for (let i = 0; i < alarmByCountryGroupedData.length; i++) {
                alarmCategories.forEach(category => {
                    this.processAlarmCategory(category, alarmByCountryGroupedData[i])
                })
            }
        },

        processAlarmCategory(alarmCategory, data) {
            const counts = data[`${alarmCategory}_alarm_counts`];
            const timebins = data[`${alarmCategory}_alarm_timebins`];

            const uniqueTimebins = timebins.filter((value, index, self) =>
                self.findIndex(date => date.getTime() === value.getTime()) === index
            );
            const summedCounts = [];

            uniqueTimebins.forEach(timebin => {
                const countSum = counts.reduce((acc, curr, index) => {
                    if (timebins[index].getTime() === timebin.getTime()) {
                        return acc + curr;
                    }
                    return acc;
                }, 0);

                summedCounts.push(countSum);
            });

            data[`${alarmCategory}_alarm_counts`] = summedCounts;
        },

        processAggregatedAlarm(alarmsByCountryData) {
            alarmsByCountryData.forEach(aggregatedAlarm => {
                const allTimebins = [
                    ...aggregatedAlarm.hegemony_alarm_timebins,
                    ...aggregatedAlarm.network_delay_alarm_timebins,
                    ...aggregatedAlarm.moas_alarm_timebins,
                    ...aggregatedAlarm.submoas_alarm_timebins,
                    ...aggregatedAlarm.defcon_alarm_timebins,
                    ...aggregatedAlarm.edges_alarm_timebins
                ]
                let uniqueTimebins = allTimebins.filter((value, index, self) =>
                    self.findIndex(date => date.getTime() === value.getTime()) === index
                );

                let sortedTimebins = uniqueTimebins.sort((a, b) => a - b)
                aggregatedAlarm.timebins = sortedTimebins

                aggregatedAlarm.hegemony_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.network_delay_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.moas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.submoas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.edges_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.defcon_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.total_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)

                for (let i = 0; i < aggregatedAlarm.timebins.length; i++) {
                    const timebin = aggregatedAlarm.timebins[i]
                    const hegemony_alarm_timebin_index = aggregatedAlarm.hegemony_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (hegemony_alarm_timebin_index !== -1) {
                        aggregatedAlarm.hegemony_alarm_count_across_timebins[i] = aggregatedAlarm.hegemony_alarm_counts[hegemony_alarm_timebin_index] || 0
                    }

                    const network_delay_alarm_timebin_index = aggregatedAlarm.network_delay_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (network_delay_alarm_timebin_index !== -1) {
                        aggregatedAlarm.network_delay_alarm_count_across_timebins[i] = aggregatedAlarm.network_delay_alarm_counts[network_delay_alarm_timebin_index] || 0
                    }

                    const moas_delay_alarm_timebin_index = aggregatedAlarm.moas_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (moas_delay_alarm_timebin_index !== -1) {
                        aggregatedAlarm.moas_alarm_count_across_timebins[i] = aggregatedAlarm.moas_alarm_counts[moas_delay_alarm_timebin_index] || 0
                    }

                    const submoas_alarm_timebin_index = aggregatedAlarm.submoas_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (submoas_alarm_timebin_index !== -1) {
                        aggregatedAlarm.submoas_alarm_count_across_timebins[i] = aggregatedAlarm.submoas_alarm_counts[submoas_alarm_timebin_index] || 0
                    }

                    const edges_alarm_timebin_index = aggregatedAlarm.edges_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (edges_alarm_timebin_index !== -1) {
                        aggregatedAlarm.edges_alarm_count_across_timebins[i] = aggregatedAlarm.edges_alarm_counts[edges_alarm_timebin_index] || 0
                    }

                    const defcon_alarm_timebin_index = aggregatedAlarm.defcon_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                    if (defcon_alarm_timebin_index !== -1) {
                        aggregatedAlarm.defcon_alarm_count_across_timebins[i] = aggregatedAlarm.defcon_alarm_counts[defcon_alarm_timebin_index] || 0
                    }
                }

                for (let i = 0; i < aggregatedAlarm.total_alarm_count_across_timebins.length; i++) {
                    aggregatedAlarm.total_alarm_count_across_timebins[i] =
                        aggregatedAlarm.hegemony_alarm_count_across_timebins[i] +
                        aggregatedAlarm.network_delay_alarm_count_across_timebins[i] +
                        aggregatedAlarm.moas_alarm_count_across_timebins[i] +
                        aggregatedAlarm.submoas_alarm_count_across_timebins[i] +
                        aggregatedAlarm.edges_alarm_count_across_timebins[i] +
                        aggregatedAlarm.defcon_alarm_count_across_timebins[i]
                }

            });
            alarmsByCountryData.sort((a, b) => (a.country_name > b.country_name) ? 1 : -1)
        },

        getCustomHoverData(data) {
            const result = [];

            for (let i = 0; i < data.length; i++) {
                const row = [];
                const timebins = data[i].timebins;

                for (let j = 0; j < timebins.length; j++) {
                    const hegemonyCount = data[i].hegemony_alarm_count_across_timebins[j] || 0;
                    const networkDelayCount = data[i].network_delay_alarm_count_across_timebins[j] || 0;
                    const moasCount = data[i].moas_alarm_count_across_timebins[j] || 0;
                    const submoasCount = data[i].submoas_alarm_count_across_timebins[j] || 0;
                    const defconCount = data[i].defcon_alarm_count_across_timebins[j] || 0;
                    const edgesCount = data[i].edges_alarm_count_across_timebins[j] || 0;

                    row.push([hegemonyCount, networkDelayCount, moasCount, submoasCount, defconCount, edgesCount]);
                }

                result.push(row);
            }

            return result;
        },

        drawChart(data, customHoverData, name) {
            let traces = []
            for (let i = 0; i < data.length; i++) {
                let trace = {
                    x: data[i].timebins,
                    y: data[i].total_alarm_count_across_timebins,
                    type: 'scatter',
                    mode: 'lines',
                    name: data[i][name],
                    customdata: customHoverData[i],
                    hovertemplate:
                        '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p}</b><br>' +
                        'Total Alarm Counts: %{y}<br>' +
                        'Hegemony Alarm Counts: %{customdata[0]}<br>' +
                        'Network Delay Alarm Counts: %{customdata[1]}<br>' +
                        'Moas Alarm Counts: %{customdata[2]}<br>' +
                        'SubMoas Alarm Counts: %{customdata[3]}<br>' +
                        'Defcon Alarm Counts: %{customdata[4]}<br>' +
                        'Edges Alarm Counts: %{customdata[5]}<br>',
                    marker: {
                        line: {
                            color: 'rgb(255,255,255)',
                            width: 1,
                        },
                    },
                    hoverlabel: {
                        bgcolor: 'white',
                    },
                }
                if (i !== 0) {
                    trace.visible = 'legendonly'
                    trace.hoverinfo = 'none'
                }
                traces.push(trace)
            }


            this.chart.traces = traces;
        },
    },
};
</script>

<style>
.IHR_chart {
    height: 340px;
}
</style>
