<template>
  <q-table
    :data="data"
    :columns="columns"
    row-key="asNumber"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
  >
    <template v-slot:body="props">
      <q-tr :props="props" @click="routeToIxp(props.row.key)">
        <q-td
          v-for="col in columns"
          :key="col.name"
          :class="hegClass(col.name, col.field(props.row))"
          :props="props"
        >{{ col.format(col.field(props.row)) }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import { date } from "quasar";

export default {
  props: {
    data: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    useOriginAsn: {
      type: Boolean
    }
  },
  data() {
    let columns;
    if (this.useOriginAsn) {
      columns = [
        {
          name: "asName",
          required: true,
          label: "Origin Autonomous System",
          align: "left",
          field: row => {
            return row.originasn_name == "" ? "--" : row.originasn_name;
          },
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "asNumber",
          required: true,
          label: `origin ${this.$t("asn")}`,
          align: "left",
          field: row => row.originasn,
          format: val => val,
          sortable: true
        }
      ];
    } else {
      columns = [
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
          name: "asNumber",
          required: true,
          label: this.$t("asn"),
          align: "left",
          field: row => row.asn,
          format: val => val,
          sortable: true
        }
      ];
    }

    return {
      pagination: {
        sortBy: "hegemony",
        descending: true,
        page: 1,
        rowsPerPage: 8
      },
      columns: [
        ...columns,
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
          label: `hegemony ${this.$t(
            "charts.asInterdependencies.table.increment"
          )}`,
          align: "center",
          field: row => row.increment,
          format: val => {
            if (val == undefined) return "--";
            if (val > 0) return "+" + val.toFixed(3);
            return val.toFixed(3);
          },
          sortable: true
        }
      ]
    };
  },
  methods: {
    hegClass(name, value) {
      if (name != "hegemonyIncrement") return "";
      let colorClass;
      if (value < 0) colorClass = "decrease";
      else if (value > 0) colorClass = "increse";
      else colorClass = "stable";
      return `IHR_color-increment IHR_color-increment-${colorClass}`;
    },
    routeToIxp(asn) {
      this.$router.push({
        name: "as_and_ixp",
        params: { asn: this.$options.filters.ihr_getAsOrIxp(props.row.key) },
        target: "_blank"
      });
    }
  }
};
</script>
<style lang="stylus">
.IHR_
  &color-increment
    font-weight 600

    &-increse
      color green

    &-decrease
      color red

    &-stable
      color black
</style>
