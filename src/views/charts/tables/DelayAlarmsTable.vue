<template>
  <q-table
    :title="title"
    :data="data"
    :columns="columns"
    row-key="link"
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
        sortBy: "deviation",
        descending: true,
        page: 1,
        rowsPerPage: 8
      },
      columns: [
        {
          name: "link",
          required: true,
          label: "Link",
          align: "center",
          field: row => row.link,
          format: val => val,
          sortable: false
        },
        {
          name: "delayChange",
          required: true,
          label: this.$t('charts.delayAndForwarding.tables.delay.delayChange'),
          align: "center",
          field: row => row.diffmedian,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "deviation",
          required: true,
          label: this.$t("charts.delayAndForwarding.tables.delay.deviation"),
          align: "center",
          field: row => row.deviation,
          format: val => val.toFixed(2),
          sortable: true
        },
        {
          name: "probes",
          label: "#Probes",
          align: "center",
          field: row => row.nprobes,
          format: val => val,
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
