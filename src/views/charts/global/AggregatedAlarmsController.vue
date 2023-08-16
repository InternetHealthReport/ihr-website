<template>
    <div>
        <q-card class="IHR_charts-body">
            <q-card-section>
                <aggregated-alarm-filters :start-time="timeFiltersCurrent.startTime" :end-time="timeFiltersCurrent.endTime"
                    :alarms-metadata="alarmsInfo.metadata" :loadingVal="loadingVal" :severities="severities"
                    @filter-alarms-by-time="filterAlarmsByTimeHandler"
                    @filter-alarms-by-alarm-types="filterAlarmsByAlarmTypesHandler"
                    @filter-alarms-by-severities="filterAlarmsBySeveritiesHandler" @reset-time="resetTimeFlagHandler"
                    @reset-granularity="resetGranularityFlagHandler" />
            </q-card-section>
        </q-card>

        <q-card class="IHR_charts-body">
            <q-card-section>
                <world-map-aggregated-alarms :loadingVal="loadingVal" @country-clicked="countryClickedHandler"
                    ref="worldMapAggregatedAlarms" />
            </q-card-section>
        </q-card>

        <div class="card-container">
            <div class="card-wrapper">
                <q-card class="IHR_charts-body">
                    <q-card-section>
                        <time-series-aggregated-alarms :loadingVal="loadingVal"
                            @filter-alarms-by-time="filterAlarmsByPlotlyTimeHandler" ref="timeSeriesAggregatedAlarms" />
                    </q-card-section>
                </q-card>
            </div>
            <div class="card-wrapper">
                <q-card class="IHR_charts-body">
                    <q-card-section>
                        <tree-map-aggregated-alarms :loadingVal="loadingVal" ref="treeMapAggregatedAlarms" />
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>
  
<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import { getCountryNameFromIsoCode3 } from '@/plugins/countryISOCode3'
import * as AggregatedAlarmsDataModel from '@/models/AggregatedAlarmsDataModel'
import AggregatedAlarmFilters from './AggregatedAlarmFilters';
import WorldMapAggregatedAlarms from './WorldMapAggregatedAlarms'
import TimeSeriesAggregatedAlarms from './TimeSeriesAggregatedAlarms'
import TreeMapAggregatedAlarms from './TreeMapAggregatedAlarms'

export const ALARMS_INFO = {
    data_sources: {
        ihr: {
            hegemony_alarm_counts: [],
            hegemony_alarm_timebins: [],
            hegemony_alarm_severities: [],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: []
        },
        grip: {
            moas_alarm_counts: [],
            moas_alarm_timebins: [],
            moas_alarm_severities: [],
            submoas_alarm_counts: [],
            submoas_alarm_timebins: [],
            submoas_alarm_severities: [],
            defcon_alarm_counts: [],
            defcon_alarm_timebins: [],
            defcon_alarm_severities: [],
            edges_alarm_counts: [],
            edges_alarm_timebins: [],
            edges_alarm_severities: [],
        },
        ioda: {
            ping_slash24_alarm_counts: [],
            ping_slash24_alarm_timebins: [],
            ping_slash24_alarm_severities: [],
            bgp_alarm_counts: [],
            bgp_alarm_timebins: [],
            bgp_alarm_severities: [],
            ucsd_nt_alarm_counts: [],
            ucsd_nt_alarm_timebins: [],
            ucsd_nt_alarm_severities: [],
        }
    },
    metadata: {
        data_sources: {
            ihr: {
                alarm_types: {
                    hegemony: {
                        description: 'Hegemony Alarm Type',
                        showHelpModal: false
                    },
                    network_delay: {
                        description: 'Network Delay Alarm Type',
                        showHelpModal: false
                    }
                },
                description: 'IHR Data Source',
                showHelpModal: false
            },
            grip: {
                alarm_types: {
                    moas: {
                        description: 'Moas Alarm Type',
                        showHelpModal: false
                    },
                    submoas: {
                        description: 'Submoas Alarm type',
                        showHelpModal: false
                    },
                    defcon: {
                        description: 'Defcon Alarm Type',
                        showHelpModal: false
                    },
                    edges: {
                        description: 'Edges Alarm Type',
                        showHelpModal: false
                    },
                },
                description: 'Grip Data Source',
                showHelpModal: false
            },
            ioda: {
                alarm_types: {
                    ping_slash24: {
                        description: 'Ping Slash24 Alarm Type',
                        showHelpModal: false
                    },
                    bgp: {
                        description: 'BGP Alarm Type',
                        showHelpModal: false
                    },
                    ucsd_nt: {
                        description: 'UCSD NT Alarm Type',
                        showHelpModal: false
                    },
                },
                description: 'IODA Data Source',
                showHelpModal: false
            }
        }

    }
}

