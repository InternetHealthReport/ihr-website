<template>
    <div class="IHR_chart">
        <aggregated-alarms-time-series-reactive :chart="chart" :loading="loading" />
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
        },
        resetGranularityFlag: {
            type: Boolean,
            required: false,
            default: false
        },
        alarmTypesFilter: {
            type: Object,
            required: false,
            default: () => {
                return {
                    hegemony: true,
                    network_delay: true,
                }
            }
        },
        alarmDataSourcesFilter: {
            type: Object,
            required: false,
            default: () => { }
        },

    },
    emits: {
        'time-series-reset': function () {
            return false
        },
    },
    watch: {
        resetGranularityFlag: {
            handler: function (newResetGranularityFlag) {
                if (newResetGranularityFlag) {
                    this.resetTimeSeries()
                }
            }
        },
        alarmDataSourcesFilter: {
            handler: function (newAlarmDataSourcesFilter) {
                // let checkedValuesIncluded = Object.values(newAlarmDataSourcesFilter).includes(true)
                if (newAlarmDataSourcesFilter.grip) {
                    this.loading = true
                }
            },
            deep: true
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

    computed: {
        alarmTypes() {
            let alarmTypes = ['hegemony', 'network_delay']
            if (this.alarmDataSourcesFilter.grip) {
                alarmTypes = [
                    ...alarmTypes,
                    'moas',
                    'submoas',
                    'defcon',
                    'edges'
                ]
            }
            return alarmTypes
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

            this.processAlarmTypes(groupedAlarms, this.alarmTypes)
            this.addTotalAlarmCountsRecord(groupedAlarms)
            this.processAggregatedAlarm(groupedAlarms)
            this.sortAlarmsByCountry(groupedAlarms)
            const customHoverData = this.getCustomHoverData(groupedAlarms)
            this.drawChart(groupedAlarms, customHoverData, legendName);
            this.loading = false
        }
    },

    methods: {
        resetTimeSeries() {
            if (!this.loading) {
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
                    existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)

                    if (this.alarmDataSourcesFilter.grip) {
                        existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                        existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                        existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                        existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                        existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                        existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                        existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                        existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    }
                } else {
                    let alarmsByCountryInitial = {
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                        hegemony_alarm_counts: obj.hegemony_alarm_counts,
                        network_delay_alarm_counts: obj.network_delay_alarm_counts,
                        hegemony_alarm_timebins: obj.hegemony_alarm_timebins,
                        network_delay_alarm_timebins: obj.network_delay_alarm_timebins,
                    }
                    if (this.alarmDataSourcesFilter.grip) {
                        alarmsByCountryInitial = {
                            ...alarmsByCountryInitial,
                            moas_alarm_counts: obj.moas_alarm_counts,
                            submoas_alarm_counts: obj.submoas_alarm_counts,
                            defcon_alarm_counts: obj.defcon_alarm_counts,
                            edges_alarm_counts: obj.edges_alarm_counts,
                            moas_alarm_timebins: obj.moas_alarm_timebins,
                            submoas_alarm_timebins: obj.submoas_alarm_timebins,
                            defcon_alarm_timebins: obj.defcon_alarm_timebins,
                            edges_alarm_timebins: obj.edges_alarm_timebins,
                        }
                    }
                    result.push(alarmsByCountryInitial);
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
                    existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)
                    if (this.alarmDataSourcesFilter.grip) {
                        existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                        existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                        existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                        existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                        existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                        existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                        existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                        existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    }
                } else {
                    let alarmsByASNNumberInitial = {
                        asn_name: obj.asn_name,
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                        hegemony_alarm_counts: obj.hegemony_alarm_counts,
                        network_delay_alarm_counts: obj.network_delay_alarm_counts,
                        hegemony_alarm_timebins: obj.hegemony_alarm_timebins,
                        network_delay_alarm_timebins: obj.network_delay_alarm_timebins,
                    }
                    if (this.alarmDataSourcesFilter.grip) {
                        alarmsByASNNumberInitial = {
                            ...alarmsByASNNumberInitial,
                            moas_alarm_counts: obj.moas_alarm_counts,
                            submoas_alarm_counts: obj.submoas_alarm_counts,
                            defcon_alarm_counts: obj.defcon_alarm_counts,
                            edges_alarm_counts: obj.edges_alarm_counts,
                            moas_alarm_timebins: obj.moas_alarm_timebins,
                            submoas_alarm_timebins: obj.submoas_alarm_timebins,
                            defcon_alarm_timebins: obj.defcon_alarm_timebins,
                            edges_alarm_timebins: obj.edges_alarm_timebins,
                        }
                    }

                    result.push(alarmsByASNNumberInitial);
                }

                return result;
            }, []);
            return alarmsByCountry
        },

        processAlarmTypes(alarmByCountryGroupedData, alarmTypes) {
            for (let i = 0; i < alarmByCountryGroupedData.length; i++) {
                alarmTypes.forEach(alarmType => {
                    this.processAlarmType(alarmType, alarmByCountryGroupedData[i])
                })
            }
        },

        processAlarmType(alarmType, data) {
            const counts = data[`${alarmType}_alarm_counts`];
            const timebins = data[`${alarmType}_alarm_timebins`];

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

            data[`${alarmType}_alarm_counts`] = summedCounts;
        },

        processAggregatedAlarm(alarmsByCountryData) {
            alarmsByCountryData.forEach(aggregatedAlarm => {
                let allTimebins = [...aggregatedAlarm.hegemony_alarm_timebins, ...aggregatedAlarm.network_delay_alarm_timebins]
                if (this.alarmDataSourcesFilter.grip) {
                    allTimebins = [
                        ...allTimebins,
                        ...aggregatedAlarm.moas_alarm_timebins,
                        ...aggregatedAlarm.submoas_alarm_timebins,
                        ...aggregatedAlarm.defcon_alarm_timebins,
                        ...aggregatedAlarm.edges_alarm_timebins]
                }

                let uniqueTimebins = allTimebins.filter((value, index, self) =>
                    self.findIndex(date => date.getTime() === value.getTime()) === index
                );

                let sortedTimebins = uniqueTimebins.sort((a, b) => a - b)
                aggregatedAlarm.timebins = sortedTimebins

                aggregatedAlarm.hegemony_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.network_delay_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                aggregatedAlarm.total_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)

                if (this.alarmDataSourcesFilter.grip) {
                    aggregatedAlarm.moas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                    aggregatedAlarm.submoas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                    aggregatedAlarm.edges_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                    aggregatedAlarm.defcon_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

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

                    if (this.alarmDataSourcesFilter.grip) {
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
                }

                for (let i = 0; i < aggregatedAlarm.total_alarm_count_across_timebins.length; i++) {
                    aggregatedAlarm.total_alarm_count_across_timebins[i] =
                        aggregatedAlarm.hegemony_alarm_count_across_timebins[i] +
                        aggregatedAlarm.network_delay_alarm_count_across_timebins[i]
                    if (this.alarmDataSourcesFilter.grip) {
                        aggregatedAlarm.total_alarm_count_across_timebins[i] +=
                            aggregatedAlarm.moas_alarm_count_across_timebins[i] +
                            aggregatedAlarm.submoas_alarm_count_across_timebins[i] +
                            aggregatedAlarm.defcon_alarm_count_across_timebins[i] +
                            aggregatedAlarm.edges_alarm_count_across_timebins[i]
                    }
                }
            });
        },

        sortAlarmsByCountry(alarmsByCountryData) {
            alarmsByCountryData.sort((a, b) => {
                if (a.country_name.toLowerCase() === 'all') {
                    return -1
                } else if (b.country_name.toLowerCase() === 'all') {
                    return 1
                } else {
                    return a.country_name.toLowerCase().localeCompare(b.country_name.toLowerCase())
                }
            });
        },

        addTotalAlarmCountsRecord(groupedData) {
            let totalAlarmCountsRecord = {
                country_iso_code2: 'All',
                country_iso_code3: 'All',
                country_name: 'All',
                asn_name: 'All',
                hegemony_alarm_counts: [],
                network_delay_alarm_counts: [],
                hegemony_alarm_timebins: [],
                network_delay_alarm_timebins: [],
                timebins: [],
            }

            if (this.alarmDataSourcesFilter.grip) {
                totalAlarmCountsRecord = {
                    ...totalAlarmCountsRecord,
                    defcon_alarm_counts: [],
                    edges_alarm_counts: [],
                    moas_alarm_counts: [],
                    submoas_alarm_counts: [],
                    defcon_alarm_timebins: [],
                    edges_alarm_timebins: [],
                    moas_alarm_timebins: [],
                    submoas_alarm_timebins: [],
                }
            }

            groupedData.forEach(alarm => {
                Object.keys(totalAlarmCountsRecord).forEach(key => {
                    if (Array.isArray(totalAlarmCountsRecord[key])) {
                        totalAlarmCountsRecord[key] = totalAlarmCountsRecord[key].concat(alarm[key]);
                    }
                });
            });

            groupedData.push(totalAlarmCountsRecord)
        },

        getCustomHoverData(data) {
            const result = [];

            for (let i = 0; i < data.length; i++) {
                const row = [];
                const timebins = data[i].timebins;

                for (let j = 0; j < timebins.length; j++) {
                    const hegemonyCount = data[i].hegemony_alarm_count_across_timebins[j] || 0;
                    const networkDelayCount = data[i].network_delay_alarm_count_across_timebins[j] || 0;
                    if (this.alarmDataSourcesFilter.grip) {
                        const moasCount = data[i].moas_alarm_count_across_timebins[j] || 0;
                        const submoasCount = data[i].submoas_alarm_count_across_timebins[j] || 0;
                        const defconCount = data[i].defcon_alarm_count_across_timebins[j] || 0;
                        const edgesCount = data[i].edges_alarm_count_across_timebins[j] || 0;
                        row.push([hegemonyCount, networkDelayCount, moasCount, submoasCount, defconCount, edgesCount]);
                    } else {
                        row.push([hegemonyCount, networkDelayCount])
                    }

                }

                result.push(row);
            }

            return result;
        },

        drawChart(data, customHoverData, name) {
            let traces = []
            for (let i = 0; i < data.length; i++) {
                let hovertemplate =
                    '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p}</b><br>' +
                    'Total Alarm Counts: %{y}<br>' +
                    'Hegemony Alarm Counts: %{customdata[0]}<br>' +
                    'Network Delay Alarm Counts: %{customdata[1]}<br>'
                if (this.alarmDataSourcesFilter.grip) {
                    hovertemplate +=
                        'Moas Alarm Counts: %{customdata[2]}<br>' +
                        'SubMoas Alarm Counts: %{customdata[3]}<br>' +
                        'Defcon Alarm Counts: %{customdata[4]}<br>' +
                        'Edges Alarm Counts: %{customdata[5]}<br>'
                }
                let trace = {
                    x: data[i].timebins,
                    y: data[i].total_alarm_count_across_timebins,
                    type: 'scatter',
                    mode: 'lines',
                    name: data[i][name],
                    customdata: customHoverData[i],
                    hovertemplate: hovertemplate,
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
    height: 380px;
}
</style>
