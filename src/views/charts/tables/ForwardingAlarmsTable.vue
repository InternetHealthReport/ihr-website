<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="resposability"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filterTable"
    :filter-method="filterFct"
    flat
  >
    <template v-slot:body="props">
      <q-tr :props="props" @click.native="props.expand = !props.expand">
        <q-td v-for="col in columns" :key="col.name" :props="props">{{ col.format(col.field(props.row)) }}</q-td>
      </q-tr>
      <!--<q-tr v-if="props.expand" :props="props">-->
      <!--<q-td colspan="100%">-->
      <!--<tracemon :start-time="dateHourShift(props.row.timebin, -1)" :end-time="dateHourShift(props.row.timebin, 1)" :probe-ids="props.row.msm_prb_ids" style="max-width: 93%; margin: 0 auto;"/>-->
      <!--</q-td>-->
      <!--</q-tr>-->
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'
// import Tracemon from "@/components/ripe/Tracemon";

export default {
  mixins: [CommonTableMixin],
  components: {
    // Tracemon
  },
  data() {
    return {
      pagination: {
        sortBy: 'responsibility',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      columns: [
        {
          name: 'reportedIp',
          required: true,
          label: 'Reported IP',
          align: 'center',
          field: row => row.ip,
          format: val => val,
          sortable: false,
        },
        {
          name: 'usualPrecedingIp',
          required: true,
          label: 'Usual Preceding IP',
          align: 'center',
          field: row => row.previoushop,
          format: val => val,
          sortable: true,
        },
        {
          name: 'correlation',
          required: true,
          label: 'Correlation',
          align: 'center',
          field: row => row.correlation,
          format: val => `${val.toFixed(3)}`,
          sortable: true,
        },
        {
          name: 'responsibility',
          label: 'Responsibility',
          align: 'center',
          field: row => row.responsibility,
          format: val => `${val.toFixed(3)}`,
          sortable: true,
        },
      ],
    }
  },
}
</script>
<style lang="stylus"></style>
