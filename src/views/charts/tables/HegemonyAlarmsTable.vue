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
    row-key="originasn"
    :expanded.sync="expandedRow"
    loading-label="Fetching the latest network dependency alarms..."
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-toggle v-model="props.expand" />
        </q-td>
        <q-td key="originasn" align>
          <a
            @click="
              newWindow({
                name: 'networks',
                params: {
                  asn: $options.filters.ihr_NumberToAsOrIxp(props.row.originasn),
                },
              })
            "
            href="javascript:void(0)"
          >
            {{ $options.filters.ihr_NumberToAsOrIxp(props.row.originasn) }}
          </a>
        </q-td>
        <q-td key="dependencies">
          {{ dependenciesBody(props.row.dependencies) }}
        </q-td>
        <q-td key="nbalarms">{{ props.row.nbalarms }}</q-td>
        <q-td key="avgdev">{{ (props.row.cumdev / props.row.nbalarms).toFixed(2) }}</q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%" class="IHR_nohover" bordered>
          <div v-if="props.expand" class="IHR_side_borders">
            <as-interdependencies-chart :start-time="startTime" :end-time="stopTime" :as-number="props.row.originasn" :fetch="fetch" />
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
</template>

<script>
import CommonTableMixin from './CommonTableMixin.vue'
import AsInterdependenciesChart from '@/views/charts/AsInterdependenciesChart'

export default {
  mixins: [CommonTableMixin],
  components: {
    AsInterdependenciesChart,
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
    filter: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      fetch: true,
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
          name: 'originasn',
          required: true,
          label: 'Origin AS',
          align: 'left',
          field: row => row.originasn,
          format: val => this.$options.filters.ihr_NumberToAsOrIxp(val),
          sortable: true,
        },
        {
          name: 'dependencies',
          required: false,
          label: 'Anomalous Dependencies',
          align: 'left',
          field: row => row.dependencies,
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
        var originasn = alarm.originasn
        if (originasn != 0) {
          if (originasn in datasum) {
            datasum[originasn].nbalarms += 1
            datasum[originasn].cumdev += alarm.deviation
          } else {
            datasum[originasn] = {
              originasn: originasn,
              nbalarms: 1,
              cumdev: alarm.deviation,
              dependencies: {},
            }
          }

          // Add destination
          if (alarm.asn in datasum[originasn].dependencies) {
            datasum[originasn].dependencies[alarm.asn] += alarm.deviation
          } else {
            datasum[originasn].dependencies[alarm.asn] = alarm.deviation
          }
        }
      })

      // Select the AS with the largest number of alarms
      const values = Object.values(datasum)
      var first_row = values.reduce((prev, current) => (prev.nbalarms > current.nbalarms ? prev : current))
      this.selectedRow = [first_row]

      this.rows = values
    },
    dependenciesSubtitle(val) {
      return String(Object.keys(val).length) + ' ' + this.$t('charts.hegemonyAlarms.table.dependencies')
    },
    dependenciesBody(val) {
      var body = ''
      var sortedVal = this.$options.filters.sortedKeys(val)
      sortedVal.forEach(dest => {
        body += this.$options.filters.ihr_NumberToAsOrIxp(dest) + ', '
      })

      //Remove the last comma
      body = body.substring(0, body.length - 2)
      return body
    },
    nbAlarmsDisplayed(val) {
      this.$emit('nbAlarmsDisplayed', val)
    },
  },
  watch: {
    data() {
      this.computeDataSummary()
    },
    filter(newValue) {
      this.filterTable = newValue
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
