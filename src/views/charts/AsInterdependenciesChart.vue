<template>
  <div class="IHR_chart">
    <reactive-chart :layout="layout" :traces="traces" @plotly-click="plotClick" :ref="myId" :no-data="noData" />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <q-card v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
      <q-card-section class="q-pa-xs">
        <div class="row items-center">
          <div class="col">
            <div class="text-h3">{{ details.date | ihrUtcString }}</div>
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
        dense
        v-model="details.activeTab"
        class="table-card text-grey inset-shadow"
        indicator-color="secondary"
        active-color="primary"
        active-bg-color="white"
        align="justify"
        narrow-indicator
      >
        <q-tab name="dependency" :label="$t('charts.asInterdependencies.table.dependencyTitle')" />
        <q-tab name="dependent" :label="$t('charts.asInterdependencies.table.dependentTitle')" />
        <q-tab name="bgpPlay" label="AS Graph" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="dependency">
          <as-interdependencies-table :data="networkDependencyData" :loading="details.tablesData.dependency.loading" />
        </q-tab-panel>
        <q-tab-panel name="dependent">
          <as-interdependencies-table :data="dependentNetworksData" use-origin-asn :loading="details.tablesData.dependent.loading" />
        </q-tab-panel>
        <q-tab-panel name="bgpPlay">
          <div class="bgplay-container">
            <iframe frameborder="0" :src="bgplay"></iframe>
          </div>
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{ $t('charts.asInterdependencies.table.apiTitle') }}</h3>
          <table>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.asInterdependencies.table.dependencyTitle') }}
                </p>
              </td>
              <td>
                <a :href="dependencyUrl" target="_blank" id="tableUrl">{{ dependencyUrl }}</a>
              </td>
            </tr>
            <tr>
              <td>
                <p class="text-subtitle1">
                  {{ $t('charts.asInterdependencies.table.dependentTitle') }}
                </p>
              </td>
              <td>
                <a :href="dependentUrl" target="_blank" id="tableUrl">{{ dependentUrl }}</a>
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
import { extend } from 'quasar'
import AsInterdependenciesTable from './tables/AsInterdependenciesTable'
import { AS_INTERDEPENDENCIES_LAYOUT } from './layouts'
import i18n from '@/locales/i18n'
import { HegemonyQuery, HegemonyConeQuery, AS_FAMILY } from '@/plugins/IhrApi'
import ripeApi from '@/plugins/RipeApi'

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    mode: 'lines',
    type: 'scatter',
    x: [],
    y: [],
    yaxis: 'y2',
    name: i18n.t('charts.asInterdependencies.defaultTrace'),
    showlegend: false,
    hovertemplate: '%{x}<br>' + '%{yaxis.title.text}: <b>%{y:.2f}</b>' + '<extra></extra>',
  },
]

const timeResolution = 900 * 1000

