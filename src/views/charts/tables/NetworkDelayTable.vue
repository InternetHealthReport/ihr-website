<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    :visible-columns="visibleColumns"
    :filter="filterTable"
    :filter-method="filterFct"
    flat
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td key="startpoint" :props="props" v-if="showStart">
          {{ prettyName(getCellValue(props, 'startpoint')) }}
        </q-td>
        <q-td key="endpoint" :props="props">
          {{ prettyName(getCellValue(props, 'endpoint')) }}
        </q-td>
        <q-td key="median" :props="props">{{ getCellValue(props, 'median') }}</q-td>
        <q-td key="nbtracks" :props="props">{{ getCellValue(props, 'nbtracks') }}</q-td>
        <q-td key="realrtt" :props="props">
          {{ getCellValue(props, 'realrtt') }}
        </q-td>
        <q-td key="nbprobes" :props="props">
          {{ getCellValue(props, 'nbprobes') }}
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  components: {},
  props: {
    startTime: {
      type: Date,
      required: true,
    },
    stopTime: {
      type: Date,
      required: true,
    },
    showStart: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      pagination: {
        sortBy: 'median',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      visibleColumns: ['startpoint', 'endpoint', 'median', 'nbtracks', 'realrtt', 'nbprobes'],
      columns: [
        {
          name: 'startpoint',
          required: false,
          label: 'Startpoint',
          align: 'left',
          field: row => row.startpoint_type + row.startpoint_name,
          format: val => this.locationNameStr(val),
          sortable: true,
        },
        {
          name: 'endpoint',
          required: true,
          label: 'Endpoint',
          align: 'left',
          field: row => row.endpoint_type + row.endpoint_name,
          format: val => this.locationNameStr(val),
          sortable: true,
        },
        {
          name: 'median',
          required: true,
          label: 'RTT (ms)',
          align: 'center',
          field: row => row.median,
          format: val => val.toFixed(2),
          sortable: true,
        },
        {
          name: 'nbtracks',
          required: true,
          label: 'Nb. Samples',
          align: 'center',
          field: row => row.nbtracks,
          format: val => val,
          sortable: true,
        },
        {
          name: 'realrtt',
          label: 'Nb. Real RTTs',
          align: 'center',
          field: row => row.nbrealrtts,
          format: val => val,
          sortable: true,
        },
        {
          name: 'nbprobes',
          label: 'Nb. Atlas Probes',
          align: 'center',
          field: row => row.nbprobes,
          format: val => val,
          sortable: true,
        },
      ],
    }
  },
  mounted() {
    if (!this.showStart) {
      this.visibleColumns = ['endpoint', 'median', 'nbtracks', 'realrtt', 'nbprobes']
    }
  },
  methods: {
    locationNameStr(loc) {
      if (loc.substring(0, 2) == 'CT') {
        return loc.substring(2)
      } else {
        return loc
      }
    },
  },
}
</script>
<style lang="stylus"></style>
