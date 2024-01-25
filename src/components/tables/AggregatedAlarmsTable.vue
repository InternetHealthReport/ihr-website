<script setup>
import { QTable, QTr, QTd, QToggle, QCard, QCardSection, QSelect, QBtn, QInput } from 'quasar'
import * as TableAggregatedAlarmsDataModel from '@/plugins/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { ref, computed, watch, inject } from 'vue'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'
import commonTable from '@/plugins/commonTable'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import AsInterdependenciesChart from '../charts/AsInterdependenciesChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import WorldMapAggregatedAlarmsChart from '@/components/charts/WorldMapAggregatedAlarmsChart.vue'
import TimeSeriesAggregatedAlarmsChart from '@/components/charts/TimeSeriesAggregatedAlarmsChart.vue'
import TreeMapAggregatedAlarmsChart from '@/components/charts/TreeMapAggregatedAlarmsChart.vue'
import * as AggregatedAlarmsDataModel from '@/plugins/models/AggregatedAlarmsDataModel'
import Latencymon from '@/components/ripe/Latencymon.vue'
import IodaChart from '@/components/charts/IodaChart.vue'

const ihr_api = inject('ihr_api')

const SEVERITY_LEVELS = [
  {
    label: 'Low',
    value: 'low'
  },
  {
    label: 'Medium',
    value: 'medium'
  },
  {
    label: 'High',
    value: 'high'
  }
]

const IP_ADDRESS_FAMILIES = [
  {
    label: 'IPv4',
    value: 4
  },
  {
    label: 'IPv6',
    value: 6
  }
]

const props = defineProps({
  loading: {
    type: Boolean,
    required: true,
  },
  alarms: {
    type: Array,
  },
  aggregatedAttrsSelected: {
    type: Object,
  },
  countryName: {
    type: String
  },
  alarmTypeTitlesMap: {
    type: Object
  },
  selectedTableAlarmType: {
    type: String
  },
  selectedTableDataSource: {
    type: String
  },
  severitiesSelectedList: {
    type: Array
  },
  tableKeyCurrent: {
    type: String
  },
  filter: {
    type: String,
    default: '',
  },
  data: {
    type: Array,
    required: false,
    default: () => []
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  }
})

