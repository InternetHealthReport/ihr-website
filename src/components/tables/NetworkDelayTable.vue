<script setup>
import { QTable, QTr, QTd } from 'quasar'
import { ref, onMounted } from 'vue'
import commonTable from '@/plugins/commonTable'

const props = defineProps({
  startTime: {
    type: Date,
    required: true
  },
  stopTime: {
    type: Date,
    required: true
  },
  showStart: {
    type: Boolean,
    default: false
  },
  data: {
    type: Array,
    required: false,
    default: () => []
  },
  loading: {
    type: Boolean,
    required: true
  },
  filter: {
    type: String,
    default: ''
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

const { rows, filterTable, prettyName, filterFct, getCellValue } = commonTable(props, { emit })

const pagination = ref({
  sortBy: 'median',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
const visibleColumns = ref(['startpoint', 'endpoint', 'median', 'nbtracks', 'realrtt', 'nbprobes'])
const columns = ref([
  {
    name: 'startpoint',
    required: false,
    label: 'Startpoint',
    align: 'left',
    field: (row) => row.startpoint_type + row.startpoint_name,
    format: (val) => locationNameStr(val),
    sortable: true
  },
  {
    name: 'endpoint',
    required: true,
    label: 'Endpoint',
    align: 'left',
    field: (row) => row.endpoint_type + row.endpoint_name,
    format: (val) => locationNameStr(val),
    sortable: true
  },
  {
    name: 'median',
    required: true,
    label: 'RTT (ms)',
    align: 'center',
    field: (row) => row.median,
    format: (val) => val.toFixed(2),
    sortable: true
  },
  {
    name: 'nbtracks',
    required: true,
    label: 'Nb. Samples',
    align: 'center',
    field: (row) => row.nbtracks,
    format: (val) => val,
    sortable: true
  },
  {
    name: 'realrtt',
    label: 'Nb. Real RTTs',
    align: 'center',
    field: (row) => row.nbrealrtts,
    format: (val) => val,
    sortable: true
  },
  {
    name: 'nbprobes',
    label: 'Nb. Atlas Probes',
    align: 'center',
    field: (row) => row.nbprobes,
    format: (val) => val,
    sortable: true
  }
])

const locationNameStr = (loc) => {
  if (loc.substring(0, 2) == 'CT') {
    return loc.substring(2)
  } else {
    return loc
  }
}

onMounted(() => {
  if (!props.showStart) {
    visibleColumns.value = ['endpoint', 'median', 'nbtracks', 'realrtt', 'nbprobes']
  }
})
</script>

<template>
  <QTable
    v-model:pagination="pagination"
    :rows="rows"
    :columns="columns"
    row-key="link"
    :loading="loading"
    :visible-columns="visibleColumns"
    :filter="filterTable"
    :filter-method="filterFct"
    flat
  >
    <template #body="props">
      <QTr :props="props">
        <QTd v-if="showStart" key="startpoint" :props="props">
          {{ prettyName(getCellValue(props, 'startpoint')) }}
        </QTd>
        <QTd key="endpoint" :props="props">
          {{ prettyName(getCellValue(props, 'endpoint')) }}
        </QTd>
        <QTd key="median" :props="props">
          {{ getCellValue(props, 'median') }}
        </QTd>
        <QTd key="nbtracks" :props="props">
          {{ getCellValue(props, 'nbtracks') }}
        </QTd>
        <QTd key="realrtt" :props="props">
          {{ getCellValue(props, 'realrtt') }}
        </QTd>
        <QTd key="nbprobes" :props="props">
          {{ getCellValue(props, 'nbprobes') }}
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style></style>
