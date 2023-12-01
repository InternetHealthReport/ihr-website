<template>
    <div class="aggregated-alarms-table">
        <div class="alarm-switches">
            <button v-for="(alarmTypeData, alarmType) in tableData" :key="alarmType" class="rounded-button"
                :class="{ 'selected': selectedTableAlarmType === alarmType && selectedAlarmTypes[alarmType] }"
                @click="selectButton(alarmType)" :disabled="!selectedAlarmTypes[alarmType]">
                {{ alarmTypeData.table_button_text }}
            </button>
        </div>
        <div v-if="anyAlarmTypesSelected && !loadingVal" class="filter-div text">
            <q-input v-model="filter" debounce="300" placeholder="Filter">
                <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                </template>
            </q-input>
        </div>
        <aggregated-alarms-table :table-alarms="tableDataCurrent" :loading="loadingVal" :columns="columns"
            :aggregated-columns="aggregatedColumns" :filter="filter" :row-key="tableKeyCurrent"
            :alternative-key="tableAlternativeKeyCurrent" :time-filters="timeFilters"
            :table-alarm-type="selectedTableAlarmType" :table-data-source="selectedTableDataSource"
            :table-alarm-type-row-columns="alarmsInfo[selectedTableDataSource].alarm_types[selectedTableAlarmType].columns"
            :alarm-type-titles-map="alarmTypeTitlesMap"
            :aggregated-attrs-counts-selected="alarmTypeAggregatedAttrsSelected.counts"
            :aggregated-attrs-zipped="aggregatedAttrsSelectedZipped" :ioda-alarm-types-units="iodaAlarmTypesUnits"
            @asn-country-key-clicked="onCountryClicked" @asn-name-key-clicked="onASNameKeyClicked"
            @filter-country-name-changed="onFilterCountryNameChanged"/>
    </div>
</template>
  
<script>
import AggregatedAlarmsTable from '../tables/AggregatedAlarmsTable.vue'
import * as TableAggregatedAlarmsDataModel from '@/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'