const emit = defineEmits(['country-clicked', 'asn-name-key-clicked', {
  'filteredRows': (filteredSearchRowValues) => {
    if (filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  }
}])

const { rows, filterFct, filterTable, getCellValue, dateHourShift, setRows } = commonTable(props, { emit })

const columns = ref(ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_columns)
const aggregatedColumns = ref(ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_aggregated_columns)
const pagination = ref({
  sortBy: 'total_count',
  descending: true,
  page: 1,
  rowsPerPage: 10,
})
const expandedRow = ref([])
const toggle = ref({})
const refs = ref({})
const alternativeKey = ref(null)
const alarmsTableDataFromModel = ref(null)
const selectSeveritiesLevels = ref({})
const selectIPAddressFamilies = ref({})
const selectedCountry = ref({})
const selectedLegend = ref({})
const startTimeFormatted = ref({})
const endTimeFormatted = ref({})
const minTimeFormatted = ref(props.startTime.toISOString().slice(0, 16))
const maxTimeFormatted = ref(props.endTime.toISOString().slice(0, 16))

const onCountryClicked = (newCountryClicked, key) => {
  selectedLegend.value[key].legend = selectedLegend.value[key].opacity = null
  selectedCountry.value[key] = newCountryClicked
}

const onTimeseriesLegendClicked = (newLegend, key) => {
  if (newLegend.opacity < 1) {
    selectedLegend.value[key] = newLegend
  } else {
    if (selectedLegend.value[key].legend === newLegend.legend) {
      selectedLegend.value[key].legend = null
      selectedLegend.value[key].opacity = 0.5
    }
  }
  const alarms = alarmsCurrent(alarmsTableDataFromModel.value[key], key)
  initTimeSeriesManually(key, alarms, false)
  initTreeMapManually(key, alarms, true)
}

const onTreemapNodeClicked = (newNodeClickedLabel, key) => {
  if (selectedLegend.value[key].legend !== newNodeClickedLabel) {
    selectedLegend.value[key].legend = newNodeClickedLabel
    selectedLegend.value[key].opacity = 1
  } else {
    selectedLegend.value[key].legend = null
    selectedLegend.value[key].opacity = 0.5
  }
  const alarms = alarmsCurrent(alarmsTableDataFromModel.value[key], key)
  initTimeSeriesManually(key, alarms, true)
  initTreeMapManually(key, alarms, false)
}

const initTimeSeriesManually = (key, alarms, renderTimeSeries = true) => {
  const timeseriesRef = `${key}_timeseries`
  refs[timeseriesRef].init(alarms, new Date(`${startTimeFormatted.value[key]}:00Z`), new Date(`${endTimeFormatted.value[key]}:00Z`), alarmTypeAggregatedAttrsSelected.value, selectedCountry.value[key], props.alarmTypeTitlesMap, selectedLegend.value[key].legend, true, renderTimeSeries)
}

const initTreeMapManually = (key, alarms, renderTreeMap = true) => {
  const treemapRef = `${key}_treemap`
  const selectSeveritiesLevelsList = selectSeveritiesLevels.value[key].map(obj => obj.value)
  refs[treemapRef].init(alarms, selectSeveritiesLevelsList, alarmTypeAggregatedAttrsSelected.value, selectedCountry.value[key], props.alarmTypeTitlesMap, selectedLegend.value[key].legend, true, renderTreeMap)
}

const tableAlternativeKeyCurrent = () => {
  for (const column of columns.value) {
    if (column.name.endsWith('name') && column.name != `${props.tableKeyCurrent}_name`) {
      alternativeKey.value = column.name.split('_name')[0]
    }
  }
}

const onASNameKeyClicked = (asName, country) => {
  emit('asn-name-key-clicked', { country, asName })

}

const onASCountryKeyClicked = (country) => {
  emit('country-clicked', country)
}

const alternativeASNKeySubtitle = (val, title) => {
  const valString = String(val)
  return `${valString.replaceAll('<br>', valString.endsWith('<br>') ? '' : ', ').split(', ').length} ${title}`
}

const getOverviewIPAddressFamilies = (ipAddressFamily) => {
  if (String(ipAddressFamily).includes('/')) {
    return ipAddressFamily.split('/').map((af) => Number(af))
  }
  return [Number(ipAddressFamily)]
}

const getColumnLabel = (columnName) => {
  const index = columns.value.findIndex((column) => column.name === columnName)
  if (index !== -1) {
    return columns.value[index].label
  }
  return null
}

const getAlternativeKeyEndPointNames = (endpoints, ipAddressFamilies, deviations, topN = 35) => {
  return TableAggregatedAlarmsDataModel.getAlternativeKeyEndPointNames(endpoints, ipAddressFamilies, deviations, topN)
}

const getAlarmsCurrent = (tableAlarms) => {
  return TableAggregatedAlarmsDataModel.aggregateAlarmsByAlternativeKey(tableAlarms, props.selectedTableAlarmType, alternativeKey.value, ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].columns)
}

const filterAlarmsHelper = (alarms, key) => {
  const selectSeveritiesList = selectSeveritiesLevels.value[key].map(obj => obj.value)
  const selectIPAddressFamiliesList = selectIPAddressFamilies.value[key].map(obj => obj.value)
  const alarmsFiltered = AggregatedAlarmsDataModel.filterAlarms(alarms, new Date(`${startTimeFormatted.value[key]}:00Z`), new Date(`${endTimeFormatted.value[key]}:00Z`), props.aggregatedAttrsSelected, selectSeveritiesList, selectIPAddressFamiliesList, selectedCountry.value[key])
  return alarmsFiltered
}

