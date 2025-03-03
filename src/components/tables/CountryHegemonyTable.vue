<script setup>
import { QTable, QTr, QTh, QIcon, QTooltip, QInput, QTd } from 'quasar'
import { ref, inject } from 'vue'
import commonTable from '@/plugins/commonTable'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'

const iht_api = inject('ihr_api')

const router = useRouter()
const route = useRoute()

const props = defineProps({
  data: {
    type: Array,
    required: false,
    default: () => []
  },
  loading: {
    type: Boolean,
    required: true
  },
  filter: {
    type: String,
    default: ''
  }
})

const emit = defineEmits({
  filteredRows: (filteredSearchRowValues) => {
    if (filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  }
})

const { rows } = commonTable(props, { emit })

const pagination = ref({
  sortBy: 'allEyeball',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
const tabFilter = ref('')
const columns = ref([
  {
    name: 'asNumber',
    required: true,
    label: 'ASN',
    align: 'center',
    field: (row) => row.asn,
    format: (val) => `AS${val}`,
    sortable: true
  },
  {
    name: 'asName',
    required: true,
    label: 'Autonomous System Name',
    align: 'left',
    field: (row) => {
      return row.asn_name === '' ? '--' : row.asn_name
    },
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'allEyeball',
    label: 'Population coverage',
    align: 'center',
    field: (row) => row.hege_eye_all,
    format: (val) => `${val.toFixed(1)}%`,
    sortable: true
  },
  {
    name: 'eyeball',
    label: 'Direct',
    align: 'center',
    field: (row) => row.eyeball,
    format: (val) => `${val.toFixed(1)}%`,
    sortable: true
  },
  {
    name: 'transitingEyeball',
    label: 'Indirect',
    align: 'center',
    field: (row) => row.hege_eye_transit,
    format: (val) => `${val.toFixed(1)}%`,
    sortable: true
  },
  {
    name: 'transitingAs',
    label: 'AS coverage',
    align: 'center',
    field: (row) => row.hege_as,
    format: (val) => `${val.toFixed(1)}%`,
    sortable: true
  }
])

const routeToAsn = (asn, row) => {
  asn = asn.field(row)
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: iht_api.ihr_NumberToAsOrIxp(asn) }
    })
  )
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
  <QTable
    v-model:pagination="pagination"
    :rows="rows"
    :columns="columns"
    row-key="asNumber"
    :loading="loading"
    :filter="tabFilter"
    separator="vertical"
    binary-state-sort
    flat
  >
    <template #loading>
      <div class="spinner-container">
        <q-spinner color="secondary" size="50px" />
      </div>
    </template>
    <template #no-data>
      <div v-if="!loading" class="q-table__bottom row items-center q-table__bottom--nodata">
        <QIcon name="warning" class="q-table__bottom-nodata-icon" />
        No data available
      </div>
    </template>
    <template #header="props" style="display: contents">
      <QTr>
        <QTh colspan="2">
          <h3>Autonomous System</h3>
        </QTh>
        <QTh colspan="3">
          <h3>
            Population coverage
            <QIcon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
            <QTooltip max-width="360px">
              <div
                v-html="$t(`documentationPage.sections.countryasdependency.description.1.body`)"
              />
            </QTooltip>
          </h3>
        </QTh>
        <QTh colspan="1">
          <h3>
            AS coverage
            <QIcon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
            <QTooltip max-width="360px">
              <div
                v-html="$t(`documentationPage.sections.countryasdependency.description.2.body`)"
              />
            </QTooltip>
          </h3>
        </QTh>
      </QTr>
      <QTr>
        <QTh />
        <QTh>
          <QInput v-model="tabFilter" dense debounce="300" borderless placeholder="Search">
            <template #prepend>
              <QIcon name="fas fa-search" />
            </template>
          </QInput>
        </QTh>
        <QTh key="allEyeball" :props="props"> Total </QTh>
        <QTh key="eyeball" :props="props"> Direct </QTh>
        <QTh key="transitingEyeball" :props="props"> Indirect </QTh>
        <QTh key="transitingAs" :props="props"> Total </QTh>
      </QTr>
    </template>
    <template #body="props">
      <QTr
        :props="props"
        class="IHR_table-row"
        @click.enter="routeToAsn(props.colsMap.asNumber, props.row)"
      >
        <QTd
          v-for="col in columns"
          :key="col.name"
          :props="props"
          :class="
            col.name == 'allEyeball' || col.name == 'transitingAs'
              ? ['IHR_important-cell', getClassByHegemony(col.field(props.row))]
              : ''
          "
        >
          {{ col.format(col.field(props.row)) }}
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style>
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}
</style>
