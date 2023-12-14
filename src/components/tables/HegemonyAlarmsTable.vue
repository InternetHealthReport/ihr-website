<script setup>
import { QTable, QTr, QTd, QToggle } from 'quasar'
import AsInterdependenciesChart from '../charts/AsInterdependenciesChart.vue'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import commonTable from '@/plugins/commonTable'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const ihr_api = inject('ihr_api')

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  stopTime: {
    type: Date,
    required: true,
  },
  filter: {
    type: String,
    default: '',
  },
})

const emit = defineEmits({
  'filteredRows': (filteredSearchRowValues) => {
    if(filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  },
  'nbAlarmsDisplayed': (isNbAlarmsDisplayed) => {
    if (isNbAlarmsDisplayed !== null) {
        return true
      } else {
        console.warn('isNbAlarmsDisplayed is missing!');
        return false
      }
  }
})

const { rows, filterFct, filterTable, getCellValue, dateHourShift } = commonTable(props, { emit })

const fetch = ref(true)
const expandedRow = ref([])
const pagination = ref({
  sortBy: 'nbalarms',
  descending: true,
  page: 1,
  rowsPerPage: 5,
})
const columns = ref([
  {
    name: 'overview',
    label: 'Overview',
    align: 'center',
  },
  {
    name: 'originasn',
    required: true,
    label: 'Origin AS',
    align: 'left',
    field: row => row.originasn,
    format: val => ihr_api.ihr_NumberToAsOrIxp(val),
    sortable: true,
  },
  {
    name: 'dependencies',
    required: false,
    label: 'Anomalous Dependencies',
    align: 'left',
    field: row => row.dependencies,
    format: val => ihr_api.sortedKeys(val),
    sortable: false,
  },
  {
    name: 'nbalarms',
    required: true,
    label: 'Nb. Alarms',
    align: 'left',
    field: row => row.nbalarms,
    format: val => val,
    sortable: true,
  },
  {
    name: 'avgdev',
    required: true,
    label: 'Average Deviation',
    align: 'left',
    field: row => row.cumdev / row.nbalarms,
    format: val => val.toFixed(2),
    sortable: true,
  }
])

const computeDataSummary = () => {
  if (!props.data.length) {
    return
  }

  var datasum = {}
  props.data.forEach(alarm => {
    var originasn = alarm.originasn
    if (originasn != 0) {
      if (originasn in datasum) {
        datasum[originasn].nbalarms += 1
        datasum[originasn].cumdev += alarm.deviation
      } else {
        datasum[originasn] = {
          originasn: originasn,
          nbalarms: 1,
          cumdev: alarm.deviation,
          dependencies: {},
        }
      }

      // Add destination
      if (alarm.asn in datasum[originasn].dependencies) {
        datasum[originasn].dependencies[alarm.asn] += alarm.deviation
      } else {
        datasum[originasn].dependencies[alarm.asn] = alarm.deviation
      }
    }
  })

  // Select the AS with the largest number of alarms
  const values = Object.values(datasum)
  const first_row = values.reduce((prev, current) => (prev.nbalarms > current.nbalarms ? prev : current))
  // selectedRow.value = [first_row]

  rows.value = values
}

const dependenciesSubtitle = (val) => {
  return String(Object.keys(val).length) + ' ' + t('charts.hegemonyAlarms.table.dependencies')
}

const dependenciesBody = (val) => {
  let body = ''
  const sortedVal = ihr_api.sortedKeys(val)
  sortedVal.forEach(dest => {
    body += ihr_api.ihr_NumberToAsOrIxp(dest) + ', '
  })

  //Remove the last comma
  body = body.substring(0, body.length - 2)
  return body
}

const nbAlarmsDisplayed = (val) => {
  emits('nbAlarmsDisplayed', val)
}

watch(() => props.data, () => {
  computeDataSummary()
})
watch(() => props.filter, (newValue) => {
  filterTable.value = newValue
})

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
    row-key="originasn"
    v-model:expanded="expandedRow"
    loading-label="Fetching the latest network dependency alarms..."
  >
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd auto-width>
          <QToggle v-model="props.expand" />
        </QTd>
        <QTd key="originasn" align>
          <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: ihr_api.ihr_NumberToAsOrIxp(props.row.originasn) } })">
            {{ ihr_api.ihr_NumberToAsOrIxp(props.row.originasn) }}
          </RouterLink>
        </QTd>
        <QTd key="dependencies">
          {{ dependenciesBody(props.row.dependencies) }}
        </QTd>
        <QTd key="nbalarms">{{ props.row.nbalarms }}</QTd>
        <QTd key="avgdev">{{ (props.row.cumdev / props.row.nbalarms).toFixed(2) }}</QTd>
      </QTr>
      <QTr v-if="props.expand" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="IHR_side_borders">
            <AsInterdependenciesChart :start-time="startTime" :end-time="stopTime" :as-number="props.row.originasn" :fetch="fetch" />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus">
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