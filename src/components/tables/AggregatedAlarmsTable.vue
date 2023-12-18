<script setup>
import { QTable, QTr, QTd, QToggle, QCard, QCardSection, QSelect, QBtn } from 'quasar'
import * as TableAggregatedAlarmsDataModel  from '@/plugins/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { ref, computed, onMounted, watch, inject } from 'vue'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'
import commonTable from '@/plugins/commonTable'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import AsInterdependenciesChart from '../charts/AsInterdependenciesChart.vue'
import NetworkDelayChart from '../charts/NetworkDelayChart.vue'
import WorldMapAggregatedAlarmsChart from '../charts/WorldMapAggregatedAlarmsChart.vue'
import TimeSeriesAggregatedAlarmsChart from '../charts/TimeSeriesAggregatedAlarmsChart.vue'
import TreeMapAggregatedAlarmsChart from '../charts/TreeMapAggregatedAlarmsChart.vue'
import * as AggregatedAlarmsDataModel from '@/plugins/models/AggregatedAlarmsDataModel'
import { isCountryName } from '@/plugins/countryName'
import Latencymon from '../ripe/Latencymon.vue'
import IodaChart from '../charts/IodaChart.vue'

const ihr_api = inject('ihr_api')

const SEVERITIED_LEVELS = [
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
  tableKeyCurrent : {
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

const emit = defineEmits(['country-clicked', {
  'filteredRows': (filteredSearchRowValues) => {
    if(filteredSearchRowValues !== null) {
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
const alternativeKey = ref(null)
const alarmsTableDataFromModel = ref(null)
const selectSeveritiesLevels = ref({})
const selectIPAddressFamilies = ref({})
const selectedCountry = ref({})
const selectedNetwork = ref({})
const selectTime = ref({})

const tableAlternativeKeyCurrent = () => {
  for (const column of columns.value) {
    if (column.name.endsWith('name') && column.name != `${props.tableKeyCurrent}_name`) {
      alternativeKey.value = column.name.split('_name')[0]
    }
  }
}

const onASNameKeyClicked = (asName, country) => {
  emit('country-clicked', { type: 'button', asName: asName, country: country })
}

const onASCountryKeyClicked = (val) => {
  emit('country-clicked', { type: 'button', asName: null, country: val })
}

const alternativeASNKeySubtitle = (val, title) => {
  return `${String(val).replaceAll('<br>', ', ').split(', ').length} ${title}`
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

const selectSeveritiesLevelsAndIPAddressFamiliesFilter = (alarms, key) => {
  if (!selectSeveritiesLevels.value[key].length) {
    return alarms
  } else{
    const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms, selectSeveritiesLevels.value[key].map(obj => obj.value), AggregatedAlarmsUtils.zipAggregatedAttrs(props.aggregatedAttrsSelected))
    const ipAddressFamiliesFiltered = AggregatedAlarmsDataModel.filterAlarmsByIpAddressFamily(alarmsSeverityFiltered, selectIPAddressFamilies.value[key].map(obj => obj.value), AggregatedAlarmsUtils.zipAggregatedAttrs(props.aggregatedAttrsSelected))
    if (selectTime.value[key]) {
      const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(props.aggregatedAttrsSelected)
      const timeFilter = AggregatedAlarmsDataModel.filterAlarmsByTime(ipAddressFamiliesFiltered, new Date(selectTime.value[key].startDateTime).getTime() / 1000, new Date(selectTime.value[key].endDateTime).getTime() / 1000, aggregatedAttrsZipped)
      return timeFilter
    }
    return ipAddressFamiliesFiltered
  }
}

const alarmsCurrent = (tableAlarms, key) => {
  const alarms = getAlarmsCurrent(tableAlarms)
  return selectSeveritiesLevelsAndIPAddressFamiliesFilter(alarms, key)
}

const countryClickedHandler = (event, key) => {
  if (event.points) {
    if (event.points[0].data.type === 'choropleth') {
      selectedCountry.value[key] = event.points[0].text
    } else if (event.points[0].data.type === 'treemap') {
      try {
        const name = event.points[0].id.split('-')[0]
        if (isCountryName(name)) {
          selectedCountry.value[key] = name
        } else {
          selectedNetwork.value[key] = event.points[0].id
        }
      } catch (error) {
        resetGranularity(key)
      }
    }
  } else if (event.node) {
    const name = event.node.textContent.split('-')[0]
    if (isCountryName(name)) {
      selectedCountry.value[key] = name
    } else {
      selectedNetwork.value[key] = event.node.textContent
    }
  }
}

const timeFilter = (obj, key) => {
  selectTime.value[key] = obj
}

const resetGranularity = (key) => {
  selectedCountry.value[key] = null
  selectedNetwork.value[key] = null
  selectTime.value[key] = null
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

const iodaAlarmTypesUnits = computed(() => {
  const iodaAlarmTypesUnitsResult = {}
  for (const iodaAlarmType in ALARMS_INFO.ioda.alarm_types) {
    iodaAlarmTypesUnitsResult[iodaAlarmType] = ALARMS_INFO.ioda.alarm_types[iodaAlarmType].metadata.unit
  }
  return iodaAlarmTypesUnitsResult
})

const initToggle = () => {
  toggle.value = {}
  selectSeveritiesLevels.value = {}
  selectIPAddressFamilies.value = {}
  selectedCountry.value = {}
  selectedNetwork.value = {}
  selectTime.value = {}
  rows.value.forEach(val => {
    for (const key in val) {
      toggle.value[`${val.key_normalized}_overview`] = false
      toggle.value[`${val.key_normalized}_asn_overview`] = false
      toggle.value[`${val.key_normalized}_country_overview`] = false
      selectSeveritiesLevels.value[val.key_normalized] = SEVERITIED_LEVELS
      selectIPAddressFamilies.value[val.key_normalized] = IP_ADDRESS_FAMILIES
      selectedCountry.value[val.key_normalized] = null
      selectedNetwork.value[val.key_normalized] = null
      selectTime.value[val.key_normalized] = null
    }
  })
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
  init()
})

watch(() => props.selectedTableAlarmType, () => {
  init()
}, {immediate: true})

onMounted(() => {
  // init()
})
</script>

<template>
  {{ selectedTableAlarmType }}
  <QTable
    table-class="myClass"
    :rows="rows"
    :columns="[...columns, ...aggregatedColumns]"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filterTable"
    :filter-method="filterFct"
    flat
    loading-label="Loading Alarms ..."
    :row-key="tableKeyCurrent"
    v-model:expanded="expandedRow"
  >
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd v-for="(column, index) in columns" :key="column.name">
          <div v-if="column.name.endsWith('overview')" :key="`${tableKeyCurrent}.${column.name}`" :style="{ 'text-align': column.align }">
            <QToggle v-model="toggle[`${props.row.key_normalized}_${column.name}`]" />
          </div>
          <div v-else-if="column.name === tableKeyCurrent" :style="{ 'text-align': column.align }">
            <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: ihr_api.ihr_NumberToAsOrIxp(props.row.key_normalized) } })">
              {{ column.format(props.row[column.name], props.row) }}
            </RouterLink>
          </div>
          <div v-else-if="column.name === `${tableKeyCurrent}_name`" :style="{ 'text-align': column.align }">
            <a href="javascript:void(0)" @click="onASNameKeyClicked(props.row.key_name_truncated, props.row.startpoint_country)" flat no-caps>
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
          <div v-else-if="column.name === alternativeKey || column.is_comma_separated" :style="{ 'text-align': column.align }">
            <div>{{ alternativeASNKeySubtitle(props.row[column.name], column.label) }}</div>
            <div class="alternative_key_body" v-html="props.row[column.name]"></div>
          </div>
          <div v-else :style="{ 'text-align': column.align }">
            {{ column.format(props.row[column.name], props.row) }}
          </div>
        </QTd>
        <QTd v-for="(aggregatedColumn, index) in aggregatedColumns" :key="aggregatedColumn.name" :style="{ 'text-align': aggregatedColumn.align }">
          <div>{{ aggregatedColumn.format(props.row[aggregatedColumn.name], props.row) }}</div>
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="IHR_side_borders">
            <div v-if="alternativeKey">
              <div class="row">
                <div class="col">
                  <QSelect outlined multiple v-model="selectSeveritiesLevels[props.row.key_normalized]" :options="SEVERITIED_LEVELS" label="Severity Levels:" stack-label use-chips />
                </div>
                <div class="col">
                  <QSelect outlined multiple v-model="selectIPAddressFamilies[props.row.key_normalized]" :options="IP_ADDRESS_FAMILIES" label="IP Address Families:" stack-label use-chips />
                </div>
                <div class="col">
                  <QBtn color="primary" class="float-right" @click="resetGranularity(props.row.key_normalized)">Reset Granularity</QBtn>
                </div>
              </div>
              <QCard>
                <QCardSection>
                  <div class="text-h6 center">Aggregated Alarms by Countries</div>
                </QCardSection>
                <QCardSection>
                  <WorldMapAggregatedAlarmsChart :loading="false" :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <div class="text-h6 center">{{ selectedCountry[props.row.key_normalized] ? `Aggregated Alarms by ASN, Alarm Type, and Severity for ${selectedCountry[props.row.key_normalized]}` : 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity' }}</div>
                </QCardSection>
                <QCardSection>
                  <TreeMapAggregatedAlarmsChart :loading="false" :network-name="selectedNetwork[props.row.key_normalized]" :country-name="selectedCountry[props.row.key_normalized]" :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <div class="text-h6 center">{{ selectedCountry[props.row.key_normalized] ? `Alarms by ASNs over Time for ${selectedCountry[props.row.key_normalized]}` : 'Alarms for all Countries over Time' }}</div>
                </QCardSection>
                <QCardSection>
                  <TimeSeriesAggregatedAlarmsChart :loading="false" :network-name="selectedNetwork[props.row.key_normalized]" :country-name="selectedCountry[props.row.key_normalized]" :alarms="alarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized], props.row.key_normalized)" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler($event, props.row.key_normalized)" @select-time="timeFilter($event, props.row.key_normalized)" />
                </QCardSection>
              </QCard>
            </div>
          </div>
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_asn_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div v-if="selectedTableAlarmType == 'hegemony'" v-for="(af) in getOverviewIPAddressFamilies(props.row[`${tableKeyCurrent}_af`])">
            <div style="text-align: center; font-size: 18px;">
              {{ `${getColumnLabel('asn_overview')} IPv${af}` }}
            </div>
            <AsInterdependenciesChart :as-number="props.row.key_normalized" :no-table="true" :fetch="true" :address-family="af" :start-time="startTime" :end-time="endTime" />
          </div>
          <div v-if="selectedTableAlarmType == 'network_delay'" v-for="(af) in getOverviewIPAddressFamilies(props.row[`${tableKeyCurrent}_af`])">
            <div style="text-align: center; font-size: 18px;">
              {{ `${getColumnLabel('asn_overview')} IPv${af}` }}
            </div>
            <NetworkDelayChart :start-time="startTime" :end-time="endTime" :asFamily="af"
              :start-point-name="String(props.row.key_normalized)" start-point-type="AS"
              :end-point-names="getAlternativeKeyEndPointNames(props.row.alternative_key_normalized, props.row.alternative_key_normalized_af, props.row.alternative_key_avg_deviation, 35)"
              :no-table="true" :fetch="true"
            />
          </div>
          <Latencymon v-if="selectedTableAlarmType == 'network_disconnection'"
            :start-time="getNetworkDisconnectionStartTime(props.row.stream_start_time, props.row.stream_duration_minutes, 120)"
            :stop-time="getNetworkDisconnectionEndTime(props.row.stream_end_time, props.row.stream_duration_minutes, 120)"
            :msm-prb-ids="getMeasurementProbeIds(props.row.stream_disconnected_probe_ids)"
            style="max-width: 93%; margin: 0 auto"
          />
          <IodaChart v-if="selectedTableDataSource == 'ioda'"
            :entity-value="iodaEntityValue(props.row, 'asn_overview')"
            :filter-by-country="iodaEntityFilteredByCountry('asn_overview')"
            :start-time="startTime"
            :end-time="endTime"
            :ioda-alarm-types-units="iodaAlarmTypesUnits"
          />
        </QTd>
      </QTr>
      <QTr v-if="toggle[`${props.row.key_normalized}_country_overview`]" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <IodaChart v-if="selectedTableDataSource == 'ioda'"
            :entity-value="iodaEntityValue(props.row, 'country_overview')"
            :filter-by-country="iodaEntityFilteredByCountry('country_overview')"
            :start-time="startTime"
            :end-time="endTime"
            :ioda-alarm-types-units="iodaAlarmTypesUnits"
          />
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