const alarmsCurrent = (tableAlarms, key) => {
  const alarms = getAlarmsCurrent(tableAlarms)
  const alarmsFiltered = filterAlarmsHelper(alarms, key)
  return alarmsFiltered
}

const timeFilter = (obj, key) => {
  startTimeFormatted.value[key] = obj.startDateTime
  endTimeFormatted.value[key] = obj.endDateTime
}

const resetGranularity = (key) => {
  selectedLegend.value[key].legend = selectedLegend.value[key].opacity = null
  selectedCountry.value[key] = null
  const alarms = alarmsCurrent(alarmsTableDataFromModel.value[key], key)
  initTimeSeriesManually(key, alarms, true)
  initTreeMapManually(key, alarms, true)
}

const resetTime = (key) => {
  startTimeFormatted.value[key] = props.startTime.toISOString().slice(0, 16)
  endTimeFormatted.value[key] = props.endTime.toISOString().slice(0, 16)
}

const getMeasurementProbeIds = (probeIds) => {
  return { 1030: probeIds, 1001: probeIds, 1591146: probeIds }
}

const getNetworkDisconnectionStartTime = (streamStartTime, streamDurationMinutes, minutesShiftedBefore = 120) => {
  return dateHourShift(streamStartTime, -Math.max(streamDurationMinutes, minutesShiftedBefore) / 60)
}

const getNetworkDisconnectionEndTime = (streamEndTime, streamDurationMinutes, minutesShiftedAfter = 120) => {
  return dateHourShift(streamEndTime, Math.max(streamDurationMinutes, minutesShiftedAfter) / 60)
}

const iodaEntityValue = (row, overviewColumn) => {
  const isCountry = iodaEntityFilteredByCountry(overviewColumn)
  if (isCountry) {
    const countryIsoCode2 = alarmsTableDataFromModel.value[row.key_normalized][`${props.tableKeyCurrent}_country_iso_code2`][0]
    return String(countryIsoCode2)
  } else {
    return String(row.key_normalized)
  }
}

const iodaEntityFilteredByCountry = (overviewColumn) => {
  const granularity = overviewColumn.split('_overview')[0]
  return granularity === 'country' ? true : false
}

const initToggle = () => {
  toggle.value = {}
  refs.value = {}
  selectSeveritiesLevels.value = {}
  selectIPAddressFamilies.value = {}
  selectedCountry.value = {}
  startTimeFormatted.value = {}
  endTimeFormatted.value = {}
  rows.value.forEach(val => {
    for (const key in val) {
      toggle.value[`${val.key_normalized}_overview`] = false
      toggle.value[`${val.key_normalized}_asn_overview`] = false
      toggle.value[`${val.key_normalized}_country_overview`] = false
      refs.value[`${val.key_normalized}_worldmap`] = ref(null)
      refs.value[`${val.key_normalized}_timeseries`] = ref(null)
      refs.value[`${val.key_normalized}_treemap`] = ref(null)
      selectSeveritiesLevels.value[val.key_normalized] = SEVERITY_LEVELS
      selectIPAddressFamilies.value[val.key_normalized] = IP_ADDRESS_FAMILIES
      selectedCountry.value[val.key_normalized] = null
      selectedLegend.value[val.key_normalized] = { legend: null, opacity: null }
      startTimeFormatted.value[val.key_normalized] = props.startTime.toISOString().slice(0, 16)
      endTimeFormatted.value[val.key_normalized] = props.endTime.toISOString().slice(0, 16)
    }
  })
}

const setRef = (key) => {
  return (el) => {
    refs[key] = el;
  };
}