export default {
  components: {
    AggregatedAlarmsTable
  },
  emits: ['asn-country-key-clicked', 'asn-name-key-clicked'],
  props: {
    loadingVal: {
      type: Boolean,
      required: true
    },
    tableDataInitial: {
      type: Object,
      required: true
    },
    groupByKeys: {
      type: Object,
      required: true
    },
    initialTableAlarmTypeSelected: {
      type: String,
      required: true
    },
    alarms: {
      type: Array,
      required: true
    },
    timeFilters: {
      type: Object,
      required: true
    },
    selectedAlarmTypes: {
      type: Object,
      required: true
    },
    countryClicked: {
      type: String,
      required: false
    },
    legendSelected: {
      type: String,
      required: false
    },
    severitiesSelectedList: {
      type: Array,
      required: true
    },
    alarmsInfo: {
      type: Object,
      required: true
    },
    alarmTypeTitlesMap: {
      type: Object,
      required: true
    },
    aggregatedAttrsSelected: {
      type: Object,
      required: true
    }
  },
  computed: {
    iodaAlarmTypesUnits(){
      const iodaAlarmTypesUnitsResult = {}
      for (const iodaAlarmType in this.alarmsInfo.ioda.alarm_types) {
        iodaAlarmTypesUnitsResult[iodaAlarmType] = this.alarmsInfo.ioda.alarm_types[iodaAlarmType].metadata.unit
      }
      return iodaAlarmTypesUnitsResult
    },
    aggregatedAttrsSelectedZipped() {
      return AggregatedAlarmsUtils.zipAggregatedAttrs(this.alarmTypeAggregatedAttrsSelected)
    },
    alarmTypeCountsSelected() {
      return this.alarmTypeAggregatedAttrsSelected.counts ? this.alarmTypeAggregatedAttrsSelected.counts : {}
    },
    alarmTypeAggregatedAttrsSelected() {
      const result = AggregatedAlarmsUtils.flattenDictionary(Object.keys(this.aggregatedAttrsSelected).map((attr) => ({ [attr]: [] })))
      for (let i = 0; i < this.aggregatedAttrsSelected.counts.length; i++) {
        const alarmType = this.aggregatedAttrsSelected.counts[i]
        if (alarmType.startsWith(this.selectedTableAlarmType)) {
          for (const aggregatedKey in this.aggregatedAttrsSelected) {
            result[aggregatedKey] = [this.aggregatedAttrsSelected[aggregatedKey][i]]
          }
          break
        }
      }
      return result
    },
    selectedTableDataSource() {
      for (const dataSource in this.alarmsInfo) {
        const isTheDataSourceSelected = Object.keys(this.alarmsInfo[dataSource].alarm_types).includes(this.selectedTableAlarmType)
        if (isTheDataSourceSelected) {
          return dataSource
        }
      }
      return null
    },
    anyAlarmTypesSelected() {
      return Object.values(this.selectedAlarmTypes).includes(true)
    },
    columns() {
      if (this.anyAlarmTypesSelected) {
        return this.tableColumnsToInclude ? this.tableColumnsToInclude : this.tableCurrent.table_columns
      } else {
        return []
      }
    },
    aggregatedColumns() {
      if (this.anyAlarmTypesSelected) {
        return this.tableAggregatedColumnsToInclude ? this.tableAggregatedColumnsToInclude : this.tableCurrent.table_aggregated_columns
      } else {
        return []
      }
    },
    tableKeyCurrent() {
      return this.groupByKeys[this.selectedTableAlarmType]
    },
    tableAlternativeKeyCurrent() {
      let alternativeKey = null
      for (const column of this.tableCurrent.table_columns) {
        if (column.name.endsWith('name') && column.name != `${this.tableKeyCurrent}_name`) {
          alternativeKey = column.name.split('_name')[0]
        }
      }
      return alternativeKey
    },
    tableCurrent() {
      return this.tableData[this.selectedTableAlarmType]
    }
  },
  watch: {
    filter: {
      handler: function (newFilterValue) {
        this.filter = newFilterValue.trim()
      },
      deep: true
    },
    selectedTableAlarmType: {
      handler: function (_) {
        this.etl(this.alarms, this.countryClicked, this.legendSelected, this.severitiesSelectedList)
      },
      deep: true
    },
    selectedAlarmTypes: {
      handler: function (newSelectedAlarmTypes) {
        if (!newSelectedAlarmTypes[this.selectedTableAlarmType]) {
          this.clearDataViz()
        }
      },
      deep: true
    }
  },
  data() {
    return {
      tableData: this.tableDataInitial,
      selectedTableAlarmType: this.initialTableAlarmTypeSelected,
      tableColumnsToInclude: null,
      tableAggregatedColumnsToInclude: null,
      tableDataCurrent: {},
      filter: ''
    };
  },
  methods: {
    etl(alarms, countryClicked, legendSelected, severitiesSelectedList) {
      const searchQuery = legendSelected ? this.normalizeLegend(legendSelected) : countryClicked ? countryClicked : ''
      const { table_columns, table_aggregated_columns } = this.tableCurrent
      const [alarmsTableData, tableColumnsToInclude, tableAggregatedColumnsToInclude] = TableAggregatedAlarmsDataModel.etl(alarms, this.selectedTableAlarmType, this.selectedTableDataSource, table_columns, table_aggregated_columns, this.tableKeyCurrent, this.tableAlternativeKeyCurrent, severitiesSelectedList)
      this.tableColumnsToInclude = tableColumnsToInclude
      this.tableAggregatedColumnsToInclude = tableAggregatedColumnsToInclude
      this.tableDataCurrent = alarmsTableData
      this.filter = searchQuery
    },
    normalizeLegend(legendText) {
      const regex = /\(([^)]+)\)/g;
      const contentWithParenthesis = regex.exec(legendText);
      let text;
      while (contentWithParenthesis !== null) {
        text = contentWithParenthesis[1];
        break;
      }
      return text ? text : legendText
    },
    selectButton(newSelectedAlarmType) {
      this.tableColumnsToInclude = null
      this.tableAggregatedColumnsToInclude = null
      this.selectedTableAlarmType = newSelectedAlarmType
    },
    onCountryClicked(countryName) {
      this.$emit('asn-country-key-clicked', countryName)
    },
    onASNameKeyClicked(asn, countryName) {
      this.onCountryClicked(countryName)
      this.$emit('asn-name-key-clicked', asn)
    },
    onFilterCountryNameChanged(countryName) {
      this.filter = countryName
    },
    clearDataViz() {
      this.etl([], null, null, this.severitiesSelectedList)
    }

  },
}
</script>
  
<style scoped>
.aggregated-alarms-table {
    margin-top: 20px;
}

.filter-div {
    max-width: 100%;
}

.alarm-switches {
    font-size: 0;
}

.rounded-button {
    padding: 7px 10px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    cursor: pointer;
    background-color: white;
    color: black;
    border: 1px solid rgb(217, 217, 217);
    position: relative;
}

.rounded-button:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
}

.rounded-button:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}

.selected,
.rounded-button:hover {
    color: rgb(56, 117, 246);
    border-color: rgb(56, 117, 246);
}
</style>
  
