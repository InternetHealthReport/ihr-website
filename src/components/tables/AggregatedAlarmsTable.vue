<script setup>
import { QTable, QTr, QTd, QToggle, QBtn } from 'quasar'
import * as TableAggregatedAlarmsDataModel  from '@/plugins/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { ref, computed, onMounted, watch, inject } from 'vue'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'
import commonTable from '@/plugins/commonTable'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'

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

const tableAlternativeKeyCurrent = computed(() => {
  let alternativeKey = null
  for (const column of columns.value) {
    if (column.name.endsWith('name') && column.name != `${props.tableKeyCurrent}_name`) {
      alternativeKey = column.name.split('_name')[0]
    }
  }
  return alternativeKey
})

const onASNameKeyClicked = (val) => {
  emit('country-clicked', { type: 'button', target: val })
}

const onASCountryKeyClicked = (val) => {
  emit('country-clicked', { type: 'button', target: val })
}

const alternativeASNKeySubtitle = (val, title) => {
  return `${String(val).replaceAll('<br>', ', ').split(', ').length} ${title}`
}

const init = () => {
  const [alarmsTableData, tableColumnsToInclude, tableAggregatedColumnsToInclude] = TableAggregatedAlarmsDataModel.etl(props.alarms, props.selectedTableAlarmType, props.selectedTableDataSource, columns.value, aggregatedColumns.value, props.tableKeyCurrent, tableAlternativeKeyCurrent.value, props.severitiesSelectedList)
  setRows(Object.values(alarmsTableData))
  if (tableColumnsToInclude) {
    columns.value = tableColumnsToInclude
  }
  if (tableAggregatedColumnsToInclude) {
    aggregatedColumns.value = tableAggregatedColumnsToInclude
  }
}

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
            <QToggle v-model="props.expand" />
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
          <div v-else-if="column.name === tableAlternativeKeyCurrent || column.is_comma_separated" :style="{ 'text-align': column.align }">
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