const init = () => {
  tableAlternativeKeyCurrent()
  const [alarmsTableData, tableColumnsToInclude, tableAggregatedColumnsToInclude] = TableAggregatedAlarmsDataModel.etl(props.alarms, props.selectedTableAlarmType, props.selectedTableDataSource, columns.value, aggregatedColumns.value, props.tableKeyCurrent, alternativeKey.value, props.severitiesSelectedList)
  setRows(Object.values(alarmsTableData))
  alarmsTableDataFromModel.value = alarmsTableData
  if (tableColumnsToInclude) {
    columns.value = tableColumnsToInclude
  }
  if (tableAggregatedColumnsToInclude) {
    aggregatedColumns.value = tableAggregatedColumnsToInclude
  }
  initToggle()
}

const alarmTypeAggregatedAttrsSelected = computed(() => {
  const result = AggregatedAlarmsUtils.flattenDictionary(Object.keys(props.aggregatedAttrsSelected).map((attr) => ({ [attr]: [] })))
  for (let i = 0; i < props.aggregatedAttrsSelected.counts.length; i++) {
    const alarmType = props.aggregatedAttrsSelected.counts[i]
    if (alarmType.startsWith(props.selectedTableAlarmType)) {
      for (const aggregatedKey in props.aggregatedAttrsSelected) {
        result[aggregatedKey] = [props.aggregatedAttrsSelected[aggregatedKey][i]]
      }
      break
    }
  }
  return result
})

watch(() => props.alarms, () => {
  columns.value = ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_columns
  aggregatedColumns.value = ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_aggregated_columns
  init()
})

watch(() => props.selectedTableAlarmType, () => {
  columns.value = ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_columns
  aggregatedColumns.value = ALARMS_INFO[props.selectedTableDataSource].alarm_types[props.selectedTableAlarmType].metadata.table_aggregated_columns
  init()
}, { immediate: true })

</script>

