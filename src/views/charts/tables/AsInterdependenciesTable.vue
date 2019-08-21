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
      <q-tr 
        :props="props" 
        @click.native="routeToIxp(props.colsMap.asNumber, props.row)" 
        class="IHR_table-row">
        <q-td
          v-for="col in columns"
          :key="col.name"
          :props="props"
          :class="col.name == 'hegemony'? ['IHR_important-cell', getCalssByHegemony(props)] : '' "
        >{{ col.format(col.field(props.row)) }}</q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from "./CommonTableMixin"

export default {
  mixins: [CommonTableMixin],
  props: {
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
    routeToIxp(asn, row) {
      asn = asn.format(asn.field(row));
      let path = this.$route.path;
      let link = "#";
      link += path.substring(0, path.lastIndexOf("/") + 1);
      link += this.$options.filters.ihr_NumberToAsOrIxp(asn);
      window.open(link);
    },
    getCalssByHegemony(props) {
      let hegemony = this.getCellValue(props, 'hegemony');
      if(hegemony >= 0.5 ) return "IHR_color-deviation-hight-threshold"
      if(hegemony >= 0.25) return "IHR_color-deviation-mid-threshold"
      return "";
    }
  }
};
</script>
<style lang="stylus">
</style>
