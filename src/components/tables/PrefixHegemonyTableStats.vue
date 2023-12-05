<script setup>
import commonTable from '@/plugins/commonTable'
import { QInput, QIcon, QTable, QTr, QTh, QTd } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'

const ihr_api = inject('ihr_api')

const props = defineProps({
  columnName: {
    type: String,
    default: 'Invalid types',
  },
  data: {
    type: Array,
    required: false,
    default: () => []
  },
  loading: {
    type: Boolean,
    required: true,
  },
  filter: {
    type: String,
    default: '',
  }
})

const emit = defineEmits({
  'filteredRows': (filteredSearchRowValues) => {
    if(filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  }
})

const { rows } = commonTable(props, { emit })

const pagination = ref({
  sortBy: 'total',
  descending: true,
  page: 1,
  rowsPerPage: 10,
})
const tabFilter = ref('')
const columns = ref([
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
])

const router = useRouter()

const routeToAsn = (asn, row) => {
  asn = asn.field(row)
  router.push({
    name: 'networks',
    params: { asn: ihr_api.ihr_NumberToAsOrIxp(asn) },
  })
}
const getClassByHegemony = (hegemony) => {
  if (hegemony >= 25) {
    return 'IHR_color-deviation-high-threshold'
  }
  if (hegemony >= 10) {
    return 'IHR_color-deviation-mid-threshold'
  }
  return ''
}
</script>

<template>
  <div>
    <div>
      <QInput debounce="300" v-model="tabFilter" placeholder="Search">
        <template v-slot:prepend>
          <QIcon name="fas fa-search" />
        </template>
      </QInput>
    </div>
    <br />
    <QTable
      :rows="rows"
      :columns="columns"
      row-key="ASN"
      :pagination="pagination"
      :loading="loading"
      :filter="tabFilter"
      separator="vertical"
      binary-state-sort
      flat
    >
      <div slot="header" slot-scope="props" style="display: contents">
        <QTr>
          <q-th key="ASN" :props="props">ASN</q-th>
          <q-th key="ASName" :props="props">Name</q-th>
          <q-th key="invalid" :props="props">{{ columnName }}</q-th>
          <q-th key="specific" :props="props">{{ columnName }} (more specific)</q-th>
          <q-th key="total" :props="props">Total</q-th>
        </QTr>
      </div>

      <template v-slot:body-cell-ASN="props">
        <QTd :props="props">
          <RouterLink
            class="IHR_delikify"
            :to="Tr.i18nRoute({ name: 'networks', params: { asn: ihr_api.ihr_NumberToAsOrIxp(props.row.asn) } })"
          >
            <span :title="props.row.name">AS{{ props.row.asn }}</span>
          </RouterLink>
        </QTd>
      </template>

      <template v-slot:body-cell-ASName="props">
        <QTd :props="props">
          <RouterLink
            class="IHR_delikify"
            :to="Tr.i18nRoute({ name: 'networks', params: { asn: ihr_api.ihr_NumberToAsOrIxp(props.row.asn) } })"
          >
            <span :title="props.row.name">{{ props.row.name }}</span>
          </RouterLink>
        </QTd>
      </template>

      <template v-slot:body-cell-invalid="props">
        <QTd :props="props">
          {{ 'Invalid' in props.row.count ? props.row.count['Invalid'] : 0 }}
        </QTd>
      </template>
      <template v-slot:body-cell-specific="props">
        <QTd :props="props">
          {{ 'Invalid,more-specific' in props.row.count ? props.row.count['Invalid,more-specific'] : 0 }}
        </QTd>
      </template>
    </QTable>
  </div>
</template>

<style lang="stylus">
.comma:not(:empty) ~ .comma:not(:empty):before
  content ", "
</style>