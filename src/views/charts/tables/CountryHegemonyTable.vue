<i18n src="@/locales/long_langs/documentation.json"></i18n>
<template>
  <q-table
    :data="rows"
    :columns="columns"
    row-key="asNumber"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="tabFilter"
    separator="vertical"
    binary-state-sort
    flat
  >
    <div slot="header" slot-scope="props" style="display: contents">
      <q-tr>
        <q-th colspan="2"><h3>Autonomous System</h3></q-th>
        <q-th colspan="3"
          ><h3>
            Population coverage
            <q-icon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
            <q-tooltip max-width="360px"
              ><div v-html="$t(`documentationPage.sections.countryasdependency.description[0].body`)"></div
            ></q-tooltip></h3
        ></q-th>
        <q-th colspan="1"
          ><h3>
            AS coverage
            <q-icon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
            <q-tooltip max-width="360px"
              ><div v-html="$t(`documentationPage.sections.countryasdependency.description[1].body`)"></div
            ></q-tooltip></h3
        ></q-th>
      </q-tr>
      <q-tr>
        <q-th></q-th>
        <q-th>
          <q-input dense debounce="300" borderless v-model="tabFilter" placeholder="Search">
            <template v-slot:prepend>
              <q-icon name="fas fa-search" />
            </template>
          </q-input>
        </q-th>
        <q-th key="allEyeball" :props="props">Total</q-th>
        <q-th key="eyeball" :props="props">Direct</q-th>
        <q-th key="transitingEyeball" :props="props">Indirect</q-th>
        <q-th key="transitingAs" :props="props">Total</q-th>
      </q-tr>
    </div>
    <template v-slot:body="props">
      <q-tr :props="props" @click.native="routeToAsn(props.colsMap.asNumber, props.row)" class="IHR_table-row">
        <q-td
          v-for="col in columns"
          :key="col.name"
          :props="props"
          :class="
            col.name == 'allEyeball' || col.name == 'transitingAs' ? ['IHR_important-cell', getClassByHegemony(col.field(props.row))] : ''
          "
          >{{ col.format(col.field(props.row)) }}</q-td
        >
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  data() {
    return {
      pagination: {
        sortBy: 'allEyeball',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      tabFilter: '',
      columns: [
        {
          name: 'asNumber',
          required: true,
          label: 'ASN',
          align: 'center',
          field: row => row.asn,
          format: val => `AS${val}`,
          sortable: true,
        },
        {
          name: 'asName',
          required: true,
          label: 'Autonomous System Name',
          align: 'left',
          field: row => {
            return row.asn_name == '' ? '--' : row.asn_name
          },
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'allEyeball',
          label: 'Population coverage',
          align: 'center',
          field: row => row.hege_eye_all,
          format: val => `${val.toFixed(1)}%`,
          sortable: true,
        },
        {
          name: 'eyeball',
          label: 'Direct',
          align: 'center',
          field: row => row.eyeball,
          format: val => `${val.toFixed(1)}%`,
          sortable: true,
        },
        {
          name: 'transitingEyeball',
          label: 'Indirect',
          align: 'center',
          field: row => row.hege_eye_transit,
          format: val => `${val.toFixed(1)}%`,
          sortable: true,
        },
        {
          name: 'transitingAs',
          label: 'AS coverage',
          align: 'center',
          field: row => row.hege_as,
          format: val => `${val.toFixed(1)}%`,
          sortable: true,
        },
      ],
    }
  },
  methods: {
    routeToAsn(asn, row) {
      asn = asn.field(row)
      this.$router.push({
        name: 'networks',
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(asn) },
      })
    },
    getClassByHegemony(hegemony) {
      if (hegemony >= 25) return 'IHR_color-deviation-high-threshold'
      if (hegemony >= 10) return 'IHR_color-deviation-mid-threshold'
      return ''
    },
  },
}
</script>
<style lang="stylus"></style>
