<script>
import * as AggregatedAlarmsDataModel from '@/models/AggregatedAlarmsDataModel'

export default {
  data() {
    return {
      alarmsAppliedFilters: null,
      countryClicked: null,
      ipAddressFamilySelectedList: ['4', '6'],
      severitiesSelectedList: ['low', 'medium', 'high'],
      legendSelected: { legend: null, opacity: null },
      dateTimeFilter: { startUnixTime: null, endUnixTime: null },
    }
  },
  methods: {
    updateDataVizsWithFilters(worldMapRef, treeMapRef, timeSeriesRef, tableRef, alarms, aggregatedAttrsZipped, aggregatedAttrsCountsSelected, countryNameClicked, alarmTypeTitlesMap, legend, severitiesSelectedList, ipAddressFamilySelectedList, timeFilters, isASGranularity, renderTimeSeries = true, renderTreeMap = true) {
      const alarmsTimeFiltered = AggregatedAlarmsDataModel.filterAlarmsByTime(alarms, timeFilters.startUnixTime, timeFilters.endUnixTime, aggregatedAttrsZipped)
      const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarmsTimeFiltered, severitiesSelectedList, aggregatedAttrsZipped)
      const alarmsIpAddressFamilyFiltered = AggregatedAlarmsDataModel.filterAlarmsByIpAddressFamily(alarmsSeverityFiltered, ipAddressFamilySelectedList, aggregatedAttrsZipped)
      this.alarmsAppliedFilters = alarmsIpAddressFamilyFiltered
      this.updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, alarmsIpAddressFamilyFiltered, aggregatedAttrsZipped, aggregatedAttrsCountsSelected, countryNameClicked, alarmTypeTitlesMap, legend, severitiesSelectedList, isASGranularity, renderTreeMap, renderTimeSeries)
    },
    updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, alarms, aggregatedAttrsZipped, aggregatedAttrsCounts, countryNameClicked, alarmTypeTitlesMap, legend, severitiesSelectedList, isASGranularity, renderTreeMap, renderTimeSeries) {
      worldMapRef.etl(alarms, aggregatedAttrsCounts, alarmTypeTitlesMap)
      treeMapRef.etl(alarms, aggregatedAttrsZipped, countryNameClicked, alarmTypeTitlesMap, legend, severitiesSelectedList, isASGranularity, renderTreeMap)
      timeSeriesRef.etl(alarms, aggregatedAttrsZipped, countryNameClicked, alarmTypeTitlesMap, legend, isASGranularity, renderTimeSeries)
      if (tableRef) tableRef.etl(alarms, countryNameClicked, legend, severitiesSelectedList)
    },
    onFilterAlarmsByTime(newDateTimeFilter, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      const startUnixTime = Math.floor(Date.parse(newDateTimeFilter.startDateTime) / 1000)
      const endUnixTime = Math.floor(Date.parse(newDateTimeFilter.endDateTime) / 1000)
      this.dateTimeFilter.startUnixTime = startUnixTime
      this.dateTimeFilter.endUnixTime = endUnixTime
      this.updateDataVizsWithFilters(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, isASGranularity, true, true)
    },
    onFilterAlarmsBySeverities(newSeveritiesSelectedList, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      this.legendSelected.legend = this.legendSelected.opacity = null
      this.severitiesSelectedList = newSeveritiesSelectedList
      this.updateDataVizsWithFilters(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, isASGranularity, true, true)
    },
    onFilterAlarmsByIpAddressFamily(newIpAddressFamilySelectedList, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      this.legendSelected.legend = this.legendSelected.opacity = null
      this.ipAddressFamilySelectedList = newIpAddressFamilySelectedList
      this.updateDataVizsWithFilters(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, isASGranularity, true, true)
    },
    onResetTime(worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      this.dateTimeFilter.startUnixTime = this.dateTimeFilter.endUnixTime = this.legendSelected.legend = this.legendSelected.opacity = null
      this.updateDataVizsWithFilters(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarms, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, this.ipAddressFamilySelectedList, this.timeFiltersCurrent, isASGranularity, true, true)
    },
    onResetGranularity(worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      this.countryClicked = this.legendSelected.legend = this.legendSelected.opacity = null
      this.updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarmsCurrent, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, isASGranularity, true, true)
    },
    onCountryClicked(newCountryClicked, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      this.legendSelected.legend = this.legendSelected.opacity = null
      this.countryClicked = newCountryClicked
      this.updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarmsCurrent, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, isASGranularity, true, true)
    },
    onTimeseriesLegendClicked(newLegend, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      if (newLegend.opacity < 1) {
        this.legendSelected = newLegend
      } else {
        if (this.legendSelected.legend === newLegend.legend) {
          this.legendSelected.legend = null
          this.legendSelected.opacity = 0.5
        }
      }
      this.updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarmsCurrent, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, isASGranularity, true, false)
    },
    onTreemapNodeClicked(newNodeClickedLabel, worldMapRef, treeMapRef, timeSeriesRef, tableRef, isASGranularity = false) {
      if (this.legendSelected.legend !== newNodeClickedLabel) {
        this.legendSelected.legend = newNodeClickedLabel
        this.legendSelected.opacity = 1
      } else {
        this.legendSelected.legend = null
        this.legendSelected.opacity = 0.5
      }
      this.updateDataVizs(worldMapRef, treeMapRef, timeSeriesRef, tableRef, this.alarmsCurrent, this.aggregatedAttrsZipped, this.aggregatedAttrsCountsSelected, this.countryClicked, this.alarmTypeTitlesMap, this.legendSelected.legend, this.severitiesSelectedList, isASGranularity, false, true)
    }
  }
}
</script>
