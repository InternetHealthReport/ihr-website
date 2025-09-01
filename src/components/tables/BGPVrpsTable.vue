<script setup>
import { QTable, QTd } from 'quasar'
import { ref } from 'vue'
import Tr from '@/i18n/translation'
import report from '@/plugins/report'
import '@/styles/chart.css'

const props = defineProps({
  vrpTableData: {
    type: Array,
    default: () => []
  }
})

const { utcString } = report()

const columns = ref([
  { name: 'asn', label: 'Origin ASN', field: 'asn', align: 'left', sortable: true },
  {
    name: 'prefix',
    label: 'Prefix',
    field: 'prefix',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  },
  {
    name: 'max_length',
    label: 'Max Length',
    field: 'max_length',
    align: 'left',
    sortable: true
  },
  {
    name: 'unixVisibleFrom',
    label: 'Visible From',
    field: 'unixVisibleFrom',
    align: 'left',
    sortable: true
  },
  {
    name: 'unixVisibleTo',
    label: 'Visible to',
    field: 'unixVisibleTo',
    align: 'left',
    sortable: true
  }
])

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
}
</script>

<template>
  <QTable flat :rows="props.vrpTableData" :columns="columns" row-key="id">
    <template #body-cell-asn="props">
      <QTd :props="props">
        <RouterLink
          :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${props.row.asn}` } })"
          target="_blank"
        >
          {{ props.row.asn }}
        </RouterLink>
      </QTd>
    </template>
    <template #body-cell-prefix="props">
      <QTd :props="props">
        <RouterLink
          :to="
            Tr.i18nRoute({
              name: 'prefix',
              params: { ip: props.row.ip, length: props.row.prefixLength }
            })
          "
          target="_blank"
        >
          {{ props.row.prefix }}
        </RouterLink>
      </QTd>
    </template>
    <template #body-cell-unixVisibleFrom="props">
      <QTd class="nowrap" :props="props">{{ timestampToUTC(props.row.unixVisibleFrom) }}</QTd>
    </template>
    <template #body-cell-unixVisibleTo="props">
      <QTd class="nowrap" :props="props">{{ timestampToUTC(props.row.unixVisibleTo) }}</QTd>
    </template>
  </QTable>
</template>

<style scoped>
.nowrap {
  white-space: nowrap !important;
}
</style>
