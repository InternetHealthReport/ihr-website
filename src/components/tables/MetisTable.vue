<script setup>
import { QTable, QSpace, QInput, QIcon, QBtn, useQuasar, exportFile } from 'quasar'
import { ref } from 'vue'
import commonTable from '@/plugins/commonTable'

const props = defineProps({
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

const { rows } = commonTable(props, { emit })

const wrapCsvValue = (val) => {
  val = String(val).split('"').join('""')
  return `"${val}"`
}

const pagination = ref({
  page: 1,
  rowsPerPage: 10
})
const tabFilter = ref('')
const columns = ref([
  {
    name: 'rank',
    label: 'Rank',
    field: 'rank',
    sortable: true
  },
  {
    name: 'asNumber',
    label: 'ASN',
    field: 'asn',
    align: 'left',
    sortable: true
  },
  {
    name: 'asName',
    label: 'Autonomous System Name',
    field: 'asn_name',
    align: 'left',
    sortable: true
  },
  {
    name: 'cc',
    label: 'Country',
    field: 'cc',
    sortable: true
  }
])

const $q = useQuasar()

const exportTable = () => {
  const content = [columns.value.map((col) => wrapCsvValue(col.field))]
    .concat(
      rows.value.map((row) => columns.value.map((col) => wrapCsvValue(row[col.field])).join(','))
    )
    .join('\n')

  const status = exportFile('selected-ases.csv', content, 'text/csv')

  if (status !== true) {
    $q.notify({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning'
    })
  }
}
</script>

<template>
  <QTable
    v-model:pagination="pagination"
    title="Selected ASes"
    :rows="rows"
    :columns="columns"
    row-key="rank"
    :filter="tabFilter"
    :loading="loading"
    flat
  >
    <template #top>
      <div class="q-table__title">
        Selected ASes
      </div>
      <QSpace />
      <QInput
        v-model="tabFilter"
        debounce="300"
        placeholder="Search"
      >
        <template #prepend>
          <QIcon name="search" />
        </template>
      </QInput>
      <QSpace />
      <QBtn
        color="secondary"
        label="Export to CSV"
        @click="exportTable"
      />
    </template>
  </QTable>
</template>

<style></style>
