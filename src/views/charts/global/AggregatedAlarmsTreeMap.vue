<template>
    <div class="IHR_chart">
        <aggregated-alarms-tree-map-reactive :chart="chart" :loading="loadingVal" />
    </div>
</template>
  
<script>

import { truncateString } from '@/plugins/AggregatedAlarmsUtils.js'
import { getCountryISO2FromISO3 } from '@/plugins/countryISOCode3.js'
import getCountryName from '@/plugins/countryName.js'
import AggregatedAlarmsTreeMapReactive from './AggregatedAlarmsTreeMapReactive.vue'

export default {
    components: {
        AggregatedAlarmsTreeMapReactive
    },
    props: {
        aggregatedAlarms: {
            type: Array,
            required: true,
        },
        loadingVal: {
            type: Boolean,
            required: true,
        },
        alarmTypesFilter: {
            type: Object,
            required: true,
        },
        countryClicked: {
            type: String,
            required: false,
        },
    },
    data() {
        const chartLayout = {
            margin: { t: 70, b: 0, l: 0, r: 0 },
            title: 'Alarm Counts by Country, ASN, Alarm Type, and Severity',
        };

        return {
            data: [],
            chart: {
                uuid: 'aggregatedAlarmsTreeMap',
                traces: [],
                layout: chartLayout
            },
        }
    },
    watch: {
        countryClicked: {
            handler: function (newCountryClicked) {
                this.countryClickedHandler(newCountryClicked)

            },
            immediate: true
        },
    },

    computed: {
        selectedAlarmTypes() {
            let selectedAlarmTypes = []
            for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                if (isSelected) {
                    selectedAlarmTypes.push(alarmType);
                }
            }
            return selectedAlarmTypes;
        }
    },
    methods: {
        countryClickedHandler(newCountryClicked) {
            let granularity = 'Country'
            let chartTitle;
            if (!this.loadingVal) {
                if (newCountryClicked) {
                    granularity = 'ASNName';
                    const filteredData = this.filterAlarmsByCountryAndASNName(this.aggregatedAlarms);
                    this.data = this.aggregatedAlarmsTreeMapView(filteredData, this.selectedAlarmTypes, granularity)
                    const countryISO2 = getCountryISO2FromISO3(newCountryClicked)
                    const countryName = getCountryName(countryISO2)
                    chartTitle = `Alarm Counts by ASN, Alarm Type, and Severity for ${countryName}`
                } else {
                    this.data = this.aggregatedAlarmsTreeMapView(this.aggregatedAlarms, this.selectedAlarmTypes, granularity)
                    chartTitle = 'Alarm Counts by Country, ASN, Alarm Type, and Severity'
                }
                this.$set(this.chart.layout, 'title', chartTitle);
                this.initTreeMap(granularity);
            }
        },
        initTreeMap(granularity) {
            const { data } = this;

            const granularityValues = this.getUniqueValues(data, granularity);
            const alarmTypes = this.getUniqueValues(data, 'AlarmType');
            const severities = this.getUniqueValues(data, 'Severity');

            const trace = this.createBaseTrace()

            this.addGranularityData(trace, data, granularity, granularityValues);

            this.addAlarmTypeData(trace, data, granularity, granularityValues, alarmTypes);

            this.addSeverityData(trace, data, granularity, granularityValues, alarmTypes, severities);
            this.chart.traces = [trace];
        },

        createBaseTrace() {
            return {
                type: 'treemap',
                ids: [],
                labels: [],
                parents: [],
                values: [],
                text: [],
                hoverinfo: 'label+text+value',
            }
        },

        filterAlarmsByCountryAndASNName(alarms) {
            return alarms.filter(item => item.country_iso_code3 === this.countryClicked && item.asn_name)
        },

        getUniqueValues(data, property) {
            return [...new Set(data.map(item => item[property]))];
        },

        addGranularityData(trace, data, granularity, granularityValues) {
            for (const granularityValue of granularityValues) {
                trace.ids.push(granularityValue);
                trace.labels.push(truncateString(granularityValue, 15));
                trace.parents.push('');
                const granularityCount = data
                    .filter(item => item[granularity] === granularityValue)
                    .reduce((sum, item) => sum + item.Count, 0);
                trace.values.push(0);
                trace.text.push(
                    (granularity === 'ASNName' ? 'asn_name' : 'country_name') + ': ' + granularityValue + '<br>' +
                    'total_alarm_counts: ' + granularityCount
                );
            }
        },

        addAlarmTypeData(trace, data, granularity, granularityValues, alarmTypes) {
            for (const granularityValue of granularityValues) {
                for (const alarmType of alarmTypes) {
                    trace.ids.push(`${granularityValue}-${alarmType}`);
                    trace.labels.push(alarmType);
                    trace.parents.push(granularityValue);
                    const alarmTypeCount = data
                        .filter(item => item[granularity] === granularityValue && item.AlarmType === alarmType)
                        .reduce((sum, item) => sum + item.Count, 0);
                    trace.values.push(0);
                    trace.text.push(alarmType + '_alarm_counts: ' + alarmTypeCount);
                }
            }
        },

        addSeverityData(trace, data, granularity, granularityValues, alarmTypes, severities) {
            for (const granularityValue of granularityValues) {
                for (const alarmType of alarmTypes) {
                    for (const severity of severities) {
                        const item = data.find(item => item[granularity] === granularityValue && item.AlarmType === alarmType && item.Severity === severity);
                        if (item) {
                            trace.ids.push(`${granularityValue}-${alarmType}-${severity}`);
                            trace.labels.push(severity);
                            trace.parents.push(`${granularityValue}-${alarmType}`);
                            trace.values.push(item.Count);
                            trace.text.push('');
                        }
                    }
                }
            }
        },

        aggregatedAlarmsTreeMapView(data, alarmTypes, granularity = 'Country') {
            const aggregatedData = []
            for (const alarmType of alarmTypes) {
                for (const item of data) {
                    const granularityValue = granularity === 'ASNName' ? item.asn_name : item.country_name;
                    const alarmCounts = item[`${alarmType}_alarm_counts`];
                    const alarmSeverities = item[`${alarmType}_alarm_severities`];

                    const countsBySeverity = {};
                    for (let i = 0; i < alarmSeverities.length; i++) {
                        const severity = alarmSeverities[i];
                        countsBySeverity[severity] = (countsBySeverity[severity] || 0) + alarmCounts[i];
                    }

                    for (const severity in countsBySeverity) {
                        const count = countsBySeverity[severity];
                        aggregatedData.push({
                            [granularity]: granularityValue,
                            "AlarmType": alarmType,
                            "Severity": severity.charAt(0).toUpperCase() + severity.slice(1),
                            "Count": count
                        });
                    }
                }
            }
            return aggregatedData;
        },
    },
}

</script>