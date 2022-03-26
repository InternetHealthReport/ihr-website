<template>
  <q-table
    table-class="myClass"
    :data="rows"
    :columns="columns"
    :pagination.sync="pagination"
    :loading="loading"
    :filter="filterTable"
    :filter-method="filterFct"
    binary-state-sort
    flat
    row-key="asNumber"
    :expanded.sync="expandedRow"
    loading-label="Fetching latest network delay alarms..."
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-toggle v-model="props.expand" />
        </q-td>
        <q-td key="asNumber" align>
          <a
            @click="
              newWindow({
                name: 'networks',
                params: {
                  asn: $options.filters.ihr_NumberToAsOrIxp(props.row.asNumber),
                },
              })
            "
            href="javascript:void(0)"
          >
            {{ $options.filters.ihr_NumberToAsOrIxp(props.row.asNumber) }}
          </a>
        </q-td>
        <q-td key="destinations" class="IHR_ndelay_table_cell">
          <div>{{ destinationsSubtitle(props.row.endpoints) }}</div>
          <div class="IHR_ndelay_destinations">
            {{ destinationsBody(props.row.endpoints) }}
          </div>
        </q-td>
        <q-td key="nbalarms">{{ props.row.nbalarms }}</q-td>
        <q-td key="avgdev">{{ (props.row.cumdev / props.row.nbalarms).toFixed(2) }}</q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%" class="IHR_nohover" bordered>
          <div v-if="props.expand" class="IHR_side_borders">
            <network-delay-chart
              :start-time="startTime"
              :end-time="stopTime"
              :startPointName="String(props.row.asNumber)"
              :startPointType="props.row.asNumber > 0 ? 'AS' : 'IX'"
              :endPointNames="endpointKeys(props.row.endpoints)"
              fetch
            />
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'

const MAX_NETDELAY_PLOTS = 12

export default {
  mixins: [CommonTableMixin],
  components: {
    NetworkDelayChart,
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
      expandedRow: [],
      rows: [],
      pagination: {
        sortBy: 'nbalarms',
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
          name: 'asNumber',
          required: true,
          label: 'Source',
          align: 'left',
          field: row => row.asNumber,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: true,
        },
        {
          name: 'destinations',
          required: false,
          label: 'Destinations',
          align: 'left',
          field: row => row.endpoints,
          format: val => this.$options.filters.sortedKeys(val),
          sortable: false,
        },
        {
          name: 'nbalarms',
          required: true,
          label: 'Nb. Alarms',
          align: 'left',
          field: row => row.nbalarms,
          format: val => val,
          sortable: true,
        },
        {
          name: 'avgdev',
          required: true,
          label: 'Average Deviation',
          align: 'left',
          field: row => row.cumdev / row.nbalarms,
          format: val => val.toFixed(2),
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
        var start = alarm.startpoint_type + alarm.startpoint_name
        var asNumber = alarm.type == 'IX' ? -parseInt(alarm.startpoint_name) : parseInt(alarm.startpoint_name)
        if (asNumber != 0) {
          if (start in datasum) {
            datasum[start].nbalarms += 1
            datasum[start].cumdev += alarm.deviation
          } else {
            datasum[start] = {
              asNumber: asNumber,
              nbalarms: 1,
              cumdev: alarm.deviation,
              endpoints: {},
            }
          }

          // Add destination
          var end = alarm.endpoint_type + alarm.endpoint_name
          if (end in datasum[start].endpoints) {
            datasum[start].endpoints[end] += alarm.deviation
          } else {
            datasum[start].endpoints[end] = alarm.deviation
          }
        }
      })

      const values = Object.values(datasum)
      this.rows = values
    },
    destinationsSubtitle(val) {
      return String(Object.keys(val).length) + ' ' + this.$t('charts.networkDelayAlarms.table.destinations')
    },
    destinationsBody(val) {
      var body = ''
      Object.keys(val).forEach(dest => {
        var loc = dest.startsWith('CT') ? dest.substring(2) : dest
        body += loc + ', '
      })

      // Remove the last comma
      body = body.substring(0, body.length - 2)
      return body
    },
    endpointKeys(endpoints) {
      var keys = []
      // Compute endpoints keys
      for (const key of Object.keys(endpoints)) {
        var type = key.substring(0, 2)
        var name = key.substring(2)
        var af = '4' //TODO get this value from global settings
        keys.push(type + af + name)
      }

      // Limit the number of values to display
      if (keys.length > MAX_NETDELAY_PLOTS) {
        keys = keys.slice(0, MAX_NETDELAY_PLOTS)
      }

      return keys
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
.IHR_ndelay_table_cell
    max-width 700px

.IHR_ndelay_destinations
    text-overflow ellipsis
    /* Required for text-overflow to do anything */
    white-space nowrap
    overflow hidden
    font-style italic
    color #555

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
