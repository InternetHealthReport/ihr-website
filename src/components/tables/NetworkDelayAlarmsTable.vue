<script setup>
import { QTable, QTr, QTd, QToggle } from 'quasar'
import { ref, onMounted, watch, inject } from 'vue'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import commonTable from '@/plugins/commonTable'
import { useI18n } from 'vue-i18n'
import NetworkDelayChart from '../charts/NetworkDelayChart.vue'

const ihr_api = inject('ihr_api')

const { t } = useI18n()

const MAX_NETDELAY_PLOTS = 12

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  stopTime: {
    type: Date,
    required: true
  },
  filter: {
    type: String
  }
})

const emit = defineEmits({
  filteredRows: (filteredSearchRowValues) => {
    if (filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  }
})

const { rows, filterFct, filterTable } = commonTable(props, { emit })

const expandedRow = ref([])
const pagination = ref({
  sortBy: 'nbalarms',
  descending: true,
  page: 1,
  rowsPerPage: 5
})
const columns = ref([
  {
    name: 'overview',
    label: 'Overview',
    align: 'center'
  },
  {
    name: 'asNumber',
    required: true,
    label: 'Source',
    align: 'left',
    field: (row) => row.asNumber,
    format: (val) => ihr_api.ihr_NumberToAsOrIxp(val),
    sortable: true
  },
  {
    name: 'destinations',
    required: false,
    label: 'Destinations',
    align: 'left',
    field: (row) => row.endpoints,
    format: (val) => ihr_api.sortedKeys(val),
    sortable: false
  },
  {
    name: 'nbalarms',
    required: true,
    label: 'Nb. Alarms',
    align: 'left',
    field: (row) => row.nbalarms,
    format: (val) => val,
    sortable: true
  },
  {
    name: 'avgdev',
    required: true,
    label: 'Average Deviation',
    align: 'left',
    field: (row) => row.cumdev / row.nbalarms,
    format: (val) => val.toFixed(2),
    sortable: true
  }
])

const computeDataSummary = () => {
  if (!props.data.length) {
    return
  }

  const datasum = {}
  props.data.forEach((alarm) => {
    const start = alarm.startpoint_type + alarm.startpoint_name
    const asNumber =
      alarm.type == 'IX' ? -parseInt(alarm.startpoint_name) : parseInt(alarm.startpoint_name)
    if (asNumber != 0) {
      if (start in datasum) {
        datasum[start].nbalarms += 1
        datasum[start].cumdev += alarm.deviation
      } else {
        datasum[start] = {
          asNumber: asNumber,
          nbalarms: 1,
          cumdev: alarm.deviation,
          endpoints: {}
        }
      }

      // Add destination
      var end = alarm.endpoint_type + alarm.endpoint_name
      if (end in datasum[start].endpoints) {
        datasum[start].endpoints[end] += alarm.deviation
      } else {
        datasum[start].endpoints[end] = alarm.deviation
      }
    }
  })

  rows.value = Object.values(datasum)
}

const destinationsSubtitle = (val) => {
  if (Object.keys(val).length === 1) {
    return (
      String(Object.keys(val).length) +
      ' ' +
      t('charts.networkDelayAlarms.table.destinations').slice(0, -1)
    )
  }
  return String(Object.keys(val).length) + ' ' + t('charts.networkDelayAlarms.table.destinations')
}

const destinationsBody = (val) => {
  let body = ''
  Object.keys(val).forEach((dest) => {
    const loc = dest.startsWith('CT') ? dest.substring(2) : dest
    body += loc + ', '
  })

  // Remove the last comma
  return body.substring(0, body.length - 2)
}

const endpointKeys = (endpoints) => {
  let keys = []
  // Compute endpoints keys
  for (const key of Object.keys(endpoints)) {
    const type = key.substring(0, 2)
    const name = key.substring(2)
    const af = '4' //TODO get this value from global settings
    keys.push(type + af + name)
  }

  // Limit the number of values to display
  if (keys.length > MAX_NETDELAY_PLOTS) {
    keys = keys.slice(0, MAX_NETDELAY_PLOTS)
  }

  return keys
}

watch(
  () => props.data,
  () => {
    computeDataSummary()
  }
)

onMounted(() => {
  computeDataSummary()
})
</script>

<template>
  <QTable
    table-class="myClass"
    :rows="rows"
    :columns="columns"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filterTable"
    :filter-method="filterFct"
    binary-state-sort
    flat
    row-key="asNumber"
    v-model:expanded="expandedRow"
    loading-label="Fetching latest network delay alarms..."
  >
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd auto-width>
          <QToggle v-model="props.expand" />
        </QTd>
        <QTd key="asNumber" align>
          <RouterLink
            :to="
              Tr.i18nRoute({
                name: 'network',
                params: { asn: ihr_api.ihr_NumberToAsOrIxp(props.row.asNumber) }
              })
            "
          >
            {{ ihr_api.ihr_NumberToAsOrIxp(props.row.asNumber) }}
          </RouterLink>
        </QTd>
        <QTd key="destinations" class="IHR_ndelay_table_cell">
          <div>{{ destinationsSubtitle(props.row.endpoints) }}</div>
          <div class="IHR_ndelay_destinations">
            {{ destinationsBody(props.row.endpoints) }}
          </div>
        </QTd>
        <QTd key="nbalarms">{{ props.row.nbalarms }}</QTd>
        <QTd key="avgdev">{{ (props.row.cumdev / props.row.nbalarms).toFixed(2) }}</QTd>
      </QTr>
      <QTr v-if="props.expand" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="IHR_side_borders">
            <NetworkDelayChart
              :start-time="startTime"
              :end-time="stopTime"
              :startPointName="String(props.row.asNumber)"
              :startPointType="props.row.asNumber > 0 ? 'AS' : 'IX'"
              :endPointNames="endpointKeys(props.row.endpoints)"
              fetch
            />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus">
.IHR_ndelay_table_cell
    max-width 700px

.IHR_ndelay_destinations
    text-overflow ellipsis
    /* Required for text-overflow to do anything */
    white-space nowrap
    overflow hidden
    font-style italic
    color #555

.IHR_nohover
    &:first-child
      padding-top 0px
      padding-bottom 20px
      padding-right 20px
      padding-left 20px
      background #fafafa

.IHR_side_borders
    &:first-child
        padding-top 20px
        border-style solid
        border-color #dddddd
        border-top-width 0px
        border-left-width 1px
        border-right-width 1px
        border-bottom-width 1px
        border-radius 5px
        background #ffffff


.myClass

    tbody td
        text-align left
</style>
