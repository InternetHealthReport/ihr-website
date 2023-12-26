<script setup>
import { QTable, QTr, QTd, QPopupProxy, QToggle } from 'quasar'
import commonTable from '@/plugins/commonTable'
import { ref, onMounted, watch, inject } from 'vue'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import ReverseDnsIp from '../ripe/ReverseDnsIp.vue'
import Latencymon from '../ripe/Latencymon.vue'

const ihr_api = inject('ihr_api')

const props = defineProps({
  startTime: {
    type: Date,
    required: true,
  },
  stopTime: {
    type: Date,
    required: true,
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
const { rows, filterFct, filterTable, getCellValue, dateHourShift } = commonTable(props, { emit })

const expandedRow = ref([])
const pagination = ref({
  ortBy: 'deviation',
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
    name: 'asn',
    required: false,
    label: 'Autonomous System',
    align: 'center',
    field: row => row.asn,
    format: val => val,
    sortable: false,
  },
  {
    name: 'link',
    required: true,
    label: 'IP Link',
    align: 'center',
    field: row => row.link,
    format: val => val,
    sortable: false,
  },
  {
    name: 'delayChange',
    required: true,
    label: 'Delay Change (ms)',
    align: 'center',
    field: row => row.diffmedian / row.nbalarms,
    format: val => val,
    sortable: true,
  },
  {
    name: 'deviation',
    required: true,
    label: 'Deviation',
    align: 'center',
    field: row => row.deviation / row.nbalarms,
    format: val => val,
    sortable: true,
  },
  {
    name: 'nbprobes',
    label: 'Nb. Atlas Probes',
    align: 'center',
    field: row => row.nbprobes,
    format: val => val,
    sortable: true,
  },
])

const computeDataSummary = () => {
  if (!props.data.length) {
    return
  }

  var datasum = {}
  props.data.forEach(alarm => {
    if (alarm.link in datasum) {
      // update stats
      datasum[alarm.link].nbalarms += 1
      datasum[alarm.link].deviation += alarm.deviation
      datasum[alarm.link].diffmedian += alarm.diffmedian
      datasum[alarm.link].nbprobes += alarm.nbprobes
      if (!datasum[alarm.link].asn.includes(alarm.asn)) datasum[alarm.link].asn.push(alarm.asn)

      // update datetimes
      const timebin = new Date(alarm.timebin)
      if (timebin < datasum[alarm.link].starttime) {
        datasum[alarm.link].starttime = timebin
      }
      if (timebin > datasum[alarm.link].endtime) {
        datasum[alarm.link].endtime = timebin
      }

      // update msm/probe ids
      Object.keys(alarm.msm_prb_ids).forEach(msmid => {
        if (msmid in datasum[alarm.link].msm_prb_ids) {
          const union = [...new Set([...alarm.msm_prb_ids[msmid], ...datasum[alarm.link].msm_prb_ids[msmid]])]
          if (union.length > 0) {
            datasum[alarm.link].msm_prb_ids[msmid] = union
          } else {
            console.warn('Warning: ignoring msmid/probeid from this alarm')
            console.warn(alarm)
          }
        }
      })
    } else {
      datasum[alarm.link] = {
        link: alarm.link.replace(/(\))|(^\()/g, '').split(','),
        asn: [alarm.asn],
        starttime: new Date(alarm.timebin),
        endtime: new Date(alarm.timebin),
        nbalarms: 1,
        nbprobes: alarm.nbprobes,
        deviation: alarm.deviation,
        diffmedian: alarm.diffmedian,
        msm_prb_ids: alarm.msm_prb_ids,
      }
    }
  })

  rows.value = Object.values(datasum)
}

const duration = (start, end) => {
  return Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60))
}

const getClassByDeviation = (deviation) => {
  if (deviation > 100) {
    return 'IHR_color-deviation-high-threshold'
  }
  if (deviation > 10) {
    return 'IHR_color-deviation-mid-threshold'
  }
  return ''
}

const expandRow = (vals) => {
  alert(vals.expanded)
  if (vals.expanded == undefined || vals.expanded == false) {
    vals.expanded = true
    return
  }
  vals.expanded = false
}
watch(() => props.data, () => {
  computeDataSummary()
})

onMounted(() => {
  computeDataSummary()
})
</script>

<template>
  <QTable
    :rows="rows"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    flat
    :filter="filterTable"
    :filter-method="filterFct"
    loading-label="Fetching latest link delay alarms..."
    v-model:expanded="expandedRow"
  >
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd auto-width>
          <QToggle v-model="props.expand" />
        </QTd>
        <QTd key="asn" :props="props">
          <RouterLink v-bind:key="asn" v-for="(asn, index) in props.row.asn" :to="Tr.i18nRoute({ name: 'networks-ihr', params: { id: ihr_api.ihr_NumberToAsOrIxp(props.row.asn) } })">
            {{ index == 1 ? '/' + ihr_api.ihr_NumberToAsOrIxp(props.row.asn) : ihr_api.ihr_NumberToAsOrIxp(props.row.asn) }}
          </RouterLink>
        </QTd>
        <QTd key="link" :props="props">
          <a href="javascript:void(0)">
            {{ props.row.link[0] }}
            <QPopupProxy>
              <ReverseDnsIp :ip="getCellValue(props, 'link')[0]" class="IHR_reverse-dns-ip-improved" />
            </QPopupProxy>
          </a>
          --
          <a href="javascript:void(0)">
            {{ props.row.link[1] }}
            <QPopupProxy>
              <ReverseDnsIp :ip="getCellValue(props, 'link')[1]" class="IHR_reverse-dns-ip-improved" />
            </QPopupProxy>
          </a>
        </QTd>
        <QTd key="delayChange" :props="props">{{ (props.row.diffmedian / props.row.nbalarms).toFixed(2) }}</QTd>
        <QTd
          key="deviation"
          :props="props"
          :class="['IHR_important-cell', getClassByDeviation(props.row.deviation / props.row.nbalarms)]"
          >{{ (props.row.deviation / props.row.nbalarms).toFixed(2) }}</QTd
        >
        <QTd key="nbprobes" :props="props">
          {{ Math.floor(props.row.nbprobes / props.row.nbalarms) }}
        </QTd>
      </QTr>
      <QTr v-if="props.expand" :props="props">
        <QTd colspan="100%" class="IHR_nohover" bordered>
          <div class="text-h3 text-center">RTTs of traceroutes crossing reported link</div>
          <div class="IHR_side_borders">
            <Latencymon
              :start-time="dateHourShift(props.row.starttime, -6)"
              :stop-time="dateHourShift(props.row.endtime, 6)"
              :msm-prb-ids="props.row.msm_prb_ids"
              style="max-width: 93%; margin: 0 auto"
            />
          </div>
        </QTd>
      </QTr>
    </template>
  </QTable>
</template>

<style lang="stylus">
.IHR_
  &probe-popup
    padding 10px
    max-width 200px
    background transparent

    & > span:first-child
      font-weight 500
      margin-right 6pt

  &prefix-overview-popup
    max-width 400px

  &popup
    border-color black
    max-width 600px
    min-width 300px
  
  &reverse-dns-ip-improved
    min-width 250px
    width 100%
    margin-bottom 0px
    padding-bottom 0px
    & > div:first-child
      margin 0px
      & > .stat-widget.full-box
          margin 0px
      & > .box-content
        border none
        padding 0 10px
        margin 0px
        & > .controls-container
          display none
        & > div:last-child
          & > .res_info_holder
            margin 0px
            padding-bottom 10px
            & > a
              color $accent !important
</style>