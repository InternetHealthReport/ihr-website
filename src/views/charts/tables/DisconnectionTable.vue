
<template>
   <q-table
    :data="data"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  />
</template>

<script>
import CommonTableMixin from "./CommonTableMixin";
import Tracemon from "@/components/ripe/Tracemon";

export default {
   mixins: [CommonTableMixin],
  components: {
    Tracemon
  },
  data() {
    return {
      pagination: {
        sortBy: "starttime",
        descending: true,
        page: 1,
        rowsPerPage: 8
      },
      columns: [
        {
          name: "starttime",
          required: true,
          label: this.$t('charts.disconnections.table.startTime'),
          align: "center",
          field: row => row.starttime,
          format: val => val,
          sortable: true
        },
        {
          name: "endtime",
          required: true,
          label: this.$t('charts.disconnections.table.endTime'),
          align: "center",
          field: row => row.endtime,
          format: val => val,
          sortable: true
        },
        {
          name: "ipv4",
          required: true,
          label: "ip v4",
          align: "center",
          field: row => row.ipv4,
          format: val => val,
          sortable: false
        },
        {
          name: "prefixv4",
          required: true,
          label: this.$t('prefix') + " v4",
          align: "center",
          field: row => row.prefixv4,
          format: val => val,
          sortable: false
        },
        {
          name: "probe_id",
          required: true,
          label: "probe id",
          align: "center",
          field: row => row.probe_id,
          format: val => val,
          sortable: true
        },
        {
          name: "level",
          required: true,
          label: this.$t('charts.disconnections.table.level'),
          align: "center",
          field: row => row.level,
          format: val => val,
          sortable: true
        },
      ]
    };
  },
}
</script>

<style lang="stylus" scoped>

</style>