<template>
  <q-table
    :title="title"
    :data="data"
    :columns="columns"
    row-key="name"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  />
</template>

<script>
import { date } from "quasar";

export default {
  props: {
    asNumber: {
      type: Number,
      required: true
    },
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
        sortBy: "name",
        descending: false,
        page: 1,
        rowsPerPage: 8
      },
      columns: [
        {
          name: "asName",
          required: true,
          label: "Autonomous System",
          align: "left",
          field: row => row.asn_name,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "hegemony",
          label: "hegemony",
          align: "center",
          field: row => row.hege,
          format: val => `${val.toFixed(3)}`,
          sortable: true
        },
        {
          name: "hegemonyIncrement",
          label: `hegemony ${this.$t('charts.tables.asInterdependencies.increment')}`,
          align: "center",
          field: row => row.increment,
          format: val => {return (val == undefined) ? "--": val.toFixed(3)},
          classes(val) {
            let colorClass;
            if(val < 0)
              colorClass = "increse";
            else if(val > 0)
              colorClass = "decrease";
            else
              colorClass = "stable";
            return `IHR_color-increment IHR_color-increment-${colorClass}`;
          },
          sortable: true
        }
      ]
    };
  },
  methods: {},
  computed: {
    title() {
      let text = this.$t("charts.tables.asInterdependencies.title");
      text += ` AS${this.asNumber} `;
      text += `(${date.formatDate(this.dateTime, "YYYY-MM-DD HH:mm")})`;
      return text;
    }
  }
};
</script>
<style lang="stylus">
.IHR_
    &color-increment
      font-weight 400
      &-increse
        color green
      &-decrease
        color red
      &-stable
        color black
</style>
