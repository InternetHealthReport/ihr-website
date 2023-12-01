<template>
    <q-table ref="table" table-class="myClass" :data="alarmsTableValues" :columns="allColumns" :pagination.sync="pagination"
        :loading="loading" :filter="filter" binary-state-sort flat loading-label="Loading Alarms ..." :row-key="rowKey">
        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td v-for="(column) in columns" :key="column.name">
                    <div v-if="column.name.endsWith('overview')" :key="`${rowKey}.${column.name}`"
                        :style="{ 'text-align': column.align }">
                        <label class="toggle">
                            <input class="toggle-checkbox" type="checkbox"
                                v-model="tableAlarms[props.row.key_normalized][column.name]"
                                @click="unToggleOtherSwitchesInRow(props.row.key_normalized, column.name)">
                            <div class="toggle-switch"></div>
                        </label>
                    </div>
                    <div v-else-if="column.name === rowKey" :style="{ 'text-align': column.align }">
                        <a @click="onASKeyClicked(props.row.key_normalized, thisWindow, $options)"
                            href="javascript:void(0)">
                            {{ column.format(props.row[column.name], props.row) }}
                        </a>
                    </div>

                    <div v-else-if="column.name === `${rowKey}_name`" :style="{ 'text-align': column.align }">
                        <a @click="onASNameKeyClicked(props.row.key_name_truncated, props.row[`${rowKey}_country`])"
                            href="javascript:void(0)">
                            {{ column.format(props.row[column.name], props.row) }}
                        </a>
                    </div>

                    <div v-else-if="column.name === `${rowKey}_country`" :style="{ 'text-align': column.align }">
                        <a @click="onASCountryKeyClicked(props.row[column.name])" href="javascript:void(0)">
                            {{ column.format(props.row[column.name], props.row) }}
                        </a>
                    </div>

                    <div v-else-if="column.name === `${rowKey}_country_iso_code3`" :style="{ 'text-align': column.align }">
                        {{ column.format(props.row[column.name], props.row) }}
                    </div>

                    <div v-else-if="column.name === `${rowKey}_af`" :style="{ 'text-align': column.align }">
                        {{ column.format(props.row[column.name], props.row) }}
                    </div>

                    <div v-else-if="column.name === alternativeKey || column.is_comma_separated"
                        :style="{ 'text-align': column.align }">
                        <div>{{ alternativeASNKeySubtitle(props.row[column.name], column.label) }}</div>
                        <div class="alternative_key_body" v-html="props.row[column.name]">
                        </div>
                    </div>

                    <div v-else :style="{ 'text-align': column.align }">
                        {{ column.format(props.row[column.name], props.row) }}
                    </div>
                </q-td>
                <q-td v-for="(aggregatedColumn) in aggregatedColumns" :key="aggregatedColumn.name">
                    <div :style="{ 'text-align': aggregatedColumn.align }">
                        {{ aggregatedColumn.format(props.row[aggregatedColumn.name], props.row) }}
                    </div>
                </q-td>
            </q-tr>

            <q-tr v-if="shouldRenderComponent && selectedOverviewColumn(props.row) !== null" :props="props"
                :key="`${props.row.key_normalized}.${selectedOverviewColumn(props.row)}`">
                <q-td colspan="100%" class="IHR_nohover" bordered>
                    <div class="IHR_side_borders">
                        <div v-if="tableAlarmType == 'hegemony' && selectedOverviewColumn(props.row) == 'asn_overview'"
                            v-for="(af) in getOverviewIPAddressFamilies(props.row[`${rowKey}_af`])">
                            <div style="text-align: center; font-size: 18px;">
                                {{ `${getColumnLabel('asn_overview')} IPv${af}` }}
                            </div>
                            <as-interdependencies-chart :as-number="props.row.key_normalized" :no-table="true" :fetch="true"
                                :address-family="af" :start-time="startTime" :end-time="endTime" />
                        </div>
                        <div v-if="tableAlarmType == 'network_delay' && selectedOverviewColumn(props.row) == 'asn_overview'"
                            v-for="(af) in getOverviewIPAddressFamilies(props.row[`${rowKey}_af`])">
                            <div style="text-align: center; font-size: 18px;">
                                {{ `${getColumnLabel('asn_overview')} IPv${af}` }}
                            </div>
                            <network-delay-chart :start-time="startTime" :end-time="endTime" :asFamily="af"
                                :start-point-name="String(props.row.key_normalized)" start-point-type="AS"
                                :end-point-names="getAlternativeKeyEndPointNames(props.row.alternative_key_normalized, props.row.alternative_key_normalized_af, props.row.alternative_key_avg_deviation, 35)"
                                :no-table="true" :fetch="true" />
                        </div>
                        <latencymon
                            v-if="tableAlarmType == 'network_disconnection' && selectedOverviewColumn(props.row) == 'asn_overview'"
                            :start-time="getNetworkDisconnectionStartTime(props.row.stream_start_time, props.row.stream_duration_minutes, 120)"
                            :stop-time="getNetworkDisconnectionEndTime(props.row.stream_end_time, props.row.stream_duration_minutes, 120)"
                            :msm-prb-ids="getMeasurementProbeIds(props.row.stream_disconnected_probe_ids)"
                            style="max-width: 93%; margin: 0 auto" :fetch="true" />
                        <ioda-chart v-if="tableDataSource == 'ioda' && selectedOverviewColumn(props.row) != 'overview'"
                            :entity-value="iodaEntityValue(props.row, selectedOverviewColumn(props.row))"
                            :filter-by-country="iodaEntityFilteredByCountry(selectedOverviewColumn(props.row))"
                            :start-time="startTime" :end-time="endTime" :ioda-alarm-types-units="iodaAlarmTypesUnits"
                            :fetch="true" />
                        <div v-if="selectedOverviewColumn(props.row) == 'overview' && alternativeKey">
                            <aggregated-alarm-filters :is-row-filter="true" :time-filters="timeFiltersCurrent"
                                @filter-alarms-by-ip-address-family="onFilterAlarmsByIpAddressFamily($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                @filter-alarms-by-time="onFilterAlarmsByTime($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                @filter-alarms-by-severities="onFilterAlarmsBySeverities($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                @reset-time="onResetTime(...getRefDatavizs(props.row.key_normalized), true)"
                                :key="`${props.row.key_normalized}.overview.filters`"
                                :ref="`${props.row.key_normalized}.overview.filters`" />
                            <q-card class="IHR_charts-body">
                                <q-card-section>
                                    <world-map-aggregated-alarms :alarms="alarmsCurrent"
                                        :alarm-counts-selected="aggregatedAttrsCountsSelected"
                                        :alarm-type-titles-map="alarmTypeTitlesMap" :loadingVal="false"
                                        @worldmap-country-clicked="onCountryClicked($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                        :key="`${props.row.key_normalized}.overview.worldMapAggregatedAlarms`"
                                        :ref="`${props.row.key_normalized}.overview.worldMapAggregatedAlarms`" />
                                </q-card-section>
                            </q-card>
                            <div class="card-wrapper">
                                <q-card class="IHR_charts-body">
                                    <q-card-section>
                                        <tree-map-aggregated-alarms :loadingVal="false" :isASGranularity="true"
                                            :aggregated-attrs-zipped="aggregatedAttrsZipped" :alarms="alarmsCurrent"
                                            :alarm-type-titles-map="alarmTypeTitlesMap" :country-clicked="countryClicked"
                                            @reset-granularity="onResetGranularity(...getRefDatavizs(props.row.key_normalized), true)"
                                            @treemap-node-clicked="onTreemapNodeClicked($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                            :key="`${props.row.key_normalized}.overview.treeMapAggregatedAlarms`"
                                            :ref="`${props.row.key_normalized}.overview.treeMapAggregatedAlarms`" />
                                    </q-card-section>
                                </q-card>
                            </div>
                            <div class="card-container">
                                <div class="card-wrapper">
                                    <q-card class="IHR_charts-body">
                                        <q-card-section>
                                            <time-series-aggregated-alarms :loadingVal="false"
                                                :time-filters="timeFiltersCurrent" :isASGranularity="true"
                                                :aggregated-attrs-zipped="aggregatedAttrsZipped" :alarms="alarmsCurrent"
                                                :alarm-type-titles-map="alarmTypeTitlesMap"
                                                :country-clicked="countryClicked"
                                                @reset-granularity="onResetGranularity(...getRefDatavizs(props.row.key_normalized), true)"
                                                @filter-alarms-by-time="onFilterAlarmsByTime($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                                @reset-time="onResetTime(...getRefDatavizs(props.row.key_normalized), true)"
                                                @timeseries-legend-clicked="onTimeseriesLegendClicked($event, ...getRefDatavizs(props.row.key_normalized), true)"
                                                :key="`${props.row.key_normalized}.overview.timeSeriesAggregatedAlarms`"
                                                :ref="`${props.row.key_normalized}.overview.timeSeriesAggregatedAlarms`" />
                                        </q-card-section>
                                    </q-card>
                                </div>
                            </div>
                        </div>
                    </div>
                </q-td>
            </q-tr>

        </template>
    </q-table>
</template>

<script>
import AsInterdependenciesChart from '@/views/charts/AsInterdependenciesChart'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'
import CommonTableMixin from './CommonTableMixin.vue'
import AggregatedAlarmsMixin from '../global/AggregatedAlarmsMixin.vue'
import Latencymon from '@/components/ripe/Latencymon'
import IodaChart from '@/views/charts/IodaChart'
import * as TableAggregatedAlarmsDataModel from '@/models/TableAggregatedAlarmsDataModel'
import AggregatedAlarmFilters from '../global/AggregatedAlarmFilters';
import WorldMapAggregatedAlarms from '../global/WorldMapAggregatedAlarms'
import TimeSeriesAggregatedAlarms from '../global/TimeSeriesAggregatedAlarms'
import TreeMapAggregatedAlarms from '../global/TreeMapAggregatedAlarms'

export default {
  mixins: [CommonTableMixin, AggregatedAlarmsMixin],
  components: {
    AsInterdependenciesChart,
    NetworkDelayChart,
    Latencymon,
    IodaChart,
    AggregatedAlarmFilters,
    WorldMapAggregatedAlarms,
    TimeSeriesAggregatedAlarms,
    TreeMapAggregatedAlarms
  },
  emits: ['asn-country-key-clicked', 'asn-name-key-clicked'],
  props: {
    tableAlarms: {
      type: Object,
      required: true
    },
    columns: {
      type: Array,
      required: true
    },
    aggregatedColumns: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    rowKey: {
      type: String,
      required: true
    },
    alternativeKey: {
      type: String,
      required: false
    },
    filter: {
      type: String,
      required: false,
      default: () => ''
    },
    timeFilters: {
      type: Object,
      required: true
    },
    tableDataSource: {
      type: String,
      required: true
    },
    tableAlarmType: {
      type: String,
      required: true
    },
    tableAlarmTypeRowColumns: {
      type: Object,
      required: true
    },
    alarmTypeTitlesMap: {
      type: Object,
      required: true
    },
    aggregatedAttrsCountsSelected: {
      type: Array,
      required: true
    },
    aggregatedAttrsZipped: {
      type: Array,
      required: true
    },
    iodaAlarmTypesUnits: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      pagination: {
        sortBy: 'total_count',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      startTime: null,
      endTime: null,
      alarms: [],
      shouldRenderComponent: true
    }
  },
  watch: {
    timeFilters: {
      handler: function () {
        this.startTime = new Date(this.timeFilters.startUnixTime * 1000)
        this.endTime = new Date(this.timeFilters.endUnixTime * 1000)
      },
      deep: true,
      immediate: true
    },
    alternativeKey: {
      handler: function (_) {
        this.delayedRender()
      },
      deep: true
    }
  },
  computed: {
    allColumns() {
      return [...this.columns, ...this.aggregatedColumns]
    },
    alarmsTableValues() {
      return Object.values(this.tableAlarms)
    },
    alarmsCurrent() {
      return this.alarmsAppliedFilters ? this.alarmsAppliedFilters : this.alarms
    },
    timeFiltersCurrent() {
      return Object.values(this.dateTimeFilter).every((val) => val !== null) ? this.dateTimeFilter : this.timeFilters
    },
    selectedOverviewColumn() {
      return (alarm) => {
        let selectedOverviewColumn = null
        for (const column in alarm) {
          if (column.endsWith && column.endsWith('overview')) {
            if (alarm[column] === true) selectedOverviewColumn = column
          }
        }
        return selectedOverviewColumn
      }
    }
  },
  methods: {
    getRefDatavizs(key) {
      const worldMapRef = this.$refs[`${key}.overview.worldMapAggregatedAlarms`]
      const treeMapRef = this.$refs[`${key}.overview.treeMapAggregatedAlarms`]
      const timeseriesRef = this.$refs[`${key}.overview.timeSeriesAggregatedAlarms`]
      const tableRef = null
      return [worldMapRef, treeMapRef, timeseriesRef, tableRef]
    },
    getOverviewIPAddressFamilies(ipAddressFamily) {
      if (String(ipAddressFamily).includes('/')) return ipAddressFamily.split('/').map((af) => Number(af))
      return [Number(ipAddressFamily)]
    },
    onASKeyClicked(val, thisWindow, $options) {
      thisWindow({
        name: 'networks',
        params: {
          asn: $options.filters.ihr_NumberToAsOrIxp(val),
        },
      })
    },
    alternativeASNKeySubtitle(val, title) {
      return String(val).replaceAll('<br>', ', ').split(', ').length + ' ' + title
    },
    onASNameKeyClicked(asnKey, countryName) {
      this.$emit('asn-name-key-clicked', asnKey, countryName);
      this.scrollToTop(750)
    },
    onASCountryKeyClicked(countryName) {
      this.$emit('asn-country-key-clicked', countryName);
      this.$emit('filter-country-name-changed', countryName)
      this.scrollToTop(750)
    },
    scrollToTop(top) {
      window.scrollTo({
        top: top,
        behavior: 'smooth',
      });
    },
    getAlternativeKeyEndPointNames(endpoints, ipAddressFamilies, deviations, topN = 35) {
      return TableAggregatedAlarmsDataModel.getAlternativeKeyEndPointNames(endpoints, ipAddressFamilies, deviations, topN)
    },
    getNetworkDisconnectionStartTime(streamStartTime, streamDurationMinutes, minutesShiftedBefore = 120) {
      return this.dateHourShift(streamStartTime, -Math.max(streamDurationMinutes, minutesShiftedBefore) / 60)
    },
    getNetworkDisconnectionEndTime(streamEndTime, streamDurationMinutes, minutesShiftedAfter = 120) {
      return this.dateHourShift(streamEndTime, Math.max(streamDurationMinutes, minutesShiftedAfter) / 60)
    },
    getMeasurementProbeIds(probeIds) {
      return { 1030: probeIds, 1001: probeIds, 1591146: probeIds }
    },
    unToggleOtherSwitchesInRow(rowKeyValue, overviewColumnName) {
      const isOverviewSelected = !this.tableAlarms[rowKeyValue][overviewColumnName]
      if (!isOverviewSelected) return
      for (const column in this.tableAlarms[rowKeyValue]) {
        if (column.endsWith('overview') && column !== overviewColumnName) {
          this.tableAlarms[rowKeyValue][column] = false
        }
      }
      if (overviewColumnName === 'overview' && this.alternativeKey) {
        this.alarmsAppliedFilters = this.dateTimeFilter.startUnixTime = this.dateTimeFilter.endUnixTime = this.countryClicked = this.legendSelected.legend = this.legendSelected.opacity = null
        this.alarms = TableAggregatedAlarmsDataModel.aggregateAlarmsByAlternativeKey(this.tableAlarms[rowKeyValue], this.tableAlarmType, this.alternativeKey, this.tableAlarmTypeRowColumns)
      }
    },
    iodaEntityValue(row, overviewColumn) {
      const isCountry = this.iodaEntityFilteredByCountry(overviewColumn)
      if (isCountry) {
        const countryIsoCode2 = this.tableAlarms[row.key_normalized][`${this.rowKey}_country_iso_code2`][0]
        return String(countryIsoCode2)
      } else {
        return String(row.key_normalized)
      }
    },
    iodaEntityFilteredByCountry(overviewColumn) {
      const granularity = overviewColumn.split('_overview')[0]
      return granularity === 'country' ? true : false
    },
    delayedRender() {
      this.shouldRenderComponent = false
      setTimeout(() => {
        this.shouldRenderComponent = true;
      }, 100)
    },
    getColumnLabel(columnName) {
      const index = this.allColumns.findIndex((column) => column.name === columnName)
      if (index !== -1) {
        return this.allColumns[index].label
      } else {
        return null
      }
    }
  }
}
</script>
<style lang="stylus" scoped>
.toggle {
    cursor: pointer;
    display: inline-block;
  }
  .toggle-switch {
    display: inline-block;
    font-size: 40px;
    background: #ccc;
    border-radius: 16px;
    width: 30px;
    height: 15px;
    position: relative;
    vertical-align: middle;
    transition: background 0.25s;
    background-color: rgb(158,158,158);
  
  }
  .toggle-switch:before, .toggle-switch:after {
    content: "";
  }
  .toggle-switch:before {
    display: block;
    background: linear-gradient(to bottom, #fff 0%, #eee 100%);
    border-radius: 50%;
    box-shadow: 0 3px 1px -2px rgba(0,0,0,0.2), 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12);
    width: 17px;
    height: 17px;
    position: absolute;
    top: -1px;
    left: 0px;
    transition: left 0.25s;
  }
  .toggle-checkbox:checked + .toggle-switch:before {
    background: rgb(40,50,55);
  }
  .toggle-checkbox:checked {
    background-color: red
  }
  .toggle:hover .toggle-switch:before {
    box-shadow: 0 0 0 10px rgba(217,217,217, 0.5);
  }
  .toggle-checkbox:checked + .toggle-switch {
    background: rgb(139,144,147);
  }
  .toggle-checkbox:checked + .toggle-switch:before {
    left: 15px;
  }
  .toggle-checkbox {
    position: absolute;
    visibility: hidden;
  }
.myClass tbody td {
    text-align: left;
}
.alternative_key_body {
    text-overflow: ellipsis
    white-space: nowrap
    font-style: italic
    color: #555
}

.IHR_nohover:first-child {
    padding-top: 0px;
    padding-bottom: 20px;
    padding-right: 20px;
    padding-left: 20px;
    background: #fafafa;
}
.IHR_side_borders:first-child {
    padding-top: 20px;
    border-style: solid;
    border-color: #dddddd;
    border-top-width: 0px;
    border-left-width: 1px;
    border-right-width: 1px;
    border-bottom-width: 1px;
    border-radius: 5px;
    background: #ffffff;
}
</style>
