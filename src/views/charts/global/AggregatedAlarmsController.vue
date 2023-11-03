<template>
  <div>
    <q-card class="IHR_charts-body">
      <q-card-section>
        <aggregated-alarm-filters :time-filters="timeFiltersCurrent" :data-sources="alarmsInfo" :loadingVal="loadingVal"
          :initial-group-by-keys="groupByKeys"
          @filter-alarms-by-ip-address-family="onFilterAlarmsByIpAddressFamily($event, ...getRefDatavizs)"
          @filter-alarms-by-time="onFilterAlarmsByTime($event, ...getRefDatavizs)"
          @filter-alarms-by-alarm-types="onFilterAlarmsByAlarmTypes"
          @filter-alarms-by-severities="onFilterAlarmsBySeverities($event, ...getRefDatavizs)"
          @reset-time="onResetTime(...getRefDatavizs)" @group-alarms-by-keys="onGroupAlarmsByKeys" />
      </q-card-section>
    </q-card>

    <q-card class="IHR_charts-body">
      <q-card-section>
        <world-map-aggregated-alarms :loadingVal="loadingVal" @worldmap-country-clicked="onCountryClickedHandler"
          ref="worldMapAggregatedAlarms" />
      </q-card-section>
    </q-card>

    <div class="card-container">
      <div class="card-wrapper">
        <q-card class="IHR_charts-body">
          <q-card-section>
            <time-series-aggregated-alarms :loadingVal="loadingVal" :time-filters="timeFiltersCurrent"
              :country-clicked="countryClicked" @filter-alarms-by-time="onFilterAlarmsByTime($event, ...getRefDatavizs)"
              @timeseries-legend-clicked="onTimeseriesLegendClicked($event, ...getRefDatavizs)"
              @reset-time="onResetTime(...getRefDatavizs)" @reset-granularity="onResetGranularity(...getRefDatavizs)"
              ref="timeSeriesAggregatedAlarms" />
          </q-card-section>
        </q-card>
      </div>
      <div class="card-wrapper">
        <q-card class="IHR_charts-body">
          <q-card-section>
            <tree-map-aggregated-alarms :loadingVal="loadingVal" :country-clicked="countryClicked"
              @treemap-node-clicked="onTreemapNodeClicked($event, ...getRefDatavizs)"
              @reset-granularity="onResetGranularity(...getRefDatavizs)" ref="treeMapAggregatedAlarms" />
          </q-card-section>
        </q-card>
      </div>
    </div>
    <div style="margin: 25px;">
      <aggregated-alarms-table-helper :countryClicked="countryClicked" :legendSelected="legendSelected.legend"
        :table-data-initial="tableDataInitial" :severitiesSelectedList="severitiesSelectedList" :loadingVal="loadingVal"
        :initial-table-alarm-type-selected="initialTableAlarmTypeSelected" :alarms="alarmsTableHelperData"
        :group-by-keys="groupByKeys" :alarm-type-titles-map="alarmTypeTitlesMap"
        :aggregated-attrs-selected="aggregatedAttrsSelected" :alarmsInfo="alarmsInfo" :time-filters="timeFiltersCurrent"
        :selected-alarm-types="alarmTypesFilter" @asn-country-key-clicked="onCountryClickedHandler"
        @asn-name-key-clicked="onASNameClicked" ref="tableAggregatedAlarmsHelper" />
    </div>
  </div>
</template>

<script>
import AggregatedAlarmsMixin from './AggregatedAlarmsMixin.vue'
import { ALARMS_INFO } from './AggregatedAlarmsMetadata'
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as AggregatedAlarmsDataModel from '@/models/AggregatedAlarmsDataModel'
import AggregatedAlarmFilters from './AggregatedAlarmFilters';
import WorldMapAggregatedAlarms from './WorldMapAggregatedAlarms'
import TimeSeriesAggregatedAlarms from './TimeSeriesAggregatedAlarms'
import TreeMapAggregatedAlarms from './TreeMapAggregatedAlarms'
import AggregatedAlarmsTableHelper from '../tables/AggregatedAlarmsTableHelper.vue'
import { Query, HegemonyAlarmsQuery, NetworkDelayAlarmsQuery } from '@/plugins/IhrApi'