export default {
  mixins: [CommonChartMixin],
  components: {
    AsInterdependenciesTable,
  },
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4,
    },
    clear: {
      type: Number,
      default: 1,
    },
    noTable: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    return {
      details: {
        activeTab: null,
        date: null,
        tablesData: {
          dependency: null,
          dependent: null,
        },
        tableVisible: false,
        enableBgpPlay: false,
      },
      loadingHegemony: true,
      loadingHegemonyCone: true,
      hegemonyFilter: null,
      hegemonyConeFilter: null,
      traces: DEFAULT_TRACE,
      layout: AS_INTERDEPENDENCIES_LAYOUT,
      loadingNeighbours: true,
      neighbours: [],
    }
  },
  beforeMount() {
    this.updateAxesLabel()
  },
  mounted() {
    this.tableFromQuery()
    this.getNeighboursData()
  },
  methods: {
    updateAxesLabel() {
      this.layout.yaxis.title = 'AS' + this.asNumber + ` ${this.$t('charts.asInterdependencies.yaxis')}`
      this.layout.yaxis2.title = `${this.$t('charts.asInterdependencies.yaxis2')} AS` + this.asNumber
    },
    makeHegemonyFilter() {
      return new HegemonyQuery()
        .originAs(this.asNumber)
        .addressFamily(this.addressFamily)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime()
    },
    makeHegemonyConeFilter() {
      return new HegemonyConeQuery()
        .asNumber(this.asNumber)
        .addressFamily(this.addressFamily)
        .timeInterval(this.startTime, this.endTime)
        .orderedByTime()
    },
    apiCall() {
      if (this.asNumber == 0) return
      this.updateAxesLabel()
      this.hegemonyFilter = this.makeHegemonyFilter()
      this.hegemonyConeFilter = this.makeHegemonyConeFilter()
      this.traces = extend(true, [], DEFAULT_TRACE)
      this.loading = true
      this.loadingHegemony = true
      this.loadingHegemonyCone = true
      this.queryHegemonyAPI()
      this.queryHegemonyConeAPI()

      this.neighbours = []
    },
    getNeighboursData() {
      ripeApi.asnNeighbours(this.asNumber).then(res => {
        res.data.neighbours.forEach(neighbour => {
          this.neighbours.push(neighbour.asn)
        })
        this.loadingNeighbours = false
        console.log('asnNeighbours data loaded')
        let intervalEnd = this.details.date
        let intervalStart = new Date(intervalEnd.getTime() - 15 * 60000)

        let dependencyFilter = this.makeHegemonyFilter().timeInterval(intervalStart, intervalEnd)
        let dependentFilter = dependencyFilter.clone().originAs().asNumber(this.asNumber)
        this.updateTable('dependency', 'asn', dependencyFilter, intervalStart, intervalEnd)
        this.updateTable('dependent', 'originasn', dependentFilter, intervalStart, intervalEnd)
      })
    },
    plotClick(clickData) {
      var table = 'dependency'
      if (clickData.points[0].data.yaxis == 'y2') {
        table = 'dependent'
      }
      this.showTable(table, clickData.points[0].x)
    },
    tableFromQuery() {
      // if query parameter have click information then show corresponding tables
      let selectedDate = this.$route.query.hege_dt
      let table = this.$route.query.hege_tb
      if (selectedDate != undefined && table != undefined) {
        this.showTable(table, selectedDate)
      }
    },
    showTable(table, selectedDate) {
      if (selectedDate.length < 14) {
        // at midnight no time is given
        this.details.date = Date.parse(selectedDate + ' 00:00 GMT') //adding timezone to string...
      } else {
        this.details.date = Date.parse(selectedDate + ' GMT') //adding timezone to string...
      }

      let intervalEnd = this.details.date
      let intervalStart = new Date(intervalEnd.getTime() - 15 * 60000)

      this.details.activeTab = table
      let dependencyFilter = this.makeHegemonyFilter().timeInterval(intervalStart, intervalEnd)
      let dependentFilter = dependencyFilter.clone().originAs().asNumber(this.asNumber)

      this.details.tablesData['dependency'] = {
        data: [],
        loading: true,
        filter: dependencyFilter,
      }
      this.details.tablesData['dependent'] = {
        data: [],
        loading: true,
        filter: dependentFilter,
      }
      this.details.tableVisible = true
      if (!this.loadingNeighbours) {
        this.updateTable('dependency', 'asn', dependencyFilter, intervalStart, intervalEnd)
        this.updateTable('dependent', 'originasn', dependentFilter, intervalStart, intervalEnd)
      }
    },
    updateTable(tableType, hegemonyComparator, filter, intervalStart, intervalEnd) {

      this.$ihr_api.hegemony(
        filter,
        results => {
          if (intervalStart != intervalEnd) {
            let startString = intervalStart.toISOString().replace('.000', '')
            let data = {}
            let res = []
            results.results.forEach(elem => {
              let asn = elem[hegemonyComparator]
              if (asn != 0) {
                if (elem.timebin == startString) {
                  data[asn] = elem
                } else {
                  if (data[asn] != undefined) {
                    elem.increment = 100 * ((elem.hege - data[asn].hege) / data[asn].hege)
                    res.push(elem)
                    delete data[asn]
                  } else {
                    elem.increment = 100
                    res.push(elem)
                  }
                }
                elem.direct = this.neighbours.includes(asn)
              }
            })

            for (var unprocessed in data) {
              data[unprocessed].increment = -100
              data[unprocessed].hege = 0
              res.push(data[unprocessed])
            }
            results.results = res
          }


          this.details.tablesData[tableType] = {
            data: results.results,
            loading: false,
            filter: filter,
          }
        },
        error => {
          console.error(error) //TODO better error handling
        }
      )
    },
    queryHegemonyAPI() {
      this.loadingHegemony = true
      this.$ihr_api.hegemony(
        this.hegemonyFilter,
        result => {
          this.fetchHegemony(result.results)
          this.loadingHegemony = false
          this.loading = this.loadingHegemony || this.loadingHegemonyCone
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    queryHegemonyConeAPI() {
      this.loadingHegemonyCone = true
      this.$ihr_api.hegemony_cone(
        this.hegemonyConeFilter,
        result => {
          this.fetchHegemonyCone(result.results)
          this.loadingHegemonyCone = false
          this.loading = this.loadingHegemony || this.loadingHegemonyCone
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    fetchHegemony(data) {
      console.log('fetchHegemony')
      let traces = {}
      let missingDataList = []

      let anotherAsn
      let minX, maxX
      //console.log(data);
      if (data.length == 0) {
        this.traces = extend(true, [], DEFAULT_TRACE)
        this.layout.annotations = [
          {
            x: 0.45,
            y: 0.23,
            xref: 'paper',
            yref: 'paper',
            text: 'Network is unreachable',
            showarrow: false,
            font: {
              size: 22,
            },
          },
        ]
        return
      } else {
        var noDependency = false
        data.forEach(elem => {
          if (elem.originasn == 0) {
            noDependency = true
          }
        })
        if (noDependency) {
          this.layout.annotations = [
            {
              x: 0.45,
              y: 0.23,
              xref: 'paper',
              yref: 'paper',
              text: 'No dependency',
              showarrow: false,
              font: {
                size: 22,
              },
            },
          ]
        }
      }

      data.forEach(elem => {
        if (elem.asn == this.asNumber) return
        let trace = traces[elem.asn]

        if (anotherAsn === undefined) anotherAsn = elem.asn
        if (trace === undefined) {
          trace = {
            mode: 'lines',
            type: 'scatter',
            x: [],
            y: [],
            name: this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) + ' ' + elem.asn_name.split(' ')[0],
            hovertemplate:
              '<b>' +
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              ' ' +
              elem.asn_name.split(' ')[0] +
              '</b><br><br>' +
              '%{x}<br>' +
              '%{yaxis.title.text}: <b>%{y:.2f}%</b>' +
              '<extra></extra>',
            connectgaps: false,
          }

          traces[elem.asn] = trace
          this.traces.push(trace)
        }

        if (!minX) {
          minX = Date.parse(elem.timebin).getTime()
          maxX = Date.parse(elem.timebin).getTime()
        } else {
          minX = Math.min(minX, Date.parse(elem.timebin).getTime())
          maxX = Math.max(maxX, Date.parse(elem.timebin).getTime())
        }

        // Add null if there is missing data
        let prevDate = Date.parse(trace.x.slice(-1)[0])
        let currDate = Date.parse(elem.timebin)

        // let prevDateSeconds = prevDate && prevDate.getTime()
        // console.log(prevDate, prevDateSeconds, prevDate)

        if (prevDate && currDate.getTime() > prevDate.getTime() + timeResolution + 1) {
          if (anotherAsn === elem.asn) {
            missingDataList.push({
              start: trace.x.slice(-1)[0],
              end: elem.timebin,
            })
          }

          trace.y.push(null)
          trace.x.push('nodate')
        }
        trace.y.push(elem.hege * 100)
        trace.x.push(elem.timebin)
      })
      this.noData |= Object.keys(traces).length == 0
      this.layout.datarevision = new Date().getTime()

      // console.log('md', missingDataList)

      let shapeList = []

      missingDataList.forEach(interval => {
        const intervalStartTime = Date.parse(interval.start).getTime()
        const intervalEndTime = Date.parse(interval.end).getTime()
        let skip = false
        data.forEach(elem => {
          const elemTime = Date.parse(elem.timebin).getTime()
          if (elemTime > intervalStartTime && elemTime < intervalEndTime) {
            console.log(elem)
            skip = true
          }
        })

        if (skip) return

        shapeList.push({
          type: 'rect',
          xref: 'x',
          yref: 'paper',
          x0: interval.start,
          y0: 0,
          x1: interval.end,
          y1: 1,
          fillcolor: '#d3d3d3',
          opacity: 0.2,
          line: {
            width: 0,
          },
        })
        let prevDate = Date.parse(interval.start).getTime()
        let currDate = Date.parse(interval.end).getTime()
        let x = (currDate - prevDate) / 2
        let d = new Date(x + prevDate)

        const noDataTrace = {
          mode: 'text',
          text: ['no data'],
          x: [d.toISOString()],
          y: [15],
          showlegend: false,
        }
        this.traces.push(noDataTrace)
      })

      this.layout['shapes'] = shapeList

      // console.log('maxX', new Date(maxX).toISOString())
      let maxXIso = new Date(maxX).toISOString().split('.')[0] + 'Z'
      let minXIso = new Date(minX).toISOString().split('.')[0] + 'Z'
      // console.log(minXIso, maxXIso)

      for (let i = 1; i < this.traces.length; i++) {
        if (this.traces[i].mode && this.traces[i].mode === 'text') continue
        let currentTrace = this.traces[i]
        let lastDate = currentTrace.x.slice(-1)[0]
        let firstDate = currentTrace.x[0]
        // console.log('first date, last date', firstDate, lastDate)
        let lastDateMilliSeconds = Date.parse(lastDate).getTime()
        let firstDateMilliSeconds = Date.parse(firstDate).getTime()

        if (lastDate !== maxXIso) {
          let noOfPointsToAdd
          let interval = maxX - Date.parse(currentTrace.x.slice(-1)[0]).getTime()
          noOfPointsToAdd = interval / timeResolution
          // console.log('pts', interval / timeResolution)
          for (let j = 1; j <= noOfPointsToAdd; j++) {
            lastDateMilliSeconds += timeResolution
            let skip = false
            for (let k = 0; k < missingDataList.length; k++) {
              if (
                lastDateMilliSeconds > Date.parse(missingDataList[k].start).getTime() &&
                lastDateMilliSeconds < Date.parse(missingDataList[k].end).getTime()
              ) {
                skip = true
                break
              }
            }

            if (skip) continue
            let d = new Date(lastDateMilliSeconds).toISOString().split('.')[0] + 'Z'
            this.traces[i].x.push(d)
            this.traces[i].y.push(0)
          }
          // console.log('lin traces', this.traces[i])
        }

        if (firstDate !== minXIso) {
          // console.log('front defect', firstDate, this.traces[i], minXIso)
          let noOfPointsToAdd
          let interval = Date.parse(currentTrace.x[0]).getTime() - minX
          noOfPointsToAdd = interval / timeResolution
          // console.log('npad', noOfPointsToAdd)

          const tempX = []
          const tempY = []
          for (let j = 1; j <= noOfPointsToAdd; j++) {
            firstDateMilliSeconds -= timeResolution
            let skip = false
            for (let k = 0; k < missingDataList.length; k++) {
              if (
                firstDateMilliSeconds > Date.parse(missingDataList[k].start).getTime() &&
                firstDateMilliSeconds < Date.parse(missingDataList[k].end).getTime()
              ) {
                skip = true
                break
              }
            }

            if (skip) continue
            let d = new Date(firstDateMilliSeconds).toISOString().split('.')[0] + 'Z'
            tempX.push(d)
            tempY.push(0)
          }
          tempX.reverse()
          // console.log('tempx tempy', tempX, tempY)
          this.traces[i].x = tempX.concat(this.traces[i].x)
          this.traces[i].y = tempY.concat(this.traces[i].y)
        }
      }

      //console.log(this.traces.length)
      //console.log(traces)

      if (this.traces.length > 12) {
        this.layout.showlegend = false
      } else {
        this.layout.showlegend = true
      }
    },
    fetchHegemonyCone(data) {
      // console.log('fetchHegemonyCone')
      let trace = this.traces[0]
      data.forEach(resp => {
        let prevDate = Date.parse(trace.x.slice(-1)[0])
        let currDate = Date.parse(resp.timebin)

        if (prevDate && currDate.getTime() > prevDate.getTime() + timeResolution + 1) {
          trace.y.push(null)
          trace.x.push('nodate')
        }

        trace.y.push(resp.conesize)
        trace.x.push(resp.timebin)
      })
      for (let i = 1; i < trace.length; i++) {
        let a = new Date(trace[i - 1].x)
        let b = new Date(trace[i].x)
        if (isNaN(a) || isNaN(b) || b - a < 0) {
          console.error('error', a, b, b - a)
        }
      }
      this.noData |= trace.length == 0
      this.layout.datarevision = new Date().getTime()
    },
    clearGraph() {
      this.traces = []
      this.layout.datarevision = new Date().getTime()
    },
  },
  computed: {
    bgplay() {
      return `/ihr/widget/bgplay?asn=${this.asNumber}&date=${this.dateStr}`
    },
    dateStr() {
      let year = this.details.date.getUTCFullYear()
      var day = this.details.date.getUTCDate()
      var month = this.details.date.getUTCMonth() + 1
      var hours = this.details.date.getUTCHours()
      var minutes = this.details.date.getUTCMinutes()
      var seconds = this.details.date.getUTCSeconds()

      if (day < 10) day = '0' + day
      if (month < 10) month = '0' + month
      if (hours < 10) hours = '0' + hours
      if (minutes < 10) minutes = '0' + minutes
      if (seconds < 10) seconds = '0' + seconds

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
    },
    networkDependencyData() {
      return this.details.tablesData.dependency.data.filter(elem => {
        return elem.asn != this.asNumber
      })
    },
    dependentNetworksData() {
      return this.details.tablesData.dependent.data.filter(elem => {
        return elem.originasn != this.asNumber
      })
    },
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter)
    },
    hegemonyConeUrl() {
      return this.$ihr_api.getUrl(this.hegemonyConeFilter)
    },
    dependencyUrl() {
      return this.$ihr_api.getUrl(this.details.tablesData.dependency.filter)
    },
    dependentUrl() {
      return this.$ihr_api.getUrl(this.details.tablesData.dependent.filter)
    },
  },
  watch: {
    addressFamily() {
      this.debouncedApiCall()
    },
    asNumber() {
      this.debouncedApiCall()
      this.details.tableVisible = false
    },
    'details.activeTab'(newValue) {
      this.updateQuery({ hege_tb: newValue })
    },
    'details.date'(newValue) {
      const str = newValue.toISOString().slice(0, 16).replace('T', ' ')
      this.updateQuery({ hege_dt: str })
    },
    clear() {
      this.clearGraph()
      this.$nextTick(function () {
        this.loading = true
      })
    },
  },
}
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";
.bgplay-container {
  overflow: hidden;
  padding-top: 1100px;
  position: relative;
}

.bgplay-container iframe {
   border: 0;
   height: 100%;
   left: 0;
   position: absolute;
   top: 0;
   width: 100%;
}
</style>
