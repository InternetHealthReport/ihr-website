<template>
  <q-table
    table-class="myClass"
    :data="rows"
    :columns="columns"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filterTable"
    :filter-method="filterFct"
    flat
    row-key="id"
    :expanded.sync="expandedRow"
    loading-label="Fetching the latest network disconnections..."
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-toggle v-model="props.expand" />
        </q-td>
        <q-td key="location" align>
          <div v-if="props.row.streamtype == 'asn'">
            <a
              @click="
                newWindow({
                  name: 'networks',
                  params: { asn: 'AS' + props.row.streamname },
                })
              "
              href="javascript:void(0)"
            >
              AS{{ props.row.streamname }}
            </a>
          </div>
          <div v-else>
            {{ countryName(props.row.streamname) }}
          </div>
        </q-td>
        <q-td key="starttime"> {{ dateFormatter(props.row.starttime) }} </q-td>
        <q-td key="duration"> {{ props.row.duration }} </q-td>
        <q-td key="deviation">{{ props.row.avglevel }}</q-td>
        <q-td key="nbdiscoprobes"> {{ props.row.nbdiscoprobes }} </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%" class="IHR_nohover" bordered>
          <div class="text-h3 text-center">Pings from disconnected probes</div>
          <div v-if="props.expand" class="IHR_side_borders">
            <latencymon
              :start-time="dateHourShift(props.row.starttime, -Math.max(props.row.duration, 120) / 60)"
              :stop-time="dateHourShift(props.row.endtime, Math.max(props.row.duration, 120) / 60)"
              :msm-prb-ids="msmPrbIds(props.row.discoprobes)"
              style="max-width: 93%; margin: 0 auto"
            />
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin.vue'
import Latencymon from '@/components/ripe/Latencymon'
import getCountryName from '@/plugins/countryName.js'

export default {
  mixins: [CommonTableMixin],
  components: {
    Latencymon,
  },
  props: {
    data: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    },
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
      fetch: true,
      expandedRow: [],
      rows: [],
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
          name: 'location',
          required: true,
          label: 'Location',
          align: 'left',
          field: row => [row.streamtype, row.streamname],
          format: val => (val[0] == 'country' ? this.countryName(val[1]) : val[1]),
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
        },
      ],
    }
  },
  methods: {
    dateFormatter(datetime) {
      var dt = new Date(datetime)
      var options = {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      }
      return dt.toLocaleDateString(undefined, options)
    },
    countryName(code) {
      return getCountryName(code)
    },
    msmPrbIds(probes) {
      var probeIds = probes.map(probe => {
        return probe.probe_id
      })
      return { 1030: probeIds, 1001: probeIds, 1591146: probeIds }
    },
  },
}
</script>
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
