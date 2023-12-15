<script setup>
import { QTable } from 'quasar'
import * as TableAggregatedAlarmsDataModel  from '@/plugins/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { ref, computed, onMounted } from 'vue'

const COLUMNS_DATA = {
  hegemony: [
    { name: 'overview', label: 'Overview', align: 'center' },
    { name: 'asn_overview', label: 'Neighbor Dependency Overview', align: 'center' },
    { name: 'origin_asn', required: true, label: 'Origin AS', align: 'left', field: row => row.origin_asn, format: val => `${val}`, sortable: true },
    { name: 'origin_asn_name', required: true, label: 'Origin AS Name', align: 'left', field: row => row.origin_asn_name, format: val => `${val}`, sortable: false },
    { name: 'origin_asn_af', required: true, label: 'Origin AS IP Address Family', align: 'left', field: row => row.origin_asn_af, format: val => `${val}`, sortable: true },
    { name: 'origin_asn_country', required: true, label: 'Origin Country', align: 'left', field: row => row.origin_asn_country, format: val => `${val}`, sortable: true },
    { name: 'origin_asn_country_iso_code3', required: true, label: 'Origin Country Code', align: 'left', field: row => row.origin_asn_country_iso_code3, format: val => `${val}`, sortable: true },
    { name: 'asn', required: true, label: 'Anomalous Dependency', align: 'left', field: row => row.asn, format: val => `${val}`, sortable: true },
    { name: 'asn_name', required: true, label: 'Anomalous Dependency Name', align: 'left', field: row => row.asn_name, format: val => `${val}`, sortable: false },
    { name: 'asn_af', required: true, label: 'Anomalous Dependency IP Address Family', align: 'left', field: row => row.asn_af, format: val => `${val}`, sortable: true },
    { name: 'asn_country', required: true, label: 'Anomalous Dependency Country', align: 'left', field: row => row.asn_country, format: val => `${val}`, sortable: true },
  ],
  network_delay: [
    { name: 'overview', label: 'Overview', align: 'center' },
    { name: 'asn_overview', label: 'Round Trip Time Overview', align: 'center' },
    { name: 'startpoint', required: true, label: 'Source', align: 'left', field: row => row.startpoint, format: val => `${val}`, sortable: true },
    { name: 'startpoint_name', required: true, label: 'Source Name', align: 'left', field: row => row.startpoint_name, format: val => `${val}`, sortable: false },
    { name: 'startpoint_af', required: true, label: 'Source IP Address Family', align: 'left', field: row => row.startpoint_af, format: val => `${val}`, sortable: true },
    { name: 'startpoint_country', required: true, label: 'Source Country', align: 'left', field: row => row.startpoint_country, format: val => `${val}`, sortable: true },
    { name: 'startpoint_country_iso_code3', required: true, label: 'Source Country Code', align: 'left', field: row => row.startpoint_country_iso_code3, format: val => `${val}`, sortable: true },
    { name: 'endpoint', required: true, label: 'Destination', align: 'left', field: row => row.endpoint, format: val => `${val}`, sortable: true },
    { name: 'endpoint_name', required: true, label: 'Destination Name', align: 'left', field: row => row.endpoint_name, format: val => `${val}`, sortable: false },
    { name: 'endpoint_af', required: true, label: 'Destination IP Address Family', align: 'left', field: row => row.endpoint_af, format: val => `${val}`, sortable: true },
    { name: 'endpoint_country', required: true, label: 'Destination Country', align: 'left', field: row => row.endpoint_country, format: val => `${val}`, sortable: false },
  ],
  moas: [],
  submoas: [],
  defcon: [],
  edges: [],
  ping_slash24: [],
  bgp: [],
  ucsd_nt: []
}

