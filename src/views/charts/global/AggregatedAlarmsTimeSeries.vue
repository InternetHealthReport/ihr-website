<template>
    <div class="IHR_chart">
        <aggregated-alarms-time-series-reactive :chart="chart" :aggregatedAlarms="aggregatedAlarms" :loading="loadingVal" />
    </div>
</template>
    
<script>
import { truncateString } from '@/plugins/AggregatedAlarmsUtils.js'
import AggregatedAlarmsTimeSeriesReactive from './AggregatedAlarmsTimeSeriesReactive.vue'
import { getCountryISO2FromISO3 } from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'

export default {
    components: {
        AggregatedAlarmsTimeSeriesReactive,
    },
    props: {
        aggregatedAlarms: {
            type: Array,
            required: true,
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
            required: true,
        },
        loadingVal: {
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
            handler: function () {
                this.resetTimeSeries()
            }
        },
        countryClicked: {
            handler: function (newCountryClicked) {
                let legendName = 'country_name'
                let chartTitle;
                if (!this.loadingVal) {
                    if (newCountryClicked) {
                        this.groupedAlarms = this.filterAlarmsByCountryAndASN(this.aggregatedAlarms)
                        this.groupedAlarms = this.groupAlarmsByKey(this.groupedAlarms, 'asn', 25)
                        const countryISO2 = getCountryISO2FromISO3(newCountryClicked)
                        const countryName = getCountryName(countryISO2)
                        legendName = 'asn_name'
                        chartTitle = `Alarm Counts by ASN and Time for ${countryName}`

                    } else {
                        this.groupedAlarms = this.groupAlarmsByKey(this.aggregatedAlarms, 'country_name')
                        chartTitle = 'Alarm Counts by Country, ASN, and Time'
                    }
                    this.$set(this.chart.layout, 'title', chartTitle)
                    this.initTimeSeries(legendName)
                }
            },
            immediate: true
        },
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
            chart: chart,
            groupedAlarms: [],
            legendName: '',
        }
    },

    computed: {
        alarmTimebins() {
            let alarmTimebinsDict = {}
            for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                if (isSelected) {
                    alarmTimebinsDict[`${alarmType}_alarm_timebins`] = alarmType + '_alarm_timebins'
                }
            }
            return alarmTimebinsDict
        },
    },
    methods: {
        initTimeSeries(legendName) {
            this.processAlarmTypes(this.groupedAlarms, this.alarmTypesFilter)
            this.addTotalAlarmCountsRecord(this.groupedAlarms)
            this.processAggregatedAlarms(this.groupedAlarms)
            this.sortAlarmsByCountry(this.groupedAlarms)
            const customHoverData = this.getCustomHoverData(this.groupedAlarms)
            this.drawChart(this.groupedAlarms, customHoverData, legendName);
        },

        resetTimeSeries() {
            this.untoggleLegend(this.chart.traces)
            this.$emit('time-series-reset')
        },

        untoggleLegend(traces) {
            for (let i = 0; i < traces.length; i++) {
                traces[i].visible = i === 0 ? true : 'legendonly';
                traces[i].hoverinfo = i === 0 ? 'all' : 'none';
            }
        },

        filterAlarmsByCountryAndASN(alarms) {
            return alarms.filter(item => item.country_iso_code3 === this.countryClicked && item.asn_name);
        },

        groupAlarmsByKey(alarms, key, truncateLength = null) {
            const alarmsByKey = alarms.reduce((result, obj) => {
                const keyValue = obj[key];
                const existingEntry = result.find((entry) => entry[key] === keyValue);

                if (existingEntry) {
                    for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                        if (isSelected) {
                            existingEntry[`${alarmType}_alarm_counts`] = existingEntry[`${alarmType}_alarm_counts`].concat(obj[`${alarmType}_alarm_counts`]);
                            existingEntry[`${alarmType}_alarm_timebins`] = existingEntry[`${alarmType}_alarm_timebins`].concat(obj[`${alarmType}_alarm_timebins`]);
                        }
                    }
                } else {
                    let alarmEntry = {
                        [key]: keyValue,
                        country_iso_code2: obj.country_iso_code2,
                        country_iso_code3: obj.country_iso_code3,
                        country_name: obj.country_name,
                        total_alarm_counts: obj.total_alarm_counts,
                    };

                    if (truncateLength && obj.asn_name) {
                        alarmEntry.asn_name = truncateString(obj.asn_name, truncateLength);
                    }

                    for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                        if (isSelected) {
                            alarmEntry[`${alarmType}_alarm_counts`] = obj[`${alarmType}_alarm_counts`];
                            alarmEntry[`${alarmType}_alarm_timebins`] = obj[`${alarmType}_alarm_timebins`];
                        }
                    }
                    result.push(alarmEntry);
                }
                return result;
            }, []);

            return alarmsByKey;
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
            const sumArray = (arr) => {
                return arr.reduce((acc, curr) => acc + curr, 0);
            }
            const counts = data[`${alarmType}_alarm_counts`];
            const timebins = data[`${alarmType}_alarm_timebins`];
            const uniqueTimebins = Array.from(new Set(timebins.map(time => time.getTime())));

            const summedCounts = uniqueTimebins.map(timebin =>
                sumArray(counts.filter((_, index) => timebins[index].getTime() === timebin))
            );

            data[`${alarmType}_alarm_counts`] = summedCounts;
        },

        processAggregatedAlarms(alarmsByCountryData) {
            alarmsByCountryData.forEach(aggregatedAlarm => {
                const allTimebins = this.getAllTimebins(aggregatedAlarm);
                const uniqueTimebins = this.getUniqueTimebins(allTimebins);
                const sortedTimebins = this.getSortedTimebins(uniqueTimebins);

                aggregatedAlarm.timebins = sortedTimebins;

                for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                    if (isSelected) {
                        aggregatedAlarm[`${alarmType}_alarm_count_across_timebins`] = Array(aggregatedAlarm.timebins.length).fill(0);
                    }
                }

                aggregatedAlarm.total_alarm_count_across_timebins = Array(aggregatedAlarm.timebins.length).fill(0);

                this.fillAlarmCountAcrossTimebins(aggregatedAlarm);
                this.calculateTotalAlarmCount(aggregatedAlarm);
            });
        },

        getAllTimebins(aggregatedAlarm) {
            let allTimebins = [];
            for (const alarmTimebin in this.alarmTimebins) {
                allTimebins = [...allTimebins, ...aggregatedAlarm[alarmTimebin]];
            }
            return allTimebins;
        },

        getUniqueTimebins(allTimebins) {
            return allTimebins.filter((value, index, self) =>
                self.findIndex(date => date.getTime() === value.getTime()) === index
            );
        },

        getSortedTimebins(uniqueTimebins) {
            return uniqueTimebins.sort((a, b) => a - b);
        },

        fillAlarmCountAcrossTimebins(aggregatedAlarm) {
            for (let i = 0; i < aggregatedAlarm.timebins.length; i++) {
                const timebin = aggregatedAlarm.timebins[i];

                for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                    if (isSelected) {
                        const alarm_timebin_index = aggregatedAlarm[`${alarmType}_alarm_timebins`].findIndex(timebinValue => timebinValue.getTime() === timebin.getTime());
                        if (alarm_timebin_index !== -1) {
                            aggregatedAlarm[`${alarmType}_alarm_count_across_timebins`][i] = aggregatedAlarm[`${alarmType}_alarm_counts`][alarm_timebin_index] || 0;
                        }
                    }
                }
            }
        },

        calculateTotalAlarmCount(aggregatedAlarm) {
            for (let i = 0; i < aggregatedAlarm.total_alarm_count_across_timebins.length; i++) {
                for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                    if (isSelected) {
                        aggregatedAlarm.total_alarm_count_across_timebins[i] += aggregatedAlarm[`${alarmType}_alarm_count_across_timebins`][i];
                    }
                }
            }
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

            for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                if (isSelected) {
                    totalAlarmCountsRecord[`${alarmType}_alarm_counts`] = []
                    totalAlarmCountsRecord[`${alarmType}_alarm_timebins`] = []
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
                    let customHoverDataElement = {}

                    for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                        if (isSelected) {
                            customHoverDataElement[`${alarmType}_alarm_counts`] = data[i][`${alarmType}_alarm_count_across_timebins`][j] || 0
                        }
                    }
                    row.push(customHoverDataElement);
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
                    'Total Alarm Counts: %{y}<br>'

                for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                    if (isSelected) {
                        hovertemplate += `${alarmType} Alarm Counts: %{customdata.${alarmType}_alarm_counts}<br>`
                    }
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