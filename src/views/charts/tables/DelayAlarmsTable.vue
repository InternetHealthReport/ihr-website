<template>
  <q-table
    :data="rows"
    :columns="columns"
    row-key="link"
    :pagination.sync="pagination"
    :loading="loading"
    flat
    :filter="filterTable"
    :filter-method="filterFct"
    :expanded.sync="expandedRow"
    loading-label="Fetching latest link delay alarms..."
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-toggle v-model="props.expand" />
        </q-td>
        <q-td key="asn" :props="props">
          <a
            v-bind:key="asn"
            v-for="(asn, index) in props.row.asn"
            @click="
              newWindow({
                name: 'networks',
                params: { asn: $options.filters.ihr_NumberToAsOrIxp(asn) },
              })
            "
            href="javascript:void(0)"
          >
            {{ index == 1 ? '/' + $options.filters.ihr_NumberToAsOrIxp(asn) : $options.filters.ihr_NumberToAsOrIxp(asn) }}
          </a>
        </q-td>
        <q-td key="link" :props="props">
          <a href="javascript:void(0)">
            {{ props.row.link[0] }}
            <q-popup-proxy>
              <reverse-dns-ip :ip="getCellValue(props, 'link')[0]" class="IHR_reverse-dns-ip-improved" />
            </q-popup-proxy>
          </a>
          --
          <a href="javascript:void(0)">
            {{ props.row.link[1] }}
            <q-popup-proxy>
              <reverse-dns-ip :ip="getCellValue(props, 'link')[1]" class="IHR_reverse-dns-ip-improved" />
            </q-popup-proxy>
          </a>
        </q-td>
        <q-td key="delayChange" :props="props">{{ (props.row.diffmedian / props.row.nbalarms).toFixed(2) }}</q-td>
        <q-td
          key="deviation"
          :props="props"
          :class="['IHR_important-cell', getClassByDeviation(props.row.deviation / props.row.nbalarms)]"
          >{{ (props.row.deviation / props.row.nbalarms).toFixed(2) }}</q-td
        >
        <q-td key="nbprobes" :props="props">
          {{ Math.floor(props.row.nbprobes / props.row.nbalarms) }}
        </q-td>
      </q-tr>
      <q-tr v-if="props.expand" :props="props">
        <q-td colspan="100%" class="IHR_nohover" bordered>
          <div class="text-h3 text-center">RTTs of traceroutes crossing reported link</div>
          <div v-if="props.expand" class="IHR_side_borders">
            <latencymon
              :start-time="dateHourShift(props.row.starttime, -6)"
              :stop-time="dateHourShift(props.row.endtime, 6)"
              :msm-prb-ids="props.row.msm_prb_ids"
              style="max-width: 93%; margin: 0 auto"
            />
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'
import Latencymon from '@/components/ripe/Latencymon'
import ReverseDnsIp from '@/components/ripe/ReverseDnsIp'

export default {
  mixins: [CommonTableMixin],
  components: {
    Latencymon,
    ReverseDnsIp,
  },
  props: {
    startTime: {
      type: Date,
      required: true,
    },
    stopTime: {
      type: Date,
      required: true,
    },
  },
  data() {
    return {
      expandedRow: [],
      pagination: {
        sortBy: 'deviation',
        descending: true,
        page: 1,
        rowsPerPage: 5,
      },
      columns: [
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
      ],
    }
  },
  mounted() {
    this.computeDataSummary()
  },
  methods: {
    computeDataSummary() {
      if (!this.data.length) return

      var datasum = {}
      this.data.forEach(alarm => {
        if (alarm.link in datasum) {
          // update stats
          datasum[alarm.link].nbalarms += 1
          datasum[alarm.link].deviation += alarm.deviation
          datasum[alarm.link].diffmedian += alarm.diffmedian
          datasum[alarm.link].nbprobes += alarm.nbprobes
          if (!datasum[alarm.link].asn.includes(alarm.asn)) datasum[alarm.link].asn.push(alarm.asn)

          // update datetimes
          var timebin = new Date(alarm.timebin)
          if (timebin < datasum[alarm.link].starttime) datasum[alarm.link].starttime = timebin
          if (timebin > datasum[alarm.link].endtime) datasum[alarm.link].endtime = timebin

          // update msm/probe ids
          Object.keys(alarm.msm_prb_ids).forEach(msmid => {
            if (msmid in datasum[alarm.link].msm_prb_ids) {
              var union = [...new Set([...alarm.msm_prb_ids[msmid], ...datasum[alarm.link].msm_prb_ids[msmid]])]
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

      const values = Object.values(datasum)
      this.rows = values
    },
    duration(start, end) {
      let durationMin = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60))
      return durationMin
    },
    getClassByDeviation(deviation) {
      if (deviation > 100) return 'IHR_color-deviation-high-threshold'
      if (deviation > 10) return 'IHR_color-deviation-mid-threshold'
      return ''
    },
    expandRow(props) {
      alert(props.expanded)
      if (props.expanded == undefined || props.expanded == false) {
        this.$set(props, 'expanded', true)
        return
      }
      props.expanded = false
    },
  },
  watch: {
    data() {
      this.computeDataSummary()
    },
  },
}
</script>
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
</style>
