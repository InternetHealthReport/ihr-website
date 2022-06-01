<template>
  <q-table
    title="Selected ASes"
    :data="rows"
    :columns="columns"
    row-key="rank"
    :pagination.sync="pagination"
    :filter="tabFilter"
    :loading="loading"
    flat
  >
    <template v-slot:top>
      <div class="q-table__title">Selected ASes</div>
      <q-space />
      <q-input debounce="300" v-model="tabFilter" placeholder="Search">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-space />
      <q-btn color="secondary" label="Export to CSV" @click="exportTable" />
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'
import { exportFile } from 'quasar'

function wrapCsvValue(val) {
  val = String(val).split('"').join('""')
  return `"${val}"`
}

export default {
  name: 'MetisTable',
  mixins: [CommonTableMixin],
  data() {
    return {
      pagination: {
        page: 1,
        rowsPerPage: 10,
      },
      tabFilter: '',
      columns: [
        {
          name: 'rank',
          label: 'Rank',
          field: 'rank',
          sortable: true,
        },
        {
          name: 'asNumber',
          label: 'ASN',
          field: 'asn',
          align: 'left',
          sortable: true,
        },
        {
          name: 'asName',
          label: 'Autonomous System Name',
          field: 'asn_name',
          align: 'left',
          sortable: true,
        },
        {
          name: 'cc',
          label: 'Country',
          field: 'cc',
          sortable: true,
        },
      ],
    }
  },
  methods: {
    exportTable() {
      const content = [this.columns.map(col => wrapCsvValue(col.field))]
        .concat(this.rows.map(row => this.columns.map(col => wrapCsvValue(row[col.field])).join(',')))
        .join('\n')

      const status = exportFile('selected-ases.csv', content, 'text/csv')

      if (status !== true) {
        this.$q.notify({
          message: 'Browser denied file download...',
          color: 'negative',
          icon: 'warning',
        })
      }
    },
  },
}
</script>
