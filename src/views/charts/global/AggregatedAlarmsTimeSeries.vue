<template>
    <div class="IHR_chart">
        <aggregated-alarms-time-series-reactive :chart="chart" :aggregatedAlarms="aggregatedAlarms" :loading="loading" />
    </div>
</template>
    
<script>
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
            required: false,
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
        loading: {
            type: Boolean,
            required: true,
        }
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
        }
    },
    data() {
        const chartLayout = {
            margin: { t: 50, b: 65, l: 40, r: 0 },
            title: 'Alarm Counts by Country, ASN, and Time',
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
        };
        const chart = {
            uuid: 'aggregatedAlarmsTimeSeries',
            traces: [],
            layout: chartLayout
        }

        return {
            chart: chart
        }
    },

    computed: {
        alarmTimebins() {
            let alarmTimebinsDict = {}
            for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                if (isSelected) {
                    alarmTimebinsDict[alarmType + '_alarm_timebins'] = alarmType + '_alarm_timebins'
                }
            }
            return alarmTimebinsDict
        }
    },
    mounted() {
        this.initTimeSeries()
    },
    methods: {
        initTimeSeries() {
            if (this.aggregatedAlarms.length) {
                let groupedAlarms, legendName;

                if (this.countryClicked) {
                    groupedAlarms = this.aggregatedAlarms.filter(item => item.country_iso_code3 === this.countryClicked && item.asn_name)
                    console.log('groupedAlarms inside initTimeSeries: ', groupedAlarms)
                    groupedAlarms = this.groupAlarmsByASNNumber(groupedAlarms)
                    legendName = 'asn_name'
                } else {
                    groupedAlarms = this.groupAlarmsByCountry(this.aggregatedAlarms)
                    legendName = 'country_name'
                }

                this.processAlarmTypes(groupedAlarms, this.alarmTypesFilter)
                this.addTotalAlarmCountsRecord(groupedAlarms)
                this.processAggregatedAlarm(groupedAlarms)
                this.sortAlarmsByCountry(groupedAlarms)
                const customHoverData = this.getCustomHoverData(groupedAlarms)
                this.drawChart(groupedAlarms, customHoverData, legendName);
            }
        },
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

                    if (this.alarmTypesFilter.hegemony) {
                        existingEntry.hegemony_alarm_counts = existingEntry.hegemony_alarm_counts.concat(obj.hegemony_alarm_counts)
                        existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        existingEntry.network_delay_alarm_counts = existingEntry.network_delay_alarm_counts.concat(obj.network_delay_alarm_counts)
                        existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.moas) {
                        existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                        existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.submoas) {
                        existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                        existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.defcon) {
                        existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                        existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.edges) {
                        existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                        existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    }

                } else {
                    let alarmsByCountryInitial = {
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                    }

                    if (this.alarmTypesFilter.hegemony) {
                        alarmsByCountryInitial.hegemony_alarm_counts = obj.hegemony_alarm_counts
                        alarmsByCountryInitial.hegemony_alarm_timebins = obj.hegemony_alarm_timebins
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        alarmsByCountryInitial.network_delay_alarm_counts = obj.network_delay_alarm_counts
                        alarmsByCountryInitial.network_delay_alarm_timebins = obj.network_delay_alarm_timebins
                    }

                    if (this.alarmTypesFilter.moas) {
                        alarmsByCountryInitial.moas_alarm_counts = obj.moas_alarm_counts
                        alarmsByCountryInitial.moas_alarm_timebins = obj.moas_alarm_timebins
                    }

                    if (this.alarmTypesFilter.submoas) {
                        alarmsByCountryInitial.submoas_alarm_counts = obj.submoas_alarm_counts
                        alarmsByCountryInitial.submoas_alarm_timebins = obj.submoas_alarm_timebins
                    }

                    if (this.alarmTypesFilter.defcon) {
                        alarmsByCountryInitial.defcon_alarm_counts = obj.defcon_alarm_counts
                        alarmsByCountryInitial.defcon_alarm_timebins = obj.defcon_alarm_timebins
                    }

                    if (this.alarmTypesFilter.edges) {
                        alarmsByCountryInitial.edges_alarm_counts = obj.edges_alarm_counts
                        alarmsByCountryInitial.edges_alarm_timebins = obj.edges_alarm_timebins
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
                    if (this.alarmTypesFilter.hegemony) {
                        existingEntry.hegemony_alarm_counts = existingEntry.hegemony_alarm_counts.concat(obj.hegemony_alarm_counts)
                        existingEntry.hegemony_alarm_timebins = existingEntry.hegemony_alarm_timebins.concat(obj.hegemony_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        existingEntry.network_delay_alarm_counts = existingEntry.network_delay_alarm_counts.concat(obj.network_delay_alarm_counts)
                        existingEntry.network_delay_alarm_timebins = existingEntry.network_delay_alarm_timebins.concat(obj.network_delay_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.moas) {
                        existingEntry.moas_alarm_counts = existingEntry.moas_alarm_counts.concat(obj.moas_alarm_counts)
                        existingEntry.moas_alarm_timebins = existingEntry.moas_alarm_timebins.concat(obj.moas_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.submoas) {
                        existingEntry.submoas_alarm_counts = existingEntry.submoas_alarm_counts.concat(obj.submoas_alarm_counts)
                        existingEntry.submoas_alarm_timebins = existingEntry.submoas_alarm_timebins.concat(obj.submoas_alarm_timebins)
                    }

                    if (this.alarmTypesFilter.defcon) {
                        existingEntry.defcon_alarm_counts = existingEntry.defcon_alarm_counts.concat(obj.defcon_alarm_counts)
                        existingEntry.defcon_alarm_timebins = existingEntry.defcon_alarm_timebins.concat(obj.defcon_alarm_timebins)
                    }

                    if (this.alarmTypes.edges) {
                        existingEntry.edges_alarm_counts = existingEntry.edges_alarm_counts.concat(obj.edges_alarm_counts)
                        existingEntry.edges_alarm_timebins = existingEntry.edges_alarm_timebins.concat(obj.edges_alarm_timebins)
                    }

                } else {
                    let alarmsByASNNumberInitial = {
                        asn_name: this.truncateString(obj.asn_name, 25),
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                    }

                    if (this.alarmTypesFilter.hegemony) {
                        alarmsByASNNumberInitial.hegemony_alarm_counts = obj.hegemony_alarm_counts
                        alarmsByASNNumberInitial.hegemony_alarm_timebins = obj.hegemony_alarm_timebins
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        alarmsByASNNumberInitial.network_delay_alarm_counts = obj.network_delay_alarm_counts
                        alarmsByASNNumberInitial.network_delay_alarm_timebins = obj.network_delay_alarm_timebins
                    }

                    if (this.alarmTypesFilter.moas) {
                        alarmsByASNNumberInitial.moas_alarm_counts = obj.moas_alarm_counts
                        alarmsByASNNumberInitial.moas_alarm_timebins = obj.moas_alarm_timebins
                    }

                    if (this.alarmTypesFilter.submoas) {
                        alarmsByASNNumberInitial.submoas_alarm_counts = obj.submoas_alarm_counts
                        alarmsByASNNumberInitial.submoas_alarm_timebins = obj.submoas_alarm_timebins
                    }

                    if (this.alarmTypesFilter.defcon) {
                        alarmsByASNNumberInitial.defcon_alarm_counts = obj.defcon_alarm_counts
                        alarmsByASNNumberInitial.defcon_alarm_timebins = obj.defcon_alarm_timebins
                    }

                    if (this.alarmTypesFilter.edges) {
                        alarmsByASNNumberInitial.edges_alarm_counts = obj.edges_alarm_counts
                        alarmsByASNNumberInitial.edges_alarm_timebins = obj.edges_alarm_timebins
                    }

                    result.push(alarmsByASNNumberInitial);
                }

                return result;
            }, []);
            return alarmsByCountry
        },

        processAlarmTypes(alarmByCountryGroupedData, alarmTypes) {
            for (let i = 0; i < alarmByCountryGroupedData.length; i++) {
                for (const [alarmType, isSelected] of Object.entries(alarmTypes)) {
                    if (isSelected) {
                        this.processAlarmType(alarmType, alarmByCountryGroupedData[i])
                    }
                }

            }
        },

        processAlarmType(alarmType, data) {
            const counts = data[`${alarmType}_alarm_counts`];
            let timebins = data[`${alarmType}_alarm_timebins`];

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
                let allTimebins = []

                for (const alarmTimebin in this.alarmTimebins) {

                    allTimebins = [
                        ...allTimebins,
                        ...aggregatedAlarm[alarmTimebin]
                    ]
                }



                let uniqueTimebins = allTimebins.filter((value, index, self) =>
                    self.findIndex(date => date.getTime() === value.getTime()) === index
                );

                let sortedTimebins = uniqueTimebins.sort((a, b) => a - b)
                aggregatedAlarm.timebins = sortedTimebins

                if (this.alarmTypesFilter.hegemony) {
                    aggregatedAlarm.hegemony_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                if (this.alarmTypesFilter.network_delay) {
                    aggregatedAlarm.network_delay_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                if (this.alarmTypesFilter.moas) {
                    aggregatedAlarm.moas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                if (this.alarmTypesFilter.submoas) {
                    aggregatedAlarm.submoas_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                if (this.alarmTypesFilter.defcon) {
                    aggregatedAlarm.defcon_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                if (this.alarmTypesFilter.edges) {
                    aggregatedAlarm.edges_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)
                }

                aggregatedAlarm.total_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0)

                for (let i = 0; i < aggregatedAlarm.timebins.length; i++) {
                    const timebin = aggregatedAlarm.timebins[i]
                    if (this.alarmTypesFilter.hegemony) {
                        const hegemony_alarm_timebin_index = aggregatedAlarm.hegemony_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (hegemony_alarm_timebin_index !== -1) {
                            aggregatedAlarm.hegemony_alarm_count_across_timebins[i] = aggregatedAlarm.hegemony_alarm_counts[hegemony_alarm_timebin_index] || 0
                        }
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        const network_delay_alarm_timebin_index = aggregatedAlarm.network_delay_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (network_delay_alarm_timebin_index !== -1) {
                            aggregatedAlarm.network_delay_alarm_count_across_timebins[i] = aggregatedAlarm.network_delay_alarm_counts[network_delay_alarm_timebin_index] || 0
                        }
                    }

                    if (this.alarmTypesFilter.moas) {
                        const moas_delay_alarm_timebin_index = aggregatedAlarm.moas_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (moas_delay_alarm_timebin_index !== -1) {
                            aggregatedAlarm.moas_alarm_count_across_timebins[i] = aggregatedAlarm.moas_alarm_counts[moas_delay_alarm_timebin_index] || 0
                        }
                    }

                    if (this.alarmTypesFilter.submoas) {
                        const submoas_alarm_timebin_index = aggregatedAlarm.submoas_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (submoas_alarm_timebin_index !== -1) {
                            aggregatedAlarm.submoas_alarm_count_across_timebins[i] = aggregatedAlarm.submoas_alarm_counts[submoas_alarm_timebin_index] || 0
                        }
                    }

                    if (this.alarmTypesFilter.defcon) {
                        const defcon_alarm_timebin_index = aggregatedAlarm.defcon_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (defcon_alarm_timebin_index !== -1) {
                            aggregatedAlarm.defcon_alarm_count_across_timebins[i] = aggregatedAlarm.defcon_alarm_counts[defcon_alarm_timebin_index] || 0
                        }
                    }

                    if (this.alarmTypesFilter.edges) {
                        const edges_alarm_timebin_index = aggregatedAlarm.edges_alarm_timebins.findIndex(timebinValue => timebinValue.getTime() === timebin.getTime())
                        if (edges_alarm_timebin_index !== -1) {
                            aggregatedAlarm.edges_alarm_count_across_timebins[i] = aggregatedAlarm.edges_alarm_counts[edges_alarm_timebin_index] || 0
                        }
                    }

                }

                for (let i = 0; i < aggregatedAlarm.total_alarm_count_across_timebins.length; i++) {
                    aggregatedAlarm.total_alarm_count_across_timebins[i] =
                        (this.alarmTypesFilter.hegemony ? aggregatedAlarm.hegemony_alarm_count_across_timebins[i] : 0) +
                        (this.alarmTypesFilter.network_delay ? aggregatedAlarm.network_delay_alarm_count_across_timebins[i] : 0) +
                        (this.alarmTypesFilter.moas ? aggregatedAlarm.moas_alarm_count_across_timebins[i] : 0) +
                        (this.alarmTypesFilter.submoas ? aggregatedAlarm.submoas_alarm_count_across_timebins[i] : 0) +
                        (this.alarmTypesFilter.defcon ? aggregatedAlarm.defcon_alarm_count_across_timebins[i] : 0) +
                        (this.alarmTypesFilter.edges ? aggregatedAlarm.edges_alarm_count_across_timebins[i] : 0)
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
                timebins: [],
            }

            if (this.alarmTypesFilter.hegemony) {
                totalAlarmCountsRecord.hegemony_alarm_counts = []
                totalAlarmCountsRecord.hegemony_alarm_timebins = []
            }

            if (this.alarmTypesFilter.network_delay) {
                totalAlarmCountsRecord.network_delay_alarm_counts = []
                totalAlarmCountsRecord.network_delay_alarm_timebins = []
            }

            if (this.alarmTypesFilter.moas) {
                totalAlarmCountsRecord.moas_alarm_counts = []
                totalAlarmCountsRecord.moas_alarm_timebins = []
            }

            if (this.alarmTypesFilter.submoas) {
                totalAlarmCountsRecord.submoas_alarm_counts = []
                totalAlarmCountsRecord.submoas_alarm_timebins = []
            }

            if (this.alarmTypesFilter.defcon) {
                totalAlarmCountsRecord.defcon_alarm_counts = []
                totalAlarmCountsRecord.defcon_alarm_timebins = []
            }

            if (this.alarmTypesFilter.edges) {
                totalAlarmCountsRecord.edges_alarm_counts = []
                totalAlarmCountsRecord.edges_alarm_timebins = []
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
                    let customHoverDataElement = {}

                    if (this.alarmTypesFilter.hegemony) {
                        const hegemonyCount = data[i].hegemony_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.hegemony_alarm_counts = hegemonyCount;
                    }

                    if (this.alarmTypesFilter.network_delay) {
                        const networkDelayCount = data[i].network_delay_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.network_delay_alarm_counts = networkDelayCount;
                    }

                    if (this.alarmTypesFilter.moas) {
                        const moasCount = data[i].moas_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.moas_alarm_counts = moasCount;
                    }

                    if (this.alarmTypesFilter.submoas) {
                        const submoasCount = data[i].submoas_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.submoas_alarm_counts = submoasCount;
                    }

                    if (this.alarmTypesFilter.defcon) {
                        const defconCount = data[i].defcon_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.defcon_alarm_counts = defconCount;
                    }

                    if (this.alarmTypesFilter.edges) {
                        const edgesCount = data[i].edges_alarm_count_across_timebins[j] || 0;
                        customHoverDataElement.edges_alarm_counts = edgesCount;
                    }

                    row.push(customHoverDataElement);
                }

                result.push(row);
            }

            return result;
        },

        truncateString(str, maxLength) {
            if (str.length <= maxLength) {
                return str;
            } else {
                return str.slice(0, maxLength) + '...';
            }
        },

        drawChart(data, customHoverData, name) {
            let traces = []
            for (let i = 0; i < data.length; i++) {
                let hovertemplate =
                    '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p}</b><br>' +
                    'Total Alarm Counts: %{y}<br>' +
                    (this.alarmTypesFilter.hegemony ? 'Hegemony Alarm Counts: %{customdata.hegemony_alarm_counts}<br>' : '') +
                    (this.alarmTypesFilter.network_delay ? 'Network Delay Alarm Counts: %{customdata.network_delay_alarm_counts}<br>' : '') +
                    (this.alarmTypesFilter.moas ? 'Moas Alarm Counts: %{customdata.moas_alarm_counts}<br>' : '') +
                    (this.alarmTypesFilter.submoas ? 'SubMoas Alarm Counts: %{customdata.submoas_alarm_counts}<br>' : '') +
                    (this.alarmTypesFilter.defcon ? 'Defcon Alarm Counts: %{customdata.defcon_alarm_counts}<br>' : '') +
                    (this.alarmTypesFilter.edges ? 'Edges Alarm Counts: %{customdata.edges_alarm_counts}<br>' : '')

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