export default {
    components: {
        AggregatedAlarmFilters,
        WorldMapAggregatedAlarms,
        TimeSeriesAggregatedAlarms,
        TreeMapAggregatedAlarms,
    },
    data() {
        return {
            alarms: [],
            alarmsTimeFiltered: null,
            alarmsSeveritiesFiltered: null,
            aggregatedAlarmsLoadingVal: false,
            alarmTypesFilter: {},
            startDateTimePlotly: null,
            endDateTimePlotly: null,
            dateTimeFilter: {
                startDateTime: null,
                endDateTime: null
            },
            thirdPartyAlarmsStates: {
                grip: { downloading: false, data: null },
                ioda: { downloading: false, data: null }
            },
            severities: {
                low: true,
                normal: true,
                high: true
            },
            alarmsInfo: ALARMS_INFO
        }
    },

    props: {
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
            required: true,
        },
        hegemonyAlarms: {
            type: Array,
            required: true,
        },
        networkDelayAlarms: {
            type: Array,
            required: true,
        },
        hegemonyLoading: {
            type: Boolean,
            required: true
        },
        networkDelayLoading: {
            type: Boolean,
            required: true
        }

    },

    computed: {
        timeFiltersCurrent() {
            const startTime = this.startDateTimePlotly ? new Date(this.startDateTimePlotly) : this.startTime
            const endTime = this.endDateTimePlotly ? new Date(this.endDateTimePlotly) : this.endTime
            const dateTimeFilter = { startTime, endTime }
            return dateTimeFilter
        },
        loadingVal() {
            return this.hegemonyLoading || this.networkDelayLoading || this.aggregatedAlarmsLoadingVal
        },
        aggregatedAttrsSelected() {
            const aggregatedAttrsSelected = { counts: {}, timebins: {}, severities: {} }

            const alarmTypesSelected = []
            for (const [alarmType, isSelected] of Object.entries(this.alarmTypesFilter)) {
                if (isSelected) {
                    alarmTypesSelected.push(alarmType)
                }
            }

            const allAggergatedAttrs = AggregatedAlarmsUtils.flattenDictionary(Object.values(ALARMS_INFO.data_sources))
            const aggregatedAttrsFiltered = AggregatedAlarmsUtils.filterDictByPrefixes(allAggergatedAttrs, alarmTypesSelected)

            for (const aggregatedAttr in aggregatedAttrsFiltered) {
                if (aggregatedAttr.endsWith('counts')) {
                    aggregatedAttrsSelected.counts[aggregatedAttr] = []
                } else if (aggregatedAttr.endsWith('timebins')) {
                    aggregatedAttrsSelected.timebins[aggregatedAttr] = []
                } else if (aggregatedAttr.endsWith('severities')) {
                    aggregatedAttrsSelected.severities[aggregatedAttr] = []
                }
            }
            return aggregatedAttrsSelected
        },
        dataSourcesSelected() {
            const dataSourcesSelected = {}
            const { data_sources: dataSources } = ALARMS_INFO.metadata
            for (const dataSource in dataSources) {
                dataSourcesSelected[dataSource] = this.isDataSourceSelected(dataSources[dataSource], this.alarmTypesFilter)
            }
            return dataSourcesSelected
        },
        severitiesSelected() {
            const severitiesSelected = []
            for (const [severityType, isSelected] of Object.entries(this.severities)) {
                if (isSelected) {
                    severitiesSelected.push(severityType)
                }
            }
            return severitiesSelected
        },
        alarmsCurrent() {
            const currentTimedAlarms = this.alarmsTimeFiltered ? this.alarmsTimeFiltered : this.alarms
            return currentTimedAlarms
        },
    },

    watch: {
        alarms: {
            handler: function (newAlarms) {
                const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
                if (!this.loadingVal && anyAlarmTypesSelected && this.alarmsCurrent.length) {
                    const countAggregatedAttrsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    this.$refs.worldMapAggregatedAlarms.etl(newAlarms, countAggregatedAttrsSelected)
                    this.$refs.timeSeriesAggregatedAlarms.etl(newAlarms, aggregatedAttrsZipped, null)
                    this.$refs.treeMapAggregatedAlarms.etl(newAlarms, aggregatedAttrsZipped, null)
                }
            },
            deep: true
        },
        alarmTypesFilter: {
            handler: function (newAlarmTypesFilter) {
                const anyNewAlarmTypesSelected = Object.values(newAlarmTypesFilter).includes(true)
                const aggregatedAttrsSelectedFlattened = AggregatedAlarmsUtils.flattenDictionary(this.aggregatedAttrsSelected)
                const isThereAnyCachedAlarmsResult = this.isThereAnyCachedAlarms(this.alarmsCurrent, aggregatedAttrsSelectedFlattened)
                if (!this.loadingVal && anyNewAlarmTypesSelected && !isThereAnyCachedAlarmsResult) {
                    this.etlAggregatedAlarmsDataModel(aggregatedAttrsSelectedFlattened)
                }
                if (!this.loadingVal && (!anyNewAlarmTypesSelected || !this.alarmsCurrent.length)) {
                    this.clearDataVizHandler()
                }
            },
            deep: true
        },
        alarmsSeveritiesFiltered: {
            handler: function (newAlarmSeveritiesFiltered) {
                if (newAlarmSeveritiesFiltered && newAlarmSeveritiesFiltered.length) {
                    const countAggregatedAttrsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    this.$refs.worldMapAggregatedAlarms.etl(newAlarmSeveritiesFiltered, countAggregatedAttrsSelected)
                    this.$refs.timeSeriesAggregatedAlarms.etl(newAlarmSeveritiesFiltered, aggregatedAttrsZipped, null)
                    this.$refs.treeMapAggregatedAlarms.etl(newAlarmSeveritiesFiltered, aggregatedAttrsZipped, null)
                }

                if (!newAlarmSeveritiesFiltered.length) {
                    this.clearDataVizHandler()
                }
            },
            deep: true
        },
        aggregatedAttrsSelected: {
            handler: function (newAggregatedAttrsSelected) {
                const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
                if (!this.loadingVal && anyAlarmTypesSelected && this.alarmsCurrent.length) {
                    const countAggregatedAttrsSelected = Object.keys(newAggregatedAttrsSelected.counts)
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(newAggregatedAttrsSelected)
                    this.$refs.worldMapAggregatedAlarms.etl(this.alarmsCurrent, countAggregatedAttrsSelected)
                    this.$refs.timeSeriesAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, null)
                    this.$refs.treeMapAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, null)
                }
            },
            deep: true
        },
        alarmsTimeFiltered: {
            handler: function (newAlarmsTimeFiltered) {
                if (!this.loadingVal && newAlarmsTimeFiltered && newAlarmsTimeFiltered.length) {
                    const countAggregatedAttrsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    this.$refs.worldMapAggregatedAlarms.etl(newAlarmsTimeFiltered, countAggregatedAttrsSelected)
                    this.$refs.timeSeriesAggregatedAlarms.etl(newAlarmsTimeFiltered, aggregatedAttrsZipped, null)
                    this.$refs.treeMapAggregatedAlarms.etl(newAlarmsTimeFiltered, aggregatedAttrsZipped, null)
                }
                if (newAlarmsTimeFiltered && !newAlarmsTimeFiltered.length) {
                    this.clearDataVizHandler()
                }
            },
            deep: true
        }
    },
    methods: {
        etlAggregatedAlarmsDataModel(aggregatedAttrsSelectedFlattend) {
            this.aggregatedAlarmsLoadingVal = true
            AggregatedAlarmsDataModel.etl(
                this.alarmsInfo.metadata.data_sources,
                this.dataSourcesSelected,
                aggregatedAttrsSelectedFlattend,
                this.hegemonyAlarms,
                this.networkDelayAlarms,
                this.thirdPartyAlarmsStates,
                this.timeFiltersCurrent.startTime,
                this.timeFiltersCurrent.endTime,
            ).then((alarms) => {
                this.alarms = alarms
                this.aggregatedAlarmsLoadingVal = false
                this.filterAlarmsBySeveritiesHandler()
            }).catch((error) => {
                console.error(error)
            })
        },

        countryClickedHandler(newCountryIsoCode3Clicked) {
            if (this.alarmsCurrent.length && newCountryIsoCode3Clicked) {
                const countryName = newCountryIsoCode3Clicked ? getCountryNameFromIsoCode3(newCountryIsoCode3Clicked) : null
                const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                this.$refs.timeSeriesAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, countryName)
                this.$refs.treeMapAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, countryName)
            }
        },

        filterAlarmsByTimeHandler(newDateTimeFilter) {
            if (this.alarmsCurrent.length) {
                const { startDateTime, endDateTime } = newDateTimeFilter
                if (startDateTime && endDateTime) {
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    const alarmsTimeFiltered = AggregatedAlarmsDataModel.filterAlarmsByTime(this.alarmsCurrent, startDateTime, endDateTime, aggregatedAttrsZipped)
                    this.alarmsTimeFiltered = alarmsTimeFiltered
                }
            }
        },

        filterAlarmsByPlotlyTimeHandler(newDateTimeFilter) {
            if (this.alarmsCurrent.length) {
                const { startDateTime, endDateTime } = newDateTimeFilter
                if (startDateTime && endDateTime) {
                    this.startDateTimePlotly = startDateTime
                    this.endDateTimePlotly = endDateTime
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    const alarmsTimeFiltered = AggregatedAlarmsDataModel.filterAlarmsByTime(this.alarmsCurrent, startDateTime, endDateTime, aggregatedAttrsZipped)
                    this.alarmsTimeFiltered = alarmsTimeFiltered
                }
            }
        },

        filterAlarmsBySeveritiesHandler(newSeveritiesSelected) {
            if (newSeveritiesSelected) {
                const anySeveritySelected = Object.values(newSeveritiesSelected).includes(true)
                if (anySeveritySelected) {
                    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    this.alarmsSeveritiesFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, this.severitiesSelected, aggregatedAttrsZipped)
                } else {
                    this.clearDataVizHandler()
                }
            }
        },

        resetTimeFlagHandler() {
            this.alarmsTimeFiltered = this.startDateTimePlotly = this.endDateTimePlotly = null;
            const alarmCountsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
            const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
            this.$refs.worldMapAggregatedAlarms.etl(this.alarms, alarmCountsSelected)
            this.$refs.timeSeriesAggregatedAlarms.etl(this.alarms, aggregatedAttrsZipped, null)
            this.$refs.treeMapAggregatedAlarms.etl(this.alarms, aggregatedAttrsZipped, null)
        },

        resetGranularityFlagHandler() {
            const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
            this.$refs.timeSeriesAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, null)
            this.$refs.treeMapAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, null)
        },

        clearDataVizHandler() {
            this.$refs.worldMapAggregatedAlarms.clearDataViz()
            this.$refs.timeSeriesAggregatedAlarms.clearDataViz()
            this.$refs.treeMapAggregatedAlarms.clearDataViz()
        },

        filterAlarmsByAlarmTypesHandler(newAlarmTypesFilter) {
            this.alarmTypesFilter = newAlarmTypesFilter
        },

        isThereAnyCachedAlarms(cachedAlarms, aggregatedAttrsSelected) {
            if (cachedAlarms.length) {
                const cachedAlarmsFirstElement = Object.values(cachedAlarms)[0]
                const dataContainsSelectedAlarmAttrs = AggregatedAlarmsUtils.isDictKeysSubset(aggregatedAttrsSelected, cachedAlarmsFirstElement)
                if (dataContainsSelectedAlarmAttrs) {
                    return true
                }
            }
            return false
        },

        isDataSourceSelected(dataSourceObj, alarmTypesFilter) {
            const alarmTypes = Object.keys(dataSourceObj.alarm_types)
            const isDataSourceSelected = alarmTypes.some((alarmType) => alarmTypesFilter[alarmType] === true)
            return isDataSourceSelected
        },
    }
}
</script>

<style lang="stylus" scoped>
.card-container {
    display: flex;
    justify-content: space-between;
  }
  
.card-wrapper {
    flex: 1;
    margin: 10px; /* Adjust the margin as needed */
}
</style>