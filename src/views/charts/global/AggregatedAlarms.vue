<template>
    <div>
        <q-card class="IHR_charts-body">
            <q-card-section>
                <aggregated-alarm-filters-overview :start-time="startTime" :end-time="endTime" :alarms="aggregatedAlarms"
                    @filter-alarms-by-time="dateTimeFilter = $event" @reset-time="resetTimeFlag = !resetTimeFlag"
                    @reset-granularity="resetGranularityFlag = !resetGranularityFlag"
                    @filter-alarms-by-alarm-types="alarmTypesFilter = $event"
                    @filter-alarms-by-data-sources="alarmDataSourcesFilter = $event" />
            </q-card-section>
        </q-card>

        <q-card class="IHR_charts-body">
            <q-card-section>
                <aggregated-alarms-world-map :start-time="startTime" :end-time="endTime" @loading="loadingVal = $event"
                    :dateTimeFilter="dateTimeFilter" :resetTimeFlag="resetTimeFlag" :alarmTypesFilter="alarmTypesFilter"
                    :alarmDataSourcesFilter="alarmDataSourcesFilter" :loadingVal="loadingVal"
                    :extracted-alarms="extractedAlarms" @aggregated-alarms-data-loaded="aggregatedAlarms = $event"
                    @country-click="countryClicked = $event" :severity="SEVERITY_THRESHOLDS.HIGH"
                    :clearWorldMap="clearWorldMap" :ihr-aggregated-attrs="IHR_AGGREGATED_ATTRS"
                    :grip-aggregated-attrs="GRIP_AGGREGATED_ATTRS" ref="aggregatedAlarmsWorldMap" />
            </q-card-section>
        </q-card>

        <div class="card-container">
            <div class="card-wrapper">
                <q-card class="IHR_charts-body">
                    <q-card-section>
                        <aggregated-alarms-time-series :aggregatedAlarms="aggregatedAlarms" :loadingVal="loadingVal"
                            :countryClicked="countryClicked" :key="aggregatedAlarmsTimeSeriesKey"
                            :resetGranularityFlag="resetGranularityFlag" @time-series-reset="countryClicked = null"
                            @loading="loadingVal = $event" :alarmTypesFilter="alarmTypesFilter"
                            ref="aggregatedAlarmsTimeSeries" />
                    </q-card-section>
                </q-card>
            </div>
            <div class="card-wrapper">
                <q-card class="IHR_charts-body">
                    <q-card-section>
                        <aggregated-alarms-tree-map :aggregatedAlarms="aggregatedAlarms" :key="aggregatedAlarmsTreeMapKey"
                            :loadingVal="loadingVal" :alarmTypesFilter="alarmTypesFilter"
                            :countryClicked="countryClicked" ref="aggregatedAlarmsTreeMap"/>
                    </q-card-section>
                </q-card>
            </div>
        </div>
    </div>
</template>
  
<script>
import AggregatedAlarmFiltersOverview from './AggregatedAlarmFiltersOverview.vue';
import AggregatedAlarmsWorldMap from './AggregatedAlarmsWorldMap'
import AggregatedAlarmsTimeSeries from './AggregatedAlarmsTimeSeries'
import AggregatedAlarmsTreeMap from './AggregatedAlarmsTreeMap.vue'
import * as AggregatedAlarsmDataModel from '@/models/AggregatedAlarmsDataModel.js'



const SEVERITY_THRESHOLDS = {
    LOW: 0,
    MID: 21,
    HIGH: 80,
}

const HEGMEMONY_AGGREGATED_ATTRS = {
    hegemony_alarm_counts: [],
    hegemony_alarm_timebins: [],
    hegemony_alarm_severities: [],
}

const NETWORK_DELAY_AGGREGATED_ATTRS = {
    network_delay_alarm_counts: [],
    network_delay_alarm_timebins: [],
    network_delay_alarm_severities: [],
}

const IHR_AGGREGATED_ATTRS = {
    HEGEMONY: { ...HEGMEMONY_AGGREGATED_ATTRS },
    NETWORK_DELAY: { ...NETWORK_DELAY_AGGREGATED_ATTRS },
}

const GRIP_AGGREGATED_ATTRS = {
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
}

export default {
    components: {
        AggregatedAlarmFiltersOverview,
        AggregatedAlarmsWorldMap,
        AggregatedAlarmsTimeSeries,
        AggregatedAlarmsTreeMap,
    },
    data() {
        return {
            extractedAlarms: {},
            aggregatedAlarms: [],
            loadingVal: true,
            countryClicked: null,
            resetTimeFlag: false,
            resetGranularityFlag: false,
            clearWorldMap: false,
            alarmTypesFilter: {},
            alarmDataSourcesFilter: {},
            dateTimeFilter: {
                startDateTime: null,
                endDateTime: null,
            },
            gripAlarmsState: { downloading: false, data: null },
            SEVERITY_THRESHOLDS: SEVERITY_THRESHOLDS,
            IHR_AGGREGATED_ATTRS: IHR_AGGREGATED_ATTRS,
            GRIP_AGGREGATED_ATTRS: GRIP_AGGREGATED_ATTRS,
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
        },

    },

    computed: {
        aggregatedAlarmsTimeSeriesKey() {
            return `${JSON.stringify(this.aggregatedAlarms)}-${JSON.stringify(this.countryClicked)}`
        },
        aggregatedAlarmsTreeMapKey() {
            return `${JSON.stringify(this.aggregatedAlarms)}-${JSON.stringify(this.countryClicked)}`
        },
    },

    watch: {
        alarmDataSourcesFilter: {
            handler: function (newDataSources) {
                const anyNewDataSourcesSelected = Object.values(newDataSources).includes(true)
                if (!this.hegemonyLoading && !this.networkDelayLoading && anyNewDataSourcesSelected) {
                    this.extractAlarmsHelper()
                }

                if (!anyNewDataSourcesSelected) {
                    this.clearWorldMap = true
                    this.aggregatedAlarms = []
                }
            },
            deep: true
        },
        alarmTypesFilter: {
            handler: function () {
                this.$refs.aggregatedAlarmsTimeSeries.countryClickedHandler(this.countryClicked)
                this.$refs.aggregatedAlarmsTreeMap.countryClickedHandler(this.countryClicked)
            },
            deep: true
        },
    },
    methods: {
        extractAlarmsHelper() {
            this.loadingVal = true
            AggregatedAlarsmDataModel.extractAlarms(
                this.alarmDataSourcesFilter,
                this.alarmTypesFilter,
                this.hegemonyAlarms,
                this.networkDelayAlarms,
                this.gripAlarmsState,
                this.startTime,
                this.endTime,
                SEVERITY_THRESHOLDS.HIGH
            ).then((extractedAlarms) => {
                this.extractedAlarms = extractedAlarms
                this.loadingVal = false
            }).catch((error) => {
                console.log(error)
            })
        },
    },
};
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