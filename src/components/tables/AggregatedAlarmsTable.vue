<script setup>
import { QTable, QTr, QTd, QToggle, QCard, QCardSection } from 'quasar'
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

const ihr_api = inject('ihr_api')

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

const tableAlternativeKeyCurrent = () => {
  for (const column of columns.value) {
    if (column.name.endsWith('name') && column.name != `${props.tableKeyCurrent}_name`) {
      alternativeKey.value = column.name.split('_name')[0]
    }
  }
}

const onASNameKeyClicked = (val) => {
  emit('country-clicked', { type: 'button', target: val })
}

const onASCountryKeyClicked = (val) => {
  emit('country-clicked', { type: 'button', target: val })
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

const initToggle = () => {
  toggle.value = {}
  rows.value.forEach(val => {
    for (const key in val) {
      toggle.value[`${val.key_normalized}_overview`] = false
      toggle.value[`${val.key_normalized}_asn_overview`] = false
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
            <a href="javascript:void(0)" @click="onASNameKeyClicked(props.row.key_name_truncated)" flat no-caps>
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
            <div class="alternative_key_body">{{ props.row[column.name] }}</div>
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
              <QCard>
                <QCardSection>
                  <WorldMapAggregatedAlarmsChart :loading="false" :alarms="getAlarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized])" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <TimeSeriesAggregatedAlarmsChart :loading="false" :alarms="getAlarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized])" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" :is-a-s-granularity="true" />
                </QCardSection>
              </QCard>
              <QCard>
                <QCardSection>
                  <TreeMapAggregatedAlarmsChart :loading="false" :alarms="getAlarmsCurrent(alarmsTableDataFromModel[props.row.key_normalized])" :aggregated-attrs-selected="alarmTypeAggregatedAttrsSelected" :alarm-type-titles-map="alarmTypeTitlesMap" :is-a-s-granularity="true" />
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