<template>
    <div>
        <q-card class="IHR_charts-body">
            <q-card-section>
                <aggregated-alarm-filters :start-time="timeFiltersCurrent.startTime" :end-time="timeFiltersCurrent.endTime"
                    :alarmsInfo="alarmsInfo" :loadingVal="loadingVal" @filter-alarms-by-time="filterAlarmsByTimeHandler"
                    @reset-time="resetTimeFlagHandler" @reset-granularity="resetGranularityFlagHandler"
                    @filter-alarms-by-alarm-types="filterAlarmsByAlarmTypesHandler" />
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
import { deepCopy, isDictSubset, flattenDictionary, filterDictByPrefixes, zipAggregatedAttrs } from '@/plugins/AggregatedAlarmsUtils'
import { getCountryNameFromIsoCode3 } from '@/plugins/countryISOCode3'
import * as AggregatedAlarmsDataModel from '@/models/AggregatedAlarmsDataModel'
import AggregatedAlarmFilters from './AggregatedAlarmFilters';
import WorldMapAggregatedAlarms from './WorldMapAggregatedAlarms'
import TimeSeriesAggregatedAlarms from './TimeSeriesAggregatedAlarms'
import TreeMapAggregatedAlarms from './TreeMapAggregatedAlarms'


const SEVERITY_THRESHOLDS = {
    LOW: 0,
    MID: 21,
    HIGH: 80,
}

const ALARMS_INFO = {
    data_sources: {
        ihr: {
            hegemony_alarm_counts: [],
            hegemony_alarm_timebins: [],
            hegemony_alarm_severities: [],
            network_delay_alarm_counts: [],
            network_delay_alarm_timebins: [],
            network_delay_alarm_severities: [],
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
                        description: 'HEGEMONY Alarm Type',
                    },
                    network_delay: {
                        description: 'NETWORK_DELAY Alarm Type',
                    },
                },
                description: 'IHR Data Source'
            },
            grip: {
                alarm_types: {
                    moas: {
                        description: 'MOAS Alarm Type',
                    },
                    submoas: {
                        description: 'SUBMOAS Alarm Type',
                    },
                    defcon: {
                        description: 'DEFCON Alarm Type',
                    },
                    edges: {
                        description: 'EDGES Alarm Type',
                    },
                },
                description: 'GRIP Data Source'
            },
            ioda: {
                alarm_types: {
                    ping_slash24: {
                        description: 'PING_SLASH24 Alarm Type',
                    },
                    bgp: {
                        description: 'BGP Alarm Type',
                    },
                    ucsd_nt: {
                        description: 'UCSD_NT Alarm Type',
                    },
                },
                description: 'IODA Data Source'
            },
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
                ioda: { downloading: false, data: null },
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

            const allAggergatedAttrs = flattenDictionary(Object.values(ALARMS_INFO.data_sources))
            const aggregatedAttrsFiltered = filterDictByPrefixes(allAggergatedAttrs, alarmTypesSelected)

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
        alarmsCurrent() {
            return this.alarmsTimeFiltered ? this.alarmsTimeFiltered : this.alarms
        }
    },

    watch: {
        alarms: {
            handler: function (newAlarms) {
                const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
                if (!this.loadingVal && anyAlarmTypesSelected && this.alarmsCurrent.length) {
                    const countAggregatedAttrsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
                    const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
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
                const aggregatedAttrsSelectedFlattened = flattenDictionary(this.aggregatedAttrsSelected)
                const isThereAnyCachedAlarms = this.getCachedAlarmsIfExist(this.alarmsCurrent, aggregatedAttrsSelectedFlattened)
                if (!this.loadingVal && anyNewAlarmTypesSelected && !isThereAnyCachedAlarms) {
                    this.etlAggregatedAlarmsDataModel(aggregatedAttrsSelectedFlattened)
                }
                if (!this.loadingVal || !anyNewAlarmTypesSelected || !this.alarmsCurrent.length) {
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
                    const aggregatedAttrsZipped = zipAggregatedAttrs(newAggregatedAttrsSelected)
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
                    const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
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
                this.alarmTypesFilter,
                aggregatedAttrsSelectedFlattend,
                this.hegemonyAlarms,
                this.networkDelayAlarms,
                this.thirdPartyAlarmsStates,
                this.timeFiltersCurrent.startTime,
                this.timeFiltersCurrent.endTime,
            ).then((alarms) => {
                this.alarms = alarms
                this.aggregatedAlarmsLoadingVal = false
            }).catch((error) => {
                console.log(error)
            })
        },

        countryClickedHandler(newCountryIsoCode3Clicked) {
            if (this.alarmsCurrent.length && newCountryIsoCode3Clicked) {
                const countryName = newCountryIsoCode3Clicked ? getCountryNameFromIsoCode3(newCountryIsoCode3Clicked) : null
                const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
                this.$refs.timeSeriesAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, countryName)
                this.$refs.treeMapAggregatedAlarms.etl(this.alarmsCurrent, aggregatedAttrsZipped, countryName)
            }
        },

        filterAlarmsByTimeHandler(newDateTimeFilter) {
            if (this.alarmsCurrent.length) {
                const { startDateTime, endDateTime } = newDateTimeFilter
                if (startDateTime && endDateTime) {
                    const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
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
                    const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
                    const alarmsTimeFiltered = AggregatedAlarmsDataModel.filterAlarmsByTime(this.alarmsCurrent, startDateTime, endDateTime, aggregatedAttrsZipped)
                    this.alarmsTimeFiltered = alarmsTimeFiltered
                }
            }
        },

        resetTimeFlagHandler() {
            this.alarmsTimeFiltered = this.startDateTimePlotly = this.endDateTimePlotly = null;
            const alarmCountsSelected = Object.keys(this.aggregatedAttrsSelected.counts)
            const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
            this.$refs.worldMapAggregatedAlarms.etl(this.alarms, alarmCountsSelected)
            this.$refs.timeSeriesAggregatedAlarms.etl(this.alarms, aggregatedAttrsZipped, null)
            this.$refs.treeMapAggregatedAlarms.etl(this.alarms, aggregatedAttrsZipped, null)
        },

        resetGranularityFlagHandler() {
            const aggregatedAttrsZipped = zipAggregatedAttrs(this.aggregatedAttrsSelected)
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

        getCachedAlarmsIfExist(cachedAlarms, aggregatedAttrsSelected) {
            if (cachedAlarms.length) {
                const cachedAlarmsFirstElement = Object.values(cachedAlarms)[0]
                const dataContainsSelectedAlarmAttrs = isDictSubset(aggregatedAttrsSelected, cachedAlarmsFirstElement)
                if (dataContainsSelectedAlarmAttrs) {
                    return deepCopy(cachedAlarms)
                }
            }
            return null
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