<template>
  <QTable table-class="myClass" :rows="rows" :columns="[...columns, ...aggregatedColumns]" :pagination.sync="pagination"
    :loading="loading" :filter="filter" :filter-method="filterFct" flat loading-label="Loading Alarms ..."
    :row-key="tableKeyCurrent" v-model:expanded="expandedRow">
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd v-for="(column, index) in columns" :key="column.name">
          <div v-if="column.name.endsWith('overview')" :key="`${tableKeyCurrent}.${column.name}`"
            :style="{ 'text-align': column.align }">
            <QToggle v-model="toggle[`${props.row.key_normalized}_${column.name}`]" />
          </div>
          <div v-else-if="column.name === tableKeyCurrent" :style="{ 'text-align': column.align }">
            <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: ihr_api.ihr_NumberToAsOrIxp(props.row.key_normalized) } })">
              {{ column.format(props.row[column.name], props.row) }}
            </RouterLink>
          </div>
          <div v-else-if="column.name === `${tableKeyCurrent}_name`" :style="{ 'text-align': column.align }">
            <a href="javascript:void(0)"
              @click="onASNameKeyClicked(props.row.key_name_truncated, props.row[`${tableKeyCurrent}_country`])" flat no-caps>
              {{ column.format(props.row[column.name], props.row) }}
            </a>
          </div>
          <div v-else-if="column.name === `${tableKeyCurrent}_country`" :style="{ 'text-align': column.align }">
            <a href="javascript:void(0)" @click="onASCountryKeyClicked(props.row[column.name])" flat no-caps>
              {{ column.format(props.row[column.name], props.row) }}
            </a>
          </div>
          <div v-else-if="column.name === `${tableKeyCurrent}_country_iso_code3`" :style="{ 'text-align': column.align }">
            {{ column.format(props.row[column.name], props.row) }}
          </div>
          <div v-else-if="column.name === `${tableKeyCurrent}_af`" :style="{ 'text-align': column.align }">
            {{ column.format(props.row[column.name], props.row) }}
          </div>
          <div v-else-if="column.name === alternativeKey || column.is_comma_separated"
            :style="{ 'text-align': column.align }">
            <div>{{ alternativeASNKeySubtitle(props.row[column.name], column.label) }}</div>
            <div class="alternative_key_body" v-html="props.row[column.name]"></div>
          </div>
          <div v-else :style="{ 'text-align': column.align }">
            {{ column.format(props.row[column.name], props.row) }}
          </div>
        </QTd>
        <QTd v-for="(aggregatedColumn, index) in aggregatedColumns" :key="aggregatedColumn.name"
          :style="{ 'text-align': aggregatedColumn.align }">
          <div>{{ aggregatedColumn.format(props.row[aggregatedColumn.name], props.row) }}</div>
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="IHR_side_borders">
            <div v-if="alternativeKey">
              <div class="row">
                <div class="col-auto">
                  <div class="row">
                    <div class="col">
                      <QInput type="datetime-local" v-model="startTimeFormatted[props.row.key_normalized]"
                        label="From (UTC)" :disable="false" :min="minTimeFormatted" :max="maxTimeFormatted" />
                    </div>
                    <div class="col-auto" style="width: 40px;"></div>
                    <div class="col">
                      <QInput type="datetime-local" v-model="endTimeFormatted[props.row.key_normalized]" label="To (UTC)"
                        :disable="false" :min="minTimeFormatted" :max="maxTimeFormatted" />
                    </div>
                  </div>
                  <div class="row" style="margin-top: 20px;margin-bottom: 10px;">
                    <div class="col-7 text-center">
                      <QBtn color="primary" class="float-right" @click="resetTime(props.row.key_normalized)"
                        :disable="false">RESET TIME</QBtn>
                    </div>
                  </div>
                </div>
                <div class="col offset-md-1">
                  <QSelect outlined multiple v-model="selectSeveritiesLevels[props.row.key_normalized]"
                    :options="SEVERITY_LEVELS" label="Severity Levels:" stack-label use-chips />
                </div>
                <div class="col offset-md-1">
                  <QSelect outlined multiple v-model="selectIPAddressFamilies[props.row.key_normalized]"
                    :options="IP_ADDRESS_FAMILIES" label="IP Address Families:" stack-label use-chips />
                </div>
                <div class="col">
                  <QBtn color="primary" class="float-right" @click="resetGranularity(props.row.key_normalized)">Show All
                    Countries</QBtn>
                </div>
              </div>
              <QCard>
                <QCardSection>
                  <!-- TODO: Configure here country-clicked event like in the Aggregated Alarms Controller-->
                  <WorldMapAggregatedAlarmsChart :ref="setRef(`${props.row.key_normalized}_worldmap`)" :loading="false"
                    :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)"
                    :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected"
                    :selected-country="selectedCountry[props.row.key_normalized]"
                    :alarm-type-titles-map="alarmTypeTitlesMap"
                    @country-clicked="onCountryClicked($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <div class="col">
                    <QBtn color="primary" class="full-width" @click="resetGranularity(props.row.key_normalized)"
                      :disable="false">
                      Show All Countries
                    </QBtn>
                  </div>
                </QCardSection>
                <QCardSection>
                  <TreeMapAggregatedAlarmsChart :ref="setRef(`${props.row.key_normalized}_treemap`)" :loading="false"
                    :isASGranularity="true" :country-name="selectedCountry[props.row.key_normalized]"
                    :legend-selected="null"
                    :select-severities-list="selectSeveritiesLevels[props.row.key_normalized].map(obj => obj.value)"
                    :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)"
                    :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected"
                    :alarm-type-titles-map="alarmTypeTitlesMap"
                    @treemap-node-clicked="onTreemapNodeClicked($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <div class="row items-center">
                    <div class="col">
                      <QBtn color="primary" class="full-width" @click="resetTime(props.row.key_normalized)"
                        :disable="false">
                        RESET TIME
                      </QBtn>
                    </div>
                    <div class="col">
                      <QBtn color="primary" class="full-width" @click="resetGranularity(props.row.key_normalized)"
                        :disable="false">
                        Show All Countries
                      </QBtn>
                    </div>
                  </div>
                </QCardSection>
                <QCardSection>
                  <TimeSeriesAggregatedAlarmsChart :ref="setRef(`${props.row.key_normalized}_timeseries`)"
                    :loading="false" :isASGranularity="true" :country-name="selectedCountry[props.row.key_normalized]"
                    :legend-selected="null" :start-time="new Date(`${startTimeFormatted[props.row.key_normalized]}:00Z`)"
                    :end-time="new Date(`${endTimeFormatted[props.row.key_normalized]}:00Z`)"
                    :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)"
                    :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected"
                    :alarm-type-titles-map="alarmTypeTitlesMap"
                    @timeseries-legend-clicked="onTimeseriesLegendClicked($event, props.row.key_normalized)"
                    @select-time="timeFilter($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
            </div>
          </div>
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_asn_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div v-if="selectedTableAlarmType == 'hegemony'"
            v-for="(af) in getOverviewIPAddressFamilies(props.row[`${tableKeyCurrent}_af`])">
            <div style="text-align: center; font-size: 18px;">
              {{ `${props.row[`${tableKeyCurrent}`]} ${getColumnLabel('asn_overview')} IPv${af}` }}
            </div>
            <AsInterdependenciesChart :as-number="props.row.key_normalized" :no-table="true" :fetch="true"
              :address-family="af" :start-time="startTime" :end-time="endTime" />
          </div>
          <div v-if="selectedTableAlarmType == 'network_delay'"
            v-for="(af) in getOverviewIPAddressFamilies(props.row[`${tableKeyCurrent}_af`])">
            <div style="text-align: center; font-size: 18px;">
              {{ `${getColumnLabel('asn_overview')} IPv${af}` }}
            </div>
            <NetworkDelayChart :start-time="startTime" :end-time="endTime" :asFamily="af"
              :start-point-name="String(props.row.key_normalized)" start-point-type="AS"
              :end-point-names="getAlternativeKeyEndPointNames(props.row.alternative_key_normalized, props.row.alternative_key_normalized_af, props.row.alternative_key_avg_deviation, 35)"
              :no-table="true" :fetch="true" />
          </div>
          <Latencymon v-if="selectedTableAlarmType == 'network_disconnection'"
            :start-time="getNetworkDisconnectionStartTime(props.row.stream_start_time, props.row.stream_duration_minutes, 120)"
            :stop-time="getNetworkDisconnectionEndTime(props.row.stream_end_time, props.row.stream_duration_minutes, 120)"
            :msm-prb-ids="getMeasurementProbeIds(props.row.stream_disconnected_probe_ids)"
            style="max-width: 93%; margin: 0 auto" />

          <div v-if="selectedTableDataSource == 'ioda'">
            <div style="text-align: center; font-size: 18px;">
              {{ `${props.row[`${tableKeyCurrent}`]} Internet Overview` }}
            </div>
            <IodaChart v-if="selectedTableDataSource == 'ioda'" :entity-value="iodaEntityValue(props.row, 'asn_overview')"
              :filter-by-country="iodaEntityFilteredByCountry('asn_overview')" :start-time="startTime"
              :end-time="endTime" />
          </div>
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_country_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div v-if="selectedTableDataSource == 'ioda'">
            <div style="text-align: center; font-size: 18px;">
              {{ `${props.row[`${tableKeyCurrent}_country`]} Internet Overview` }}
            </div>
            <IodaChart v-if="selectedTableDataSource == 'ioda'"
              :entity-value="iodaEntityValue(props.row, 'country_overview')"
              :filter-by-country="iodaEntityFilteredByCountry('country_overview')" :start-time="startTime"
              :end-time="endTime" />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus">
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
.myClass tbody td {
    text-align: left;
}
</style>