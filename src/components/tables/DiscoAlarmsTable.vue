<script setup>
import { QTable, QTr, QTd, QToggle } from 'quasar'
import Latencymon from '../ripe/Latencymon.vue'
import commonTable from '@/plugins/commonTable'
import { ref } from 'vue'
import getCountryName from '@/plugins/countryName'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'

const props = defineProps({
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
  },
  startTime: {
    type: Date,
    required: true,
  },
  stopTime: {
    type: Date,
    required: true,
  },
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
const { rows, filterFct, filterTable, getCellValue, dateHourShift } = commonTable(props, { emit })

const fetch = ref(true)
const expandedRow = ref([])
const pagination = ref({
  sortBy: 'deviation',
  descending: true,
  page: 1,
  rowsPerPage: 5,
})
const columns = ref([
  {
    name: 'overview',
    label: 'Overview',
    align: 'center',
  },
  {
    name: 'location',
    required: true,
    label: 'Location',
    align: 'left',
    field: row => [row.streamtype, row.streamname],
    format: val => (val[0] == 'country' ? getCountryName(val[1]) : val[1]),
    sortable: true,
  },
  {
    name: 'starttime',
    required: false,
    label: 'Disconnection Time',
    align: 'left',
    field: row => row.starttime,
    format: val => val,
    sortable: false,
  },
  {
    name: 'duration',
    required: true,
    label: 'Duration (minutes)',
    align: 'left',
    field: row => row.duration,
    format: val => val,
    sortable: true,
  },
  {
    name: 'deviation',
    required: true,
    label: 'Deviation',
    align: 'left',
    field: row => row.avglevel,
    format: val => val,
    sortable: true,
  },
  {
    name: 'discoProbes',
    required: true,
    label: 'Nb. Disco. Probes',
    align: 'left',
    field: row => row.nbdiscoprobes,
    format: val => val,
    sortable: true,
  }
])

const dateFormatter = (datetime) => {
  const dt = new Date(datetime)
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }
  return dt.toLocaleDateString(undefined, options)
}

const msmPrbIds = (probes) => {
  const probeIds = probes.map(probe => {
    return probe.probe_id
  })
  return { 1030: probeIds, 1001: probeIds, 1591146: probeIds }
}
</script>

<template>
  <QTable table-class="myClass" :rows="rows" :columns="columns" :pagination.sync="pagination" :loading="loading"
    :filter="filterTable" flat row-key="id" v-model:expanded="expandedRow"
    loading-label="Fetching the latest network disconnections...">
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd auto-width>
          <QToggle v-model="props.expand" />
        </QTd>
        <QTd key="location" align>
          <div v-if="props.row.streamtype == 'asn'">
            <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'AS' + props.row.streamname } })">
              AS{{ props.row.streamname }}
            </RouterLink>
          </div>
          <div v-else>
            {{ getCountryName(props.row.streamname) }}
          </div>
        </QTd>
        <QTd key="starttime"> {{ dateFormatter(props.row.starttime) }} </QTd>
        <QTd key="duration"> {{ props.row.duration }} </QTd>
        <QTd key="deviation">{{ props.row.avglevel }}</QTd>
        <QTd key="nbdiscoprobes"> {{ props.row.nbdiscoprobes }} </QTd>
      </QTr>
      <QTr v-if="props.expand" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="text-h3 text-center">Pings from disconnected probes</div>
          <div class="IHR_side_borders">
            <Latencymon :start-time="dateHourShift(props.row.starttime, -Math.max(props.row.duration, 120) / 60)"
              :stop-time="dateHourShift(props.row.endtime, Math.max(props.row.duration, 120) / 60)"
              :msm-prb-ids="msmPrbIds(props.row.discoprobes)" style="max-width: 93%; margin: 0 auto" />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus">
.IHR_nohover
    &:first-child
      padding-top 0px
      padding-bottom 20px
      padding-right 20px
      padding-left 20px
      background #fafafa

.IHR_side_borders
    &:first-child
        padding-top 20px
        border-style solid
        border-color #dddddd
        border-top-width 0px
        border-left-width 1px
        border-right-width 1px
        border-bottom-width 1px
        border-radius 5px
        background #ffffff


.myClass

    tbody td
        text-align left
</style>