<script setup>
import commonTable from '@/plugins/commonTable'
import { QInput, QIcon, QTable, QTr, QTh, QTooltip, QTd } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject } from 'vue'
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'

const ihr_api = inject('ihr_api')

const props = defineProps({
  showCountry: {
    type: Boolean,
    default: true
  },
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
  sortBy: 'visibility',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
const tabFilter = ref('')
const columns = ref([
  {
    name: 'country',
    required: false,
    label: 'Country',
    align: 'center',
    field: (row) => row.country,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'originASN',
    required: true,
    label: 'Origin ASN',
    align: 'center',
    field: (row) => row.originasn.asn,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'prefix',
    required: true,
    label: 'Prefix',
    align: 'left',
    field: (row) => row.prefix.value,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'rpkiStatus',
    required: true,
    label: 'RPKI',
    align: 'left',
    field: (row) => row.rpki_status,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'irrStatus',
    required: true,
    label: 'IRR',
    align: 'left',
    field: (row) => row.irr_status,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'delegatedPrefixStatus',
    required: true,
    label: 'Prefix',
    align: 'left',
    field: (row) => row.delegated_prefix_status,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'delegatedASNStatus',
    required: true,
    label: 'Origin ASN',
    align: 'left',
    field: (row) => row.delegated_asn_status,
    format: (val) => `${val}`,
    sortable: true
  },
  {
    name: 'visibility',
    required: true,
    label: 'Visibility',
    align: 'left',
    field: (row) => row.visibility,
    format: (val) => `${val.toFixed(1)}%`,
    sortable: true
  },
  {
    name: 'dependencies',
    required: true,
    label: 'Main Transits',
    align: 'left',
    field: (row) => simpleDependenciesFormat(row.dependencies),
    format: (val) => `${val}`,
    sortable: true
  }
])
const router = useRouter()

const routeToAsn = (asn, row) => {
  asn = asn.field(row)
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: ihr_api.ihr_NumberToAsOrIxp(asn) }
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

const visibleColumns = () => {
  const vcolumns = []
  columns.value.forEach((elem) => {
    if ((elem.name != 'country') | props.showCountry) {
      vcolumns.push(elem.name)
    }
  })
  return vcolumns
}

const sorted = (obj) => {
  return Object.values(obj).sort((a, b) => b.hege - a.hege)
}

const simpleDependenciesFormat = (val) => {
  let txt = ''
  for (const dep in sorted(val)) {
    txt += dep.asn
  }
  return txt
}
</script>

<template>
  <div>
    <div>
      <QInput v-model="tabFilter" debounce="300" placeholder="Search">
        <template #prepend>
          <QIcon name="fas fa-search" />
        </template>
      </QInput>
    </div>
    <QTable
      :rows="rows"
      :columns="columns"
      :visible-columns="visibleColumns()"
      row-key="asNumber"
      :pagination="pagination"
      :loading="loading"
      :filter="tabFilter"
      separator="vertical"
      binary-state-sort
      flat
    >
      <template #header="props" style="display: contents">
        <QTr>
          <QTh :colspan="showCountry ? 3 : 2">
            <h3>Route</h3>
          </QTh>
          <QTh colspan="5">
            <h3>
              Status
              <QIcon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
              <QTooltip max-width="360px">
                <div
                  v-html="DOMPurify.sanitize($t(`documentationPage.sections.prefixasdependency.description.1.body`))"
                ></div>
              </QTooltip>
            </h3>
          </QTh>
          <QTh colspan="2">
            <h3>
              AS dependency
              <QIcon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
              <QTooltip max-width="360px">
                <div
                  v-html="DOMPurify.sanitize($t(`documentationPage.sections.prefixasdependency.description.2.body`))"
                ></div>
              </QTooltip>
            </h3>
          </QTh>
        </QTr>
        <QTr>
          <QTh key="country" :props="props"> Country </QTh>
          <QTh key="originASN" :props="props"> Origin ASN </QTh>
          <QTh key="prefix" :props="props"> Prefix </QTh>
          <QTh key="rpkiStatus" :props="props"> RPKI </QTh>
          <QTh key="irrStatus" :props="props"> IRR </QTh>
          <QTh key="delegatedPrefixStatus" :props="props"> Prefix </QTh>
          <QTh key="delegatedASNStatus" :props="props"> Origin ASN </QTh>
          <QTh key="visibility" :props="props"> Visibility </QTh>
          <QTh key="dependencies" :props="props"> Main Transits </QTh>
        </QTr>
      </template>

      <template #body-cell-country="props">
        <QTd :props="props">
          <RouterLink
            class="IHR_delikify"
            :to="Tr.i18nRoute({ name: 'country', params: { cc: props.row.country } })"
          >
            {{ props.row.country }}
          </RouterLink>
        </QTd>
      </template>

      <template #body-cell-prefix="props">
        <QTd :props="props">
          <RouterLink
            class="IHR_delikify"
            :to="
              Tr.i18nRoute({
                name: 'prefix',
                params: {
                  ip: props.row.prefix.value.split('/')[0],
                  length: props.row.prefix.value.split('/')[1]
                }
              })
            "
          >
            {{ props.row.prefix.value }}
          </RouterLink>
          <span class="text-weight-thin float-right">{{ props.row.prefix.descr }}</span>
        </QTd>
      </template>

      <template #body-cell-originASN="props">
        <QTd :props="props">
          <RouterLink
            class="IHR_delikify"
            :to="
              Tr.i18nRoute({
                name: 'network',
                params: { id: ihr_api.ihr_NumberToAsOrIxp(props.row.originasn.asn) }
              })
            "
          >
            <span :title="props.row.originasn.name">AS{{ props.row.originasn.asn }}</span>
          </RouterLink>
        </QTd>
      </template>

      <template #body-cell-dependencies="props">
        <QTd :props="props">
          <span v-for="dep in sorted(props.row.dependencies)" :key="dep.prefix" class="comma">
            <RouterLink
              class="IHR_delikify"
              :to="
                Tr.i18nRoute({
                  name: 'network',
                  params: { id: ihr_api.ihr_NumberToAsOrIxp(dep.asn) }
                })
              "
            >
              <span
                v-if="(dep.hege / props.row.maxHege > 0.5) & (dep.asn != props.row.originasn.asn)"
                class="text-grey-10"
                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
              >
                <b>AS{{ dep.asn }}</b>
              </span>
              <span
                v-else-if="
                  (dep.hege / props.row.maxHege > 0.1) & (dep.asn != props.row.originasn.asn)
                "
                class="text-grey-8"
                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
              >
                AS{{ dep.asn }}
              </span>
              <span
                v-else-if="dep.asn != props.row.originasn.asn"
                class="text-grey-5"
                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
              >
                AS{{ dep.asn }}
              </span>
            </RouterLink>
          </span>
        </QTd>
      </template>

      <template #body-cell-rpkiStatus="props">
        <QTd :props="props">
          <span v-if="props.row.rpki_status == 'Invalid'" justify>
            <QIcon name="fas fa-times" color="red" left />
            {{ props.row.rpki_status }}
          </span>
          <span v-else-if="props.row.rpki_status == 'Invalid,more-specific'">
            <QIcon name="fas fa-times" color="red" left />
            Invalid (more specific)
          </span>
          <span v-else-if="props.row.rpki_status.startsWith('Valid')">
            <QIcon name="fas fa-check" color="green" left />
            {{ props.row.rpki_status }}
          </span>
          <span v-else>
            <QIcon name="fas fa-question" color="grey" left />
            {{ props.row.rpki_status }}
          </span>
        </QTd>
      </template>

      <template #body-cell-irrStatus="props">
        <QTd :props="props">
          <span v-if="props.row.irr_status == 'Invalid'">
            <QIcon name="fas fa-times" color="red" left />
            {{ props.row.irr_status }}
          </span>
          <span v-else-if="props.row.irr_status == 'Invalid,more-specific'">
            <QIcon name="fas fa-times" color="orange" left />
            Invalid (more specific)
          </span>
          <span v-else-if="props.row.irr_status.startsWith('Valid')">
            <QIcon name="fas fa-check" color="green" left />
            {{ props.row.irr_status }}
          </span>
          <span v-else>
            <QIcon name="fas fa-question" color="grey" left />
            {{ props.row.irr_status }}
          </span>
        </QTd>
      </template>

      <template #body-cell-delegatedPrefixStatus="props">
        <QTd :props="props">
          <span
            v-if="
              (props.row.delegated_prefix_status == 'available') |
                (props.row.delegated_prefix_status == 'reserved')
            "
            color="red"
          >
            <QIcon name="fas fa-times" color="red" left />
            {{ props.row.delegated_prefix_status }}
          </span>
          <span v-else-if="props.row.delegated_prefix_status == 'assigned'">
            <QIcon name="fas fa-check" color="green" left />
            {{ props.row.delegated_prefix_status }}
          </span>
          <span v-else>
            <QIcon name="fas fa-question" color="grey" left />
            {{ props.row.delegated_prefix_status }}
          </span>
        </QTd>
      </template>

      <template #body-cell-delegatedASNStatus="props">
        <QTd :props="props">
          <span
            v-if="
              (props.row.delegated_asn_status == 'available') |
                (props.row.delegated_asn_status == 'reserved')
            "
            color="red"
          >
            <QIcon name="fas fa-times" color="red" left />
            {{ props.row.delegated_asn_status }}
          </span>
          <span v-else-if="props.row.delegated_asn_status == 'assigned'">
            <QIcon name="fas fa-check" color="green" left />
            {{ props.row.delegated_asn_status }}
          </span>
          <span v-else>
            <QIcon name="fas fa-question" color="grey" left />
            {{ props.row.delegated_asn_status }}
          </span>
        </QTd>
      </template>
    </QTable>
  </div>
</template>

<style>
.comma:not(:empty) ~ .comma:not(:empty):before {
  content: ', ';
}
</style>
