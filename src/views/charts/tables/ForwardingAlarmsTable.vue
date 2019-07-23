<template>
  <q-table
    :title="title"
    :data="data"
    :columns="columns"
    row-key="resposability"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  />
</template>

<script>
import { date } from "quasar";

export default {
  props: {
    dateTime: {
      type: Date,
      required: true
    },
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
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
  },
  methods: {},
  computed: {
    title() {
      return `${this.$t(
        "charts.delayAndForwarding.tables.delay.delayAnomalies"
      )}(${date.formatDate(this.dateTime, "YYYY-MM-DD HH:mm")})`;
    }
  }
};
</script>
<style lang="stylus"></style>
