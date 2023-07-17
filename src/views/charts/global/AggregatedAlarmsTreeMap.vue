<template>
    <div class="IHR_chart">
        <aggregated-alarms-tree-map-reactive :chart="chart" :loading="loading" />

        <!-- <div ref="plotlyChart"></div> -->
    </div>
</template>
  
<script>
import AggregatedAlarmsTreeMapReactive from './AggregatedAlarmsTreeMapReactive.vue';
export default {
    components: {
        AggregatedAlarmsTreeMapReactive
    },
    props: {
        aggregatedAlarms: {
            type: Array,
            required: false,
            default: () => []
        },
        loading: {
            type: Boolean,
            required: true,
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
        countryClicked: {
            type: String,
            required: false,
        },
    },
    data() {
        const chartLayout = {
            margin: { t: 70, b: 0, l: 0, r: 0 },
            title: 'Alarm Counts by Country, Alarm Type, and Severity',
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
    mounted() {
        if (this.aggregatedAlarms.length) {
            let granularity = 'Country';
            if (this.countryClicked) {
                granularity = 'ASNName';
                let filteredData = this.aggregatedAlarms.filter(item => item.country_iso_code3 === this.countryClicked && item.asn_name)
                this.data = this.aggregatedAlarmsTreeMapView(filteredData, this.selectedAlarmTypes, granularity)
            } else {
                this.data = this.aggregatedAlarmsTreeMapView(this.aggregatedAlarms, this.selectedAlarmTypes, granularity)
            }
            this.initTreeMap(granularity);
        }
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

        initTreeMap(granularity = 'Country') {
            const { data } = this;
            const granularityValues = [...new Set(data.map(item => item[granularity]))];
            const alarmTypes = [...new Set(data.map(item => item.AlarmType))];
            const severities = [...new Set(data.map(item => item.Severity))];

            const trace = {
                type: 'treemap',
                ids: [], // To create unique IDs for each node
                labels: [], // To store labels (alarmTypes and countries)
                parents: [], // To store parent references for each node
                values: [], // To store count values for each leaf node
                text: [], // To store tooltip text (alarm types)
                hoverinfo: 'label+text+value',
            };

            // Add root nodes (countries)
            for (const granularityValue of granularityValues) {
                trace.ids.push(granularityValue);
                trace.labels.push(this.truncateString(granularityValue, 15));
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

            // Add alarmType nodes as children of country nodes
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

            // Add severity nodes as children of alarmType nodes
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
            this.chart.traces.push(trace);
        },


        truncateString(str, maxLength) {
            if (str.length <= maxLength) {
                return str;
            } else {
                return str.slice(0, maxLength) + '...';
            }
        },
    },
}

</script>