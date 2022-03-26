<template>
  <div class="IHR_disco-chart IHR_chart">
    <reactive-chart :layout="layout" :traces="traces" @loaded="loading = false" @plotly-click="showTable" :ref="myId" :no-data="noData" />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <q-card v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
      <q-card-section class="q-pa-xs">
        <div class="row items-center">
          <div class="col">
            <div class="text-h3">
              {{ details.startTime | ihrUtcString }} to
              {{ details.endTime | ihrUtcString }}
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              class="IHR_table-close-button"
              size="sm"
              round
              flat
              @click="details.tableVisible = false"
              icon="fa fa-times-circle"
            ></q-btn>
          </div>
        </div>
      </q-card-section>
      <q-tabs
        v-model="details.activeTab"
        dense
        class="text-grey inset-shadow"
        active-color="primary"
        active-bg-color="white"
        indicator-color="secondary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="probes" label="probes" />
        <q-tab name="tracemon" label="Tracemon" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="probes">
          <disconnection-table :data="details.data" :loading="details.loading" />
        </q-tab-panel>
        <q-tab-panel name="tracemon">
          <tracemon :start-time="details.startTime" :end-time="details.endTime" :probes="details.probes" />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table">
          <h3>{{ $t('charts.disconnections.table.apiTitle') }}</h3>
          <table>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.disconnections.title') }}
                </p>
              </td>
              <td>
                <a :href="disconnetionEventUrl" target="_blank" id="disconnection">{{ disconnetionEventUrl }}</a>
              </td>
            </tr>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.disconnections.table.disconnectionProbes') }}
                </p>
              </td>
              <td>
                <a :href="disconnetionEvenProbestUr" target="_blank" id="tableUrl">{{ disconnetionEvenProbestUr }}</a>
              </td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import CommonChartMixin from './CommonChartMixin'
import { DiscoEventQuery, DiscoProbesQuery } from '@/plugins/IhrApi'
import DisconnectionTable from './tables/DisconnectionTable'
import Tracemon from '@/components/ripe/Tracemon'
import { DISCO_LAYOUT } from './layouts'

function push0(trace, time) {
  trace.x.push(time)
  trace.y.push(0)
  trace.z.push(0)
}

export default {
  mixins: [CommonChartMixin],
  components: {
    DisconnectionTable,
    Tracemon,
  },
  props: {
    streamName: {
      type: Number,
      required: true,
    },
  },
  data() {
    let filter = new DiscoEventQuery().streamName(this.streamName).timeInterval(this.startTime, this.endTime).orderedByTime()

    return {
      dataEvents: [],
      details: {
        activeTab: 'probes',
        tableVisible: false,
        data: [],
        eventid: null,
        probes: [],
        filter: null,
        loading: true,
      },
      filters: [filter],
      traces: [
        {
          x: [],
          y: [],
          z: [],
          yaxis: 'y',
          name: '',
          showlegend: false,
          line: { shape: 'hv' },
        },
      ],
      layout: DISCO_LAYOUT,
    }
  },
  created() {
    this.traces[0].name = this.layout.yaxis.title = this.$t('charts.disconnections.table.yaxis')
  },
  methods: {
    duration(start, end, nonzero) {
      let durationMin = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60))

      if (durationMin == 0) {
        return nonzero
      }

      return durationMin
    },
    apiCall() {
      this.loading = true
      this.$ihr_api.disco_events(
        this.filters[0],
        result => {
          this.dataEvents = result.results
          this.fetchDiscoData(result.results)
          this.loading = false
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    fetchDiscoData(data) {
      let trace = this.traces[0]
      trace.x = []
      trace.y = []
      trace.z = []

      push0(trace, this.$options.filters.ihrUtcString(this.startTime))
      data.forEach(event => {
        push0(trace, event.starttime)
        trace.x.push(event.starttime)
        trace.y.push(event.avglevel)
        trace.z.push(event.id)

        trace.x.push(event.endtime)
        trace.y.push(event.avglevel)
        trace.z.push(event.id)
        push0(trace, event.endtime)
      })
      push0(trace, this.$options.filters.ihrUtcString(this.endTime))
      this.layout.datarevision = new Date().getTime()
    },
    showTable(clickData) {
      let plot = clickData.points[0]
      this.details.eventid = plot.data.z[plot.pointNumber]
      this.details.selectedTime = plot.data.z[plot.pointNumber]
      this.details.filter = new DiscoProbesQuery().event(this.details.eventid).orderedByStartTime()
      this.details.loading = true
      this.$ihr_api.disco_probes(
        this.details.filter,
        result => {
          if (result.results.length > 0) {
            let startTime = new Date(result.results[0].starttime)
            let endTime = new Date(result.results[0].endtime)
            let probes = []
            result.results.forEach(elem => {
              probes.push(elem.probe_id)
            })
            this.details.startTime = startTime
            this.details.endTime = endTime
            this.details.data = result.results
            this.details.probes = probes
            this.details.tableVisible = true
            this.details.loading = false
          }
        },
        error => {
          console.error(error)
        }
      )

      this.tableVisible = true
    },
  },
  computed: {
    disconnetionEventUrl() {
      return this.$ihr_api.getUrl(this.filters[0])
    },
    disconnetionEvenProbestUr() {
      return this.$ihr_api.getUrl(this.details.filter)
    },
  },
  watch: {
    streamName(newValue) {
      this.filters.forEach(filter => {
        filter.streamName(newValue)
      })
      this.debouncedApiCall()
    },
  },
}

export { push0 }
</script>

<style lang="stylus"></style>