const INITIAL_TABLE_ALARM_TYPE_SELECTED = 'hegemony'

export default {
  mixins: [AggregatedAlarmsMixin],
  components: {
    AggregatedAlarmFilters,
    WorldMapAggregatedAlarms,
    TimeSeriesAggregatedAlarms,
    TreeMapAggregatedAlarms,
    AggregatedAlarmsTableHelper
  },
  data() {
    return {
      alarms: null,
      alarmsInfo: ALARMS_INFO,
      alarmTypesFilter: {},
      groupByKeys: null,
      initialTableAlarmTypeSelected: INITIAL_TABLE_ALARM_TYPE_SELECTED,
      etlAlarmsLoadingVal: false,
      externalAlarms: { grip: null, ioda: null },
      ihrAlarms: {
        hegemony: {
          data: null,
          extract: this.extractHegemonyAlarms
        },
        network_delay: {
          data: null,
          extract: this.extractNetworkDelayAlarms
        },
        network_disconnection: {
          data: null
        }
      },
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
    networkDiscoAlarms: {
      type: Array,
      required: true
    },
    networkDiscoAlarmsLoading: {
      type: Boolean,
      required: true
    },
  },
  created() {
    const selectedGroupByKeysResult = {}
    for (const dataSourceKey in this.alarmsInfo) {
      const alarmTypes = this.alarmsInfo[dataSourceKey].alarm_types
      for (const alarmTypeKey in alarmTypes) {
        selectedGroupByKeysResult[alarmTypeKey] = alarmTypes[alarmTypeKey].metadata.default_key
      }
    }
    this.groupByKeys = selectedGroupByKeysResult
  },
  computed: {
    selectedIhrAlarmTypes() {
      const ihrAlarmTypes = Object.keys(this.alarmsInfo.ihr.alarm_types)
      const selectedIhrAlarmTypesList = Object.keys(this.alarmTypesFilter).filter((alarmTypeFilter) => ihrAlarmTypes.includes(alarmTypeFilter) && this.alarmTypesFilter[alarmTypeFilter])
      return selectedIhrAlarmTypesList
    },
    loadingVal() {
      return this.ihrAlarmsLoading || this.etlAlarmsLoadingVal
    },
    ihrAlarmsLoading() {
      return this.selectedIhrAlarmTypes.some((alarmType) => this.ihrAlarms[alarmType].data === null)
    },
    alarmsCurrent() {
      return this.alarmsAppliedFilters ? this.alarmsAppliedFilters : this.alarms
    },
    tableDataInitial() {
      const tableDataInitial = {}
      for (const data_source in this.alarmsInfo) {
        const alarmTypes = this.alarmsInfo[data_source].alarm_types
        for (const alarmType in alarmTypes) {
          tableDataInitial[alarmType] = {}
          tableDataInitial[alarmType].table_columns = alarmTypes[alarmType].metadata.table_columns
          tableDataInitial[alarmType].table_aggregated_columns = alarmTypes[alarmType].metadata.table_aggregated_columns
          tableDataInitial[alarmType].table_button_text = alarmTypes[alarmType].metadata.table_button_text
        }
      }
      return tableDataInitial
    },
    aggregatedAttrsSelected() {
      const aggregatedAttrsSelected = { counts: [], timebins: [], severities: [], ipAddressFamilies: [] }
      for (const dataSource in this.alarmsInfo) {
        const alarmTypes = this.alarmsInfo[dataSource].alarm_types
        for (const alarmType in alarmTypes) {
          if (this.alarmTypesFilter[alarmType]) {
            aggregatedAttrsSelected.counts.push(`${alarmType}_count`)
            aggregatedAttrsSelected.timebins.push(`${alarmType}_timebin`)
            aggregatedAttrsSelected.severities.push(`${alarmType}_severity`)
            aggregatedAttrsSelected.ipAddressFamilies.push(Object.values(alarmTypes[alarmType].metadata.group_by_key_options).map((groupByKey) => `${alarmType}_${groupByKey}_af`))
          }
        }
      }
      return aggregatedAttrsSelected
    },
    dataSourcesSelected() {
      const dataSourcesSelected = {}
      for (const dataSource in this.alarmsInfo) {
        dataSourcesSelected[dataSource] = this.isDataSourceSelected(this.alarmsInfo[dataSource], this.alarmTypesFilter)
      }
      return dataSourcesSelected
    },
    alarmTypeTitlesMap() {
      const alarmTypesToTitles = {}
      for (const dataSource in this.alarmsInfo) {
        const dataSourceAlarmTypes = this.alarmsInfo[dataSource].alarm_types
        for (const dataSourceAlarmTypeKey in dataSourceAlarmTypes) {
          const dataSourceAlarmTypeTitle = dataSourceAlarmTypes[dataSourceAlarmTypeKey].metadata.title
          alarmTypesToTitles[dataSourceAlarmTypeKey] = dataSourceAlarmTypeTitle
        }
      }
      return alarmTypesToTitles
    },
    timeFiltersCurrent() {
      let timeFilterCurrent = { startUnixTime: null, endUnixTime: null }
      const { startUnixTime, endUnixTime } = this.dateTimeFilter
      if (startUnixTime && endUnixTime) {
        timeFilterCurrent.startUnixTime = startUnixTime
        timeFilterCurrent.endUnixTime = endUnixTime
      } else {
        timeFilterCurrent.startUnixTime = Math.floor(this.startTime / 1000)
        timeFilterCurrent.endUnixTime = Math.floor(this.endTime / 1000)
      }
      return timeFilterCurrent
    },
    iodaIPAddressFamilies() {
      const result = {}
      const dataSources = this.alarmsInfo
      for (const dataSource in dataSources) {
        if (dataSource !== 'ioda') continue;
        const alarmTypes = dataSources[dataSource].alarm_types
        for (const alarmType in alarmTypes) {
          const ipAddressFamilies = alarmTypes[alarmType].metadata.ipAddressFamilies
          result[alarmType] = Object.entries(ipAddressFamilies).filter((val) => val[1]).map((val) => val[0])
        }
      }
      return result
    },
    aggregatedAttrsZipped() {
      return AggregatedAlarmsUtils.zipAggregatedAttrs(this.aggregatedAttrsSelected)
    },
    aggregatedAttrsCountsSelected() {
      return this.aggregatedAttrsSelected.counts
    },
    alarmsTableHelperData() {
      return this.alarmsCurrent ? this.alarmsCurrent : []
    },
    getRefDatavizs() {
      const worldMapRef = this.$refs.worldMapAggregatedAlarms
      const treeMapRef = this.$refs.treeMapAggregatedAlarms
      const timeSeriesRef = this.$refs.timeSeriesAggregatedAlarms
      const tableRef = this.$refs.tableAggregatedAlarmsHelper
      return [worldMapRef, treeMapRef, timeSeriesRef, tableRef]
    },
    hegemonyAlarmsFilters() {
      const hegemonyAlarmsFilter1 = new HegemonyAlarmsQuery()
        .deviation(20, Query.GTE)
        .timeInterval(this.startTime, this.endTime)
      const hegemonyAlarmsFilter2 = new HegemonyAlarmsQuery()
        .deviation(-20, Query.LTE)
        .timeInterval(this.startTime, this.endTime)
      return [hegemonyAlarmsFilter1, hegemonyAlarmsFilter2]
    },
    networkDelayAlarmsFilters() {
      const networkDelayAlarmsFilter = new NetworkDelayAlarmsQuery()
        .deviation(20, Query.GTE)
        .startPointType('AS')
        .timeInterval(this.startTime, this.endTime)
      return [networkDelayAlarmsFilter]
    },
    ihrAlarmsJoined() {
      const ihrAlarmsJoinedResult = Object.keys(this.ihrAlarms).flatMap((alarmType) => this.ihrAlarms[alarmType].data ? this.ihrAlarms[alarmType].data : [])
      return ihrAlarmsJoinedResult
    },
    networkDiscoAlarmsState() {
      return [this.networkDiscoAlarmsLoading, this.networkDiscoAlarms]
    },
    aggregatedAttrsIhrAlarmsLoading() {
      return [this.ihrAlarmsLoading, this.aggregatedAttrsSelected]
    }
  },
  watch: {
    networkDiscoAlarmsState: {
      handler: function (newNetworkDiscoAlarmsState) {
        const [isNetworkDiscoAlarmsLoading, networkDiscoAlarms] = newNetworkDiscoAlarmsState
        if (!isNetworkDiscoAlarmsLoading && networkDiscoAlarms !== null) {
          networkDiscoAlarms.forEach((alarm) => alarm.event_type = 'network_disconnection')
          this.ihrAlarms.network_disconnection.data = networkDiscoAlarms
        }
      },
      deep: true
    },
    alarms: {
      handler: function (newAlarms) {
        this.updateDataVizsWithFilters(...this.getRefDatavizs, newAlarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, false, true, true)
      },
      deep: true
    },
    aggregatedAttrsIhrAlarmsLoading: {
      handler: function (newAggregatedAttrsIhrAlarmsLoading) {
        const [ihrAlarmsLoading, newAggregatedAttrsSelected] = newAggregatedAttrsIhrAlarmsLoading
        const anyAlarmTypesSelected = Object.values(this.alarmTypesFilter).includes(true)
        if (!anyAlarmTypesSelected) return this.clearDataVizHandler()
        if (!ihrAlarmsLoading && !this.etlAlarmsLoadingVal) {
          const isThereAnyCachedAlarms = this.isThereAnyCachedAlarms(this.alarms, newAggregatedAttrsSelected)
          if (!this.alarms || !isThereAnyCachedAlarms) {
            this.etlAggregatedAlarmsDataModel(
              this.dataSourcesSelected,
              this.alarmsInfo,
              this.alarmTypesFilter,
              this.groupByKeys,
              this.ihrAlarmsJoined,
              this.externalAlarms,
              this.iodaIPAddressFamilies,
              this.timeFiltersCurrent.startUnixTime,
              this.timeFiltersCurrent.endUnixTime,
            )
          } else {
            this.updateDataVizsWithFilters(...this.getRefDatavizs, this.alarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, false, true, true)
          }
        }
      },
      deep: true
    },
    alarmTypesFilter: {
      handler: function (_) {
        for (const ihrAlarmType of this.selectedIhrAlarmTypes) {
          const ihrAlarmTypeVal = this.ihrAlarms[ihrAlarmType]
          if (ihrAlarmTypeVal.extract) ihrAlarmTypeVal.extract()
        }
      },
      deep: true,
    }
  },
  methods: {
    async extractHegemonyAlarms() {
      if (this.ihrAlarms.hegemony.data !== null) return
      const alarms = []
      for (const hegemonyAlarmsFilter of this.hegemonyAlarmsFilters) {
        await new Promise((resolve, reject) => {
          this.$ihr_api.hegemony_alarms(
            hegemonyAlarmsFilter,
            result => {
              alarms.push(...result.results)
              resolve()
            }, error => {
              reject(error)
            }
          )
        })
      }
      alarms.forEach((alarm) => alarm.event_type = 'hegemony')
      this.ihrAlarms.hegemony.data = alarms
    },
    async extractNetworkDelayAlarms() {
      if (this.ihrAlarms.network_delay.data !== null) return
      const alarms = []
      for (const networkDelayFilter of this.networkDelayAlarmsFilters) {
        await new Promise((resolve, reject) => {
          this.$ihr_api.network_delay_alarms(
            networkDelayFilter,
            result => {
              alarms.push(...result.results)
              resolve()
            }, error => {
              reject(error)
            }
          )
        })
      }
      alarms.forEach((alarm) => alarm.event_type = 'network_delay')
      this.ihrAlarms.network_delay.data = alarms
    },
    etlAggregatedAlarmsDataModel(dataSourcesSelected, dataSourcesColumns, alarmTypesFilter, groupByKeys, ihrAlarms, externalAlarms, iodaIPAddressFamilies, startUnixTime, endUnixTime) {
      this.etlAlarmsLoadingVal = true
      AggregatedAlarmsDataModel.etl(dataSourcesSelected, dataSourcesColumns, alarmTypesFilter, groupByKeys, ihrAlarms, externalAlarms, iodaIPAddressFamilies, startUnixTime, endUnixTime)
        .then((alarms) => {
          this.alarms = alarms
          this.etlAlarmsLoadingVal = false
        }).catch((error) => {
          console.error(error)
        })
    },
    onGroupAlarmsByKeys(newGroupByKeys) {
      const anyNewGroupByKeys = JSON.stringify(newGroupByKeys) !== JSON.stringify(this.groupByKeys)
      if (!this.loadingVal && this.alarms && anyNewGroupByKeys) {
        this.groupByKeys = AggregatedAlarmsUtils.deepCopy(newGroupByKeys)
        this.etlAggregatedAlarmsDataModel(
          this.dataSourcesSelected,
          this.alarmsInfo,
          this.alarmTypesFilter,
          newGroupByKeys,
          this.ihrAlarmsJoined,
          this.externalAlarms,
          this.iodaIPAddressFamilies,
          this.timeFiltersCurrent.startUnixTime,
          this.timeFiltersCurrent.endUnixTime,
        )
      }
    },
    onCountryClickedHandler(newCountryClicked) {
      window.scrollTo({ top: 1000, behavior: 'smooth', passive: true });
      this.onCountryClicked(newCountryClicked, ...this.getRefDatavizs)
    },
    onFilterAlarmsByAlarmTypes(newAlarmTypesFilter) {
      this.alarmTypesFilter = newAlarmTypesFilter
    },
    onASNameClicked(newASNKeyClicked) {
      if (this.legendSelected.legend !== newASNKeyClicked) {
        this.legendSelected.legend = newASNKeyClicked
        this.legendSelected.opacity = 1
      } else {
        this.legendSelected.legend = null
        this.legendSelected.opacity = 0.5
      }
      this.updateDataVizs(...this.getRefDatavizs, this.alarmsCurrent, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, false, true, true)
    },
    isThereAnyCachedAlarms(cachedAlarms, aggregatedAttrsSelected) {
      if (cachedAlarms && cachedAlarms.length) {
        const isAggregatedAttrsSubset = Object.keys(aggregatedAttrsSelected)
          .flatMap((attr) => aggregatedAttrsSelected[attr])
          .flatMap((attr) => attr)
          .every((subsetAttr) => Object.keys(cachedAlarms[0]).includes(subsetAttr))
        return isAggregatedAttrsSubset
      } else {
        return false;
      }
    },
    isDataSourceSelected(dataSourceObj, alarmTypesFilter) {
      const alarmTypes = Object.keys(dataSourceObj.alarm_types)
      const isDataSourceSelected = alarmTypes.some((alarmType) => alarmTypesFilter[alarmType] === true)
      return isDataSourceSelected
    },
    clearDataVizHandler() {
      this.$refs.worldMapAggregatedAlarms.clearDataViz()
      this.$refs.treeMapAggregatedAlarms.clearDataViz()
      this.$refs.timeSeriesAggregatedAlarms.clearDataViz()
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
    margin: 10px;
}
</style>
