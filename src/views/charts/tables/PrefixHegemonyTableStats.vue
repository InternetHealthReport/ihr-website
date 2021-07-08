<i18n src="@/locales/long_langs/documentation.json"></i18n>
<template>
<div> 
    <div> 
        <q-input debounce="300" v-model="tabFilter" placeholder="Search">
            <template v-slot:prepend>
                <q-icon name="fas fa-search" />
            </template>
        </q-input>
    </div> 
    <br>
  <q-table
    :data="rows"
    :columns="columns"
    row-key="ASN"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="tabFilter"
    separator="vertical"
    binary-state-sort
    flat
  >
        <div slot="header" slot-scope="props" style="display: contents">
        <q-tr>
          <q-th key="ASN" :props="props" >ASN</q-th>
          <q-th key="ASName" :props="props" >Name</q-th>
          <q-th key="count" :props="props" >{{columnName}}</q-th>
          <q-th key="total" :props="props" >Total</q-th>
        </q-tr>
        </div>

        <template v-slot:body-cell-ASN="props">
            <q-td :props="props">
                <span :title='props.row.name'>AS{{props.row.asn}}</span>
            </q-td>
        </template>

        <template v-slot:body-cell-count="props">
            <q-td :props="props">
                <ul >
                    <li>
                        Invalid: {{"Invalid" in props.row.count? props.row.count["Invalid"] : 0}}
                    </li>
                    <li>
                        More specific: {{"Invalid,more-specific" in props.row.count? props.row.count["Invalid,more-specific"] : 0}}
                    </li>
                </ul>
            </q-td>
        </template>
  </q-table>
</div> 
</template>

<script>
import CommonTableMixin from "./CommonTableMixin";

export default {
  mixins: [CommonTableMixin],
  props: {
    columnName: {
      type: String,
      default: 'Invalid types'
    }
  },
  data() {

    return {
      pagination: {
        sortBy: "total",
        descending: true,
        page: 1,
        rowsPerPage: 10
      },
      tabFilter: "",
      columns: [
        {
          name: "ASN",
          required: true,
          label: `ASN`,
          align: "center",
          field: row => row.asn,
          format: val => `AS${val}`,
          sortable: true
        },
        {
          name: "ASName",
          required: true,
          label: `AS Name`,
          align: "left",
          field: row => row.name,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "count",
          required: true,
          label: `Count`,
          align: "left",
          field: row => row.count,
          format: val => `${val}`,
          sortable: true
        },
        {
          name: "total",
          required: true,
          label: `Total`,
          align: "left",
          field: row => Object.values(row.count).reduce((a,b) => a+b, 0),
          sortable: true
        }
      ]
    };
  },
  methods: {
    routeToAsn(asn, row) {
      asn = asn.field(row);
      this.$router.push({
        name: "networks",
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(asn) }
      });
    },
    getClassByHegemony(hegemony) {
      if (hegemony >= 25) return "IHR_color-deviation-high-threshold";
      if (hegemony >= 10) return "IHR_color-deviation-mid-threshold";
      return "";
    }
  }
};
</script>
<style lang="stylus">

.comma:not(:empty) ~ .comma:not(:empty):before
  content ", ";

</style>
