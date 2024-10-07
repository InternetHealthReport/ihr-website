<script setup>
import { QTable, QTr, QTd, QIcon } from 'quasar'
import { ref, inject } from 'vue'
import commonTable from '@/plugins/commonTable'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'

const iht_api = inject('ihr_api')

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
  },
  useOriginAsn: {
    type: Boolean
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

const { rows, getCellValue } = commonTable(props, { emit })

let columnsTemp = []
if (props.useOriginAsn) {
  columnsTemp = [
    {
      name: 'asName',
      required: true,
      label: 'Autonomous System Name',
      align: 'left',
      field: (row) => {
        return row.originasn_name == '' ? '--' : row.originasn_name
      },
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'asNumber',
      required: true,
      label: 'ASN',
      align: 'left',
      field: (row) => row.originasn,
      format: (val) => val,
      sortable: true
    }
  ]
} else {
  columnsTemp = [
    {
      name: 'asName',
      required: true,
      label: 'Autonomous System Name',
      align: 'left',
      field: (row) => row.asn_name,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'asNumber',
      required: true,
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => val,
      sortable: true
    }
  ]
}

const pagination = ref({
  sortBy: 'hegemony',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
const columns = ref([
  ...columnsTemp,
  {
    name: 'hegemony',
    label: 'Dependency',
    align: 'center',
    field: (row) => row.hege,
    format: (val) => `${(val * 100).toFixed(1)}%`,
    sortable: true
  },
  {
    name: 'hegemonyIncrement',
    label: '% Change',
    align: 'center',
    field: (row) => row.increment,
    format: (val) => {
      if (val == undefined) {
        return 0
      }
      if (val > 0) {
        return '+' + val.toFixed(1) + '%'
      }
      return val.toFixed(1) + '%'
    },
    sortable: true
  },
  {
    name: 'direct',
    label: 'Direct Neighbour',
    align: 'center',
    field: (row) => row.direct,
    format: () => '',
    sortable: true
  }
])

const route = useRoute()
const router = useRouter()

const OLDrouteToAsn = (asn, row) => {
  asn = asn.format(asn.field(row))
  const path = route.path
  let link = '#'
  link += path.substring(0, path.lastIndexOf('/') + 1)
  link += iht_api.ihr_NumberToAsOrIxp(asn)
  window.open(link)
}

const routeToAsn = (asn, row) => {
  asn = asn.format(asn.field(row))
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: iht_api.ihr_NumberToAsOrIxp(asn) }
    })
  )
}

const getCalssByHegemony = (props) => {
  let hegemony = getCellValue(props, 'hegemony')
  if (hegemony >= 0.5) {
    return 'IHR_color-deviation-high-threshold'
  }
  if (hegemony >= 0.25) {
    return 'IHR_color-deviation-mid-threshold'
  }
  return ''
}
</script>

<template>
  <QTable
    :rows="rows"
    :columns="columns"
    row-key="asNumber"
    :pagination.sync="pagination"
    :loading="loading"
    binary-state-sort
    flat
  >
    <template v-slot:body="props">
      <QTr
        :props="props"
        @click.native="routeToAsn(props.colsMap.asNumber, props.row)"
        class="IHR_table-row"
      >
        <QTd
          v-for="col in columns"
          :key="col.name"
          :props="props"
          :class="col.name == 'hegemony' ? ['IHR_important-cell', getCalssByHegemony(props)] : ''"
        >
          <div v-if="col.name == 'direct'">
            <QIcon name="fas fa-check" v-if="props.row.direct" />
            <QIcon name="fas fa-times" v-if="!props.row.direct" />
          </div>
          {{ col.format(col.field(props.row)) }}
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus"></style>
