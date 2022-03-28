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
    <br />
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
          <q-th key="ASN" :props="props">ASN</q-th>
          <q-th key="ASName" :props="props">Name</q-th>
          <q-th key="invalid" :props="props">{{ columnName }}</q-th>
          <q-th key="specific" :props="props">{{ columnName }} (more specific)</q-th>
          <q-th key="total" :props="props">Total</q-th>
        </q-tr>
      </div>

      <template v-slot:body-cell-ASN="props">
        <q-td :props="props">
          <router-link
            class="IHR_delikify"
            :to="{ name: 'networks', params: { asn: $options.filters.ihr_NumberToAsOrIxp(props.row.asn) } }"
          >
            <span :title="props.row.name">AS{{ props.row.asn }}</span>
          </router-link>
        </q-td>
      </template>

      <template v-slot:body-cell-ASName="props">
        <q-td :props="props">
          <router-link
            class="IHR_delikify"
            :to="{ name: 'networks', params: { asn: $options.filters.ihr_NumberToAsOrIxp(props.row.asn) } }"
          >
            <span :title="props.row.name">{{ props.row.name }}</span>
          </router-link>
        </q-td>
      </template>

      <template v-slot:body-cell-invalid="props">
        <q-td :props="props">
          {{ 'Invalid' in props.row.count ? props.row.count['Invalid'] : 0 }}
        </q-td>
      </template>
      <template v-slot:body-cell-specific="props">
        <q-td :props="props">
          {{ 'Invalid,more-specific' in props.row.count ? props.row.count['Invalid,more-specific'] : 0 }}
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  props: {
    columnName: {
      type: String,
      default: 'Invalid types',
    },
  },
  data() {
    return {
      pagination: {
        sortBy: 'total',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      tabFilter: '',
      columns: [
        {
          name: 'ASN',
          required: true,
          label: 'ASN',
          align: 'center',
          field: row => row.asn,
          format: val => `AS${val}`,
          sortable: true,
        },
        {
          name: 'ASName',
          required: true,
          label: 'AS Name',
          align: 'left',
          field: row => row.name,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'invalid',
          required: true,
          label: 'Invalid',
          align: 'center',
          field: row => row.count['Invalid'],
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'specific',
          required: true,
          label: 'Invalid (more specific)',
          align: 'center',
          field: row => row.count['Invalid,more-specific'],
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'total',
          required: true,
          label: 'Total',
          align: 'left',
          field: row => Object.values(row.count).reduce((a, b) => a + b, 0),
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
<style lang="stylus">

.comma:not(:empty) ~ .comma:not(:empty):before
  content ", ";
</style>
