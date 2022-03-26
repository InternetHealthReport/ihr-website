<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    flat
    :filter="filterTable"
    :filter-method="filterFct"
  />
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  components: {},
  data() {
    return {
      pagination: {
        sortBy: 'starttime',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      columns: [
        {
          name: 'starttime',
          required: true,
          label: 'Disconnection Time',
          align: 'center',
          field: row => row.starttime,
          format: val => val,
          sortable: true,
        },
        {
          name: 'endtime',
          required: true,
          label: 'Reconnection Time',
          align: 'center',
          field: row => row.endtime,
          format: val => val,
          sortable: true,
        },
        {
          name: 'prefixv4',
          required: true,
          label: 'IP Prefix',
          align: 'center',
          field: row => row.prefixv4,
          format: val => val,
          sortable: false,
        },
        {
          name: 'probe_id',
          required: true,
          label: 'Probe ID',
          align: 'center',
          field: row => row.probe_id,
          format: val => val,
          sortable: true,
        },
      ],
    }
  },
}
</script>

<style lang="stylus" scoped></style>
