<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="resposability"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  >
    <template v-slot:body="props">
      <q-tr
        :props="props"
        @click.native="props.expand = !props.expand">
        <q-td
          v-for="col in columns"
          :key="col.name"
          :props="props"
        >{{ col.format(col.field(props.row)) }}</q-td>
      </q-tr>
      <!--
      <q-tr v-if="props.expand" :props="props">
        <q-td colspan="100%">
          <tracemon :utc-time="dateTime" :propb-ids="props.row.msm_prb_ids" style="max-width: 93%; margin: 0 auto;"/>
        </q-td>
      </q-tr>
      -->
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from "./CommonTableMixin"
import Tracemon from "@/components/ripe/Tracemon";

export default {
  mixins: [CommonTableMixin],
  components: {
    Tracemon
  },
  data() {
    return {
      pagination: {
        sortBy: "responsibility",
        descending: true,
        page: 1,
        rowsPerPage: 8
      },
      columns: [
        {
          name: "reportedIp",
          required: true,
          label: this.$t('charts.delayAndForwarding.tables.forwarding.reportedIp'),
          align: "center",
          field: row => row.ip,
          format: val => val,
          sortable: false
        },
        {
          name: "usualPrecedingIp",
          required: true,
          label: this.$t('charts.delayAndForwarding.tables.forwarding.usualPrecedingIP'),
          align: "center",
          field: row => row.previoushop,
          format: val => val,
          sortable: true
        },
        {
          name: "correlation",
          required: true,
          label: this.$t('charts.delayAndForwarding.tables.forwarding.correlation'),
          align: "center",
          field: row => row.correlation,
          format: val => `${val.toFixed(3)}`,
          sortable: true
        },
        {
          name: "responsibility",
          label: this.$t('charts.delayAndForwarding.tables.forwarding.responsibility'),
          align: "center",
          field: row => row.responsibility,
          format: val => `${val.toFixed(3)}`,
          sortable: true
        }
      ]
    };
  }
};
</script>
<style lang="stylus"></style>
