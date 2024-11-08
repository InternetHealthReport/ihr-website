<script setup>
import { QTable, QTr, QTd, QToggle, QPopupProxy } from 'quasar'
import { ref } from 'vue'
import commonTable from '@/plugins/commonTable'
import ReverseDnsIp from '../ripe/ReverseDnsIp.vue'
import Tracemon from '../ripe/Tracemon.vue'

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
const { rows, filterFct, filterTable, getCellValue, dateHourShift } = commonTable(props, { emit })

const expandedRow = ref([])
const pagination = ref({
  sortBy: 'responsibility',
  descending: true,
  page: 1,
  rowsPerPage: 10
})
const columns = ref([
  {
    name: 'overview',
    label: 'Overview',
    align: 'center'
  },
  {
    name: 'reportedIp',
    required: true,
    label: 'Reported IP',
    align: 'center',
    field: (row) => row.ip,
    format: (val) => val,
    sortable: false
  },
  {
    name: 'usualPrecedingIp',
    required: true,
    label: 'Usual Preceding IP',
    align: 'center',
    field: (row) => row.previoushop,
    format: (val) => val,
    sortable: true
  },
  {
    name: 'correlation',
    required: true,
    label: 'Correlation',
    align: 'center',
    field: (row) => row.correlation,
    format: (val) => `${val.toFixed(3)}`,
    sortable: true
  },
  {
    name: 'responsibility',
    label: 'Responsibility',
    align: 'center',
    field: (row) => row.responsibility,
    format: (val) => `${val.toFixed(3)}`,
    sortable: true
  }
])
</script>

<template>
  <QTable
    :rows="rows"
    :columns="columns"
    row-key="ip"
    :pagination.sync="pagination"
    :loading="loading"
    flat
    :filter="filterTable"
    :filter-method="filterFct"
    v-model:expanded="expandedRow"
  >
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd auto-width>
          <QToggle v-model="props.expand" />
        </QTd>
        <QTd key="reportedIp" :props="props">
          <a href="javascript:void(0)">
            {{ props.row.ip }}
            <QPopupProxy>
              <ReverseDnsIp :ip="props.row.ip" class="IHR_reverse-dns-ip-improved" />
            </QPopupProxy>
          </a>
        </QTd>
        <QTd key="usualPrecedingIp" :props="props">
          <a href="javascript:void(0)">
            {{ props.row.previoushop }}
            <QPopupProxy>
              <ReverseDnsIp :ip="props.row.previoushop" class="IHR_reverse-dns-ip-improved" />
            </QPopupProxy>
          </a>
        </QTd>
        <QTd key="correlation" :props="props">
          {{ props.row.correlation }}
        </QTd>
        <QTd key="responsibility" :props="props">
          {{ props.row.responsibility }}
        </QTd>
      </QTr>
      <QTr v-if="props.expand" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="IHR_side_borders">
            <Tracemon
              :start-time="dateHourShift(props.row.timebin, -1)"
              :end-time="dateHourShift(props.row.timebin, 1)"
              :probe-ids="props.row.msm_prb_ids[Object.keys(props.row.msm_prb_ids)[0]]"
              style="max-width: 93%; margin: 0 auto"
            />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style></style>