const AGGREGATED_COLUMNS_DATA = {
  hegemony: [
    { name: 'total_count', required: true, label: 'Nb. Alarms', align: 'left', field: row => row.total_count, format: val => `${val}`, sortable: true },
    { name: 'high_severity_count', required: true, label: 'Nb. High Severity Alarms', align: 'left', field: row => row.high_severity_count, format: val => `${val}`, sortable: true },
    { name: 'medium_severity_count', required: true, label: 'Nb. Medium Severity Alarms', align: 'left', field: row => row.medium_severity_count, format: val => `${val}`, sortable: true },
    { name: 'low_severity_count', required: true, label: 'Nb. Low Severity Alarms', align: 'left', field: row => row.low_severity_count, format: val => `${val}`, sortable: true },
    { name: 'deviation_median', required: true, label: 'Median Deviation', align: 'left', field: row => row.deviation_median, format: val => `${val}`, sortable: true },
    { name: 'deviation_avg', required: true, label: 'Average Deviation', align: 'left', field: row => row.deviation_avg, format: val => `${val}`, sortable: true }
  ],
  network_delay: [
    { name: 'stream_disconnected_probe_percentage', required: false, label: 'Disconnected Probe %', align: 'left', field: row => row.stream_disconnected_probe_percentage, format: val => `${val}`, sortable: true },
    { name: 'total_count', required: true, label: 'Nb. Alarms', align: 'left', field: row => row.total_count, format: val => `${val}`, sortable: true },
    { name: 'high_severity_count', required: true, label: 'Nb. High Severity Alarms', align: 'left', field: row => row.high_severity_count, format: val => `${val}`, sortable: true },
    { name: 'medium_severity_count', required: true, label: 'Nb. Medium Severity Alarms', align: 'left', field: row => row.medium_severity_count, format: val => `${val}`, sortable: true },
    { name: 'low_severity_count', required: true, label: 'Nb. Low Severity Alarms', align: 'left', field: row => row.low_severity_count, format: val => `${val}`, sortable: true },
    { name: 'deviation_median', required: true, label: 'Median Deviation', align: 'left', field: row => row.deviation_avg, format: val => `${val}`, sortable: true },
    { name: 'deviation_avg', required: true, label: 'Average Deviation', align: 'left', field: row => row.deviation_avg, format: val => `${val}`, sortable: true },
    { name: 'duration_median', required: true, label: 'Median Duration (minutes)', align: 'left', field: row => row.duration_median, format: val => `${val}`, sortable: true },
    { name: 'duration_avg', required: true, label: 'Average Duration (minutes)', align: 'left', field: row => row.duration_avg, format: val => `${val}`, sortable: true },
  ],
  moas: [],
  submoas: [],
  defcon: [],
  edges: [],
  ping_slash24: [],
  bgp: [],
  ucsd_nt: []
}

const METADATA = {
  hegemony: {
    default_key: 'origin_asn'
  },
  network_delay: {
    default_key: 'startpoint'
  },
  moas: {
    default_key: 'asn_attacker'
  },
  submoas: {
    default_key: 'asn_attacker'
  },
  defcon: {
    default_key: 'asn_attacker'
  },
  edges: {
    default_key: 'asn_attacker'
  },
  ping_slash24: {
    default_key: 'entity'
  },
  bgp: {
    default_key: 'entity'
  },
  ucsd_nt: {
    default_key: 'entity'
  }
}

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
  }
})

const columns = ref(COLUMNS_DATA[props.selectedTableAlarmType])
const aggregatedColumns = ref(AGGREGATED_COLUMNS_DATA[props.selectedTableAlarmType])
const tableKeyCurrent = ref(METADATA[props.selectedTableAlarmType].default_key)

const tableAlternativeKeyCurrent = computed(() => {
  let alternativeKey = null
  for (const column of columns.value) {
    if (column.name.endsWith('name') && column.name != `${tableKeyCurrent.value}_name`) {
      alternativeKey = column.name.split('_name')[0]
    }
  }
  return alternativeKey
})

const init = () => {
  const [alarmsTableData, tableColumnsToInclude, tableAggregatedColumnsToInclude] = TableAggregatedAlarmsDataModel.etl(props.alarms, props.selectedTableAlarmType, props.selectedTableDataSource, columns.value, aggregatedColumns.value, tableKeyCurrent.value, tableAlternativeKeyCurrent.value, props.severitiesSelectedList)
  console.log(alarmsTableData)
  // console.log(tableColumnsToInclude)
  // console.log(tableAggregatedColumnsToInclude)
}

onMounted(() => {
  init()
})
</script>

<template>
  {{ selectedTableAlarmType }}
  {{ selectedTableDataSource }}
  <!-- <QTable
    rows=""
    columns=""
    pagination.sync=""
    loading=""
    filter=""
  >

  </QTable> -->
</template>