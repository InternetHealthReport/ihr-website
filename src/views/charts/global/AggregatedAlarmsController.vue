<template>
  <div>
    <q-card class="IHR_charts-body">
      <q-card-section>
        <aggregated-alarm-filters :start-time="timeFiltersCurrent.startDateTime"
          :end-time="timeFiltersCurrent.endDateTime" :alarms-metadata="alarmsInfo.metadata" :loadingVal="loadingVal"
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
            <time-series-aggregated-alarms :loadingVal="loadingVal" @filter-alarms-by-time="filterAlarmsByTimeHandler"
              ref="timeSeriesAggregatedAlarms" />
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
            title: 'AS Dependency',
            description: 'Routing changes found in AS Dependency data (a.k.a. AS Hegemony).',
            showHelpModal: false
          },
          network_delay: {
            title: 'Network Delay',
            description: 'Network delay changes observed in traceroute data.',
            showHelpModal: false
          }
        },
        title: 'IHR',
        description: 'Alarms reported by IHR.',
        showHelpModal: false
      },
      grip: {
        alarm_types: {
          moas: {
            title: 'MOAS',
            description: 'Multi Origin-AS. Prefixes concurently announced in BGP by multiple ASes.',
            showHelpModal: false
          },
          submoas: {
            title: 'Sub-MOAS',
            description: 'Sub-prefix MOAS. Sup-prefix announced by a different origin AS.',
            showHelpModal: false
          },
          defcon: {
            title: 'DEFCON',
            description: 'Hijack using a more specific prefix on an existing AS path.',
            showHelpModal: false
          },
          edges: {
            title: 'Fake Path',
            description: 'Hijack using forged AS paths to legitimate origin AS. (a.k.a. Edges)',
            showHelpModal: false
          },
        },
        title: 'GRIP',
        description: "BGP hijacks reported by Georgia Tech's GRIP platform.",
        showHelpModal: false
      },
      ioda: {
        alarm_types: {
          ping_slash24: {
            title: 'Ping',
            description: 'Data plane outages detected in ping data.',
            showHelpModal: false
          },
          bgp: {
            title: 'BGP',
            description: 'Routing outages detected in BGP data.',
            showHelpModal: false
          },
          ucsd_nt: {
            title: 'UCSD Telescope',
            description: 'Outages detected with the UCSD network telescope.',
            showHelpModal: false
          },
        },
        title: 'IODA',
        description: "Internet outages reported by Georgia Tech's IODA platform",
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
      countryNameClicked: null,
      alarmTypesFilter: {},
      severitiesSelectedList: [],
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
    alarmTypeTitlesMap() {
      const alarmTypesToTitles = {}
      const { data_sources: dataSources } = ALARMS_INFO.metadata
      for (const dataSource in dataSources) {
        const dataSourceAlarmTypes = dataSources[dataSource].alarm_types
        for (const dataSourceAlarmTypeKey in dataSourceAlarmTypes) {
          const dataSourceAlarmTypeTitle = dataSourceAlarmTypes[dataSourceAlarmTypeKey].title
          alarmTypesToTitles[dataSourceAlarmTypeKey] = dataSourceAlarmTypeTitle
        }
      }
      return alarmTypesToTitles
    },
    alarmsCurrent() {
      const currentTimedAlarms = this.alarmsTimeFiltered ? this.alarmsTimeFiltered : this.alarms
      return currentTimedAlarms
    },
    timeFiltersCurrent() {
      const startTime = this.startDateTimePlotly ? new Date(this.startDateTimePlotly) : this.startTime
      const endTime = this.endDateTimePlotly ? new Date(this.endDateTimePlotly) : this.endTime
      const dateTimeFilter = { startDateTime: startTime, endDateTime: endTime }
      return dateTimeFilter
    },
  },
  watch: {
    alarms: {
      handler: function (newAlarms) {
        const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
        if (!this.loadingVal && anyAlarmTypesSelected && newAlarms.length) {
          const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
          const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(newAlarms, this.severitiesSelectedList, aggregatedAttrsZipped)
          this.updateDataVizs(alarmsSeverityFiltered)
        }
        if (newAlarms && !newAlarms.length) {
          this.clearDataVizHandler()
        }
      },
      deep: true
    },
    alarmsTimeFiltered: {
      handler: function (newAlarmsTimeFiltered) {
        if (!this.loadingVal && newAlarmsTimeFiltered && newAlarmsTimeFiltered.length) {
          const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
          const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(newAlarmsTimeFiltered, this.severitiesSelectedList, aggregatedAttrsZipped)
          this.updateDataVizs(alarmsSeverityFiltered)
        }
        if (newAlarmsTimeFiltered && !newAlarmsTimeFiltered.length) {
          this.clearDataVizHandler()
        }
      },
      deep: true
    },
    alarmsSeveritiesFiltered: {
      handler: function (newAlarmSeveritiesFiltered) {
        if (newAlarmSeveritiesFiltered && newAlarmSeveritiesFiltered.length) {
          this.updateDataVizs(newAlarmSeveritiesFiltered)
        }
        if (!newAlarmSeveritiesFiltered.length) {
          this.clearDataVizHandler()
        }
      },
      deep: true
    },
    aggregatedAttrsSelected: {
      handler: function (newAggregatedAttrsSelected) {
        if (this.alarmsCurrent.length) {
          const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
          const aggregatedAttrsSelectedFlattened = AggregatedAlarmsUtils.flattenDictionary(this.aggregatedAttrsSelected)
          const isDataContainsAllSelectedAggregatedAttrs = AggregatedAlarmsUtils.isDictKeysSubset(aggregatedAttrsSelectedFlattened, this.alarmsCurrent[0])
          if (!this.loadingVal && anyAlarmTypesSelected && isDataContainsAllSelectedAggregatedAttrs) {
            const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(newAggregatedAttrsSelected)
            const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, this.severitiesSelectedList, aggregatedAttrsZipped)
            this.updateDataVizs(alarmsSeverityFiltered, newAggregatedAttrsSelected)
          }
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
          this.alarmsTimeFiltered = this.startDateTimePlotly = this.endDateTimePlotly = null;
          this.etlAggregatedAlarmsDataModel(aggregatedAttrsSelectedFlattened)
        }
        if (!this.loadingVal && (!anyNewAlarmTypesSelected || !this.alarmsCurrent.length)) {
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
        this.timeFiltersCurrent.startDateTime,
        this.timeFiltersCurrent.endDateTime,
      ).then((alarms) => {
        this.alarms = alarms
        this.aggregatedAlarmsLoadingVal = false
      }).catch((error) => {
        console.error(error)
      })
    },

    countryClickedHandler(newCountryIsoCode3Clicked) {
      if (this.alarmsCurrent.length && newCountryIsoCode3Clicked) {
        const countryName = newCountryIsoCode3Clicked ? getCountryNameFromIsoCode3(newCountryIsoCode3Clicked) : null
        const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
        const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, this.severitiesSelectedList, aggregatedAttrsZipped)
        this.$refs.timeSeriesAggregatedAlarms.etl(alarmsSeverityFiltered, aggregatedAttrsZipped, countryName, this.alarmTypeTitlesMap)
        this.$refs.treeMapAggregatedAlarms.etl(alarmsSeverityFiltered, aggregatedAttrsZipped, countryName, this.alarmTypeTitlesMap)
        this.countryNameClicked = countryName
      }
    },

    filterAlarmsByTimeHandler(newDateTimeFilter) {
      if (this.alarmsCurrent.length) {
        const { startDateTime, endDateTime } = newDateTimeFilter
        if (startDateTime && endDateTime) {
          this.startDateTimePlotly = startDateTime
          this.endDateTimePlotly = endDateTime
          const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
          const alarmsTimeFiltered = AggregatedAlarmsDataModel.filterAlarmsByTime(this.alarmsCurrent, this.timeFiltersCurrent.startDateTime, this.timeFiltersCurrent.endDateTime, aggregatedAttrsZipped)
          this.alarmsTimeFiltered = alarmsTimeFiltered
        }
      }
    },

    filterAlarmsBySeveritiesHandler(newSeveritiesSelectedList) {
      this.severitiesSelectedList = newSeveritiesSelectedList
      if (this.severitiesSelectedList.length) {
        const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
        this.alarmsSeveritiesFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, newSeveritiesSelectedList, aggregatedAttrsZipped)
      } else {
        this.clearDataVizHandler()
      }
    },

    resetTimeFlagHandler() {
      this.alarmsTimeFiltered = this.startDateTimePlotly = this.endDateTimePlotly = null;
      const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
      const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, this.severitiesSelectedList, aggregatedAttrsZipped)
      this.updateDataVizs(alarmsSeverityFiltered)
    },

    updateDataVizs(alarms, aggregatedAttrsSelected = this.aggregatedAttrsSelected) {
      const countAggregatedAttrsSelected = Object.keys(aggregatedAttrsSelected.counts)
      const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
      this.$refs.worldMapAggregatedAlarms.etl(alarms, countAggregatedAttrsSelected, this.alarmTypeTitlesMap)
      this.$refs.timeSeriesAggregatedAlarms.etl(alarms, aggregatedAttrsZipped, this.countryNameClicked, this.alarmTypeTitlesMap)
      this.$refs.treeMapAggregatedAlarms.etl(alarms, aggregatedAttrsZipped, this.countryNameClicked, this.alarmTypeTitlesMap)
    },

    resetGranularityFlagHandler() {
      this.countryNameClicked = null
      const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
      const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(this.alarmsCurrent, this.severitiesSelectedList, aggregatedAttrsZipped)
      this.$refs.timeSeriesAggregatedAlarms.etl(alarmsSeverityFiltered, aggregatedAttrsZipped, this.countryNameClicked, this.alarmTypeTitlesMap)
      this.$refs.treeMapAggregatedAlarms.etl(alarmsSeverityFiltered, aggregatedAttrsZipped, this.countryNameClicked, this.alarmTypeTitlesMap)
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
        const dataContainsSelectedAlarmAttrs = AggregatedAlarmsUtils.isDictKeysSubset(aggregatedAttrsSelected, cachedAlarms[0])
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