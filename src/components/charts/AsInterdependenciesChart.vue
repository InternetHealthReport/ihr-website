<script setup>
import { QSpinner, QCard, QCardSection, QBtn, QTabs, QTab, QTabPanels, QTabPanel, extend } from 'quasar'
import { ref, inject, onBeforeMount, onMounted, computed, watch, nextTick } from 'vue'
import { HegemonyQuery, HegemonyConeQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { AS_INTERDEPENDENCIES_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { useI18n } from 'vue-i18n'
import ripeApi from '@/plugins/RipeApi'
import { useRoute, useRouter } from 'vue-router'
import ReactiveChart from './ReactiveChart.vue'
import AsInterdependenciesTable from '../tables/AsInterdependenciesTable.vue'
import Bgplay from '../ripe/Bgplay.vue'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const { t } = useI18n()

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    mode: 'lines',
    type: 'scatter',
    x: [],
    y: [],
    yaxis: 'y2',
    name: t('charts.asInterdependencies.defaultTrace'),
    showlegend: false,
    hovertemplate: '%{x}<br>' + '%{yaxis.title.text}: <b>%{y:.2f}</b>' + '<extra></extra>',
  },
]

const timeResolution = 900 * 1000

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const props = defineProps({
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
  startTime: {
    type: Object,
    required: true
  },
  endTime: {
    type: Object,
    required: true
  },
  fetch: {
    type: Boolean,
    required: true
  }
})

const details = ref({
  activeTab: null,
  date: props.endTime,
  tablesData: {
    dependency: null,
    dependent: null,
  },
  tableVisible: false,
  enableBgpPlay: false,
})
const loadingHegemony = ref(true)
const loadingHegemonyCone = ref(true)
const hegemonyFilter = ref(null)
const hegemonyTier1Filter = ref(null)
const hegemonyConeFilter = ref(null)
const traces = ref(DEFAULT_TRACE)
const layout = ref({...AS_INTERDEPENDENCIES_LAYOUT})
const loadingNeighbours = ref(true)
const neighbours = ref([])
const loading = ref(true)
const noData = ref('')
const noDataError = ref(true)

const route = useRoute()
const router = useRouter()

const updateAxesLabel = () => {
  layout.value.yaxis.title = 'AS' + props.asNumber + ` ${t('charts.asInterdependencies.yaxis')}`
  layout.value.yaxis2.title = `${t('charts.asInterdependencies.yaxis2')} AS` + props.asNumber
}

const makeHegemonyFilter = () => {
  return new HegemonyQuery()
    .originAs(props.asNumber)
    .addressFamily(props.addressFamily)
    .timeInterval(props.startTime, props.endTime)
    .orderedByTime()
}

const makeHegemonyTier1Filter = () => {
    return new HegemonyQuery()
    .originAs(1299)
    .asNumber(1299)
    .addressFamily(props.addressFamily)
    .timeInterval(props.startTime, props.endTime)
    .orderedByTime()
}

const makeHegemonyConeFilter = () => {
  return new HegemonyConeQuery()
    .asNumber(props.asNumber)
    .addressFamily(props.addressFamily)
    .timeInterval(props.startTime, props.endTime)
    .orderedByTime()
}

const apiCall = async() => {
  if (props.asNumber == 0) {
    return
  }
  updateAxesLabel()
  hegemonyFilter.value = makeHegemonyFilter()
  hegemonyConeFilter.value = makeHegemonyConeFilter()
  hegemonyTier1Filter.value = makeHegemonyTier1Filter()
  traces.value = extend(true, [], DEFAULT_TRACE)
  loading.value = true
  loadingHegemony.value = true
  loadingHegemonyCone.value = true
  await queryHegemonyTier1API()
  queryHegemonyAPI()
  queryHegemonyConeAPI()

  neighbours.value = []
}

const getNeighboursData = () => {
  ripeApi.asnNeighbours(props.asNumber).then(res => {
    res.data.data.neighbours.forEach(neighbour => {
      neighbours.value.push(neighbour.asn)
    })
    loadingNeighbours.value = false
    const intervalEnd = details.value.date
    const intervalStart = new Date(intervalEnd.getTime() - 15 * 60000)
    const dependencyFilter = makeHegemonyFilter().timeInterval(intervalStart, intervalEnd)
    const dependentFilter = dependencyFilter.clone().originAs().asNumber(props.asNumber)
    updateTable('dependency', 'asn', dependencyFilter, intervalStart, intervalEnd)
    updateTable('dependent', 'originasn', dependentFilter, intervalStart, intervalEnd)
  })
}

const plotClick = (clickData) => {
  if (props.noTable) {
    return
  }
  let table = 'dependency'
  if (clickData.points[0].data.yaxis == 'y2') {
    table = 'dependent'
  }
  showTable(table, clickData.points[0].x)
}

const tableFromQuery = () => {
  // if query parameter have click information then show corresponding tables
  if (props.noTable) {
    return
  }
  const selectedDate = route.query.hege_dt
  const table = route.query.hege_tb
  if (selectedDate != undefined && table != undefined) {
    showTable(table, selectedDate)
  }
}

const showTable = (table, selectedDate) => {
  if (props.noTable) {
    return
  }
  getNeighboursData()
  if (selectedDate.length < 16) {
    // at midnight no time is given
    details.value.date = new Date(selectedDate + ' 00:00 GMT') //adding timezone to string...
  } else {
    details.value.date = new Date(selectedDate + ' GMT') //adding timezone to string...
  }

  const intervalEnd = details.value.date
  const intervalStart = new Date(intervalEnd.getTime() - 15 * 60000)

  details.value.activeTab = table
  let dependencyFilter = makeHegemonyFilter().timeInterval(intervalStart, intervalEnd)
  let dependentFilter = dependencyFilter.clone().originAs().asNumber(props.asNumber)

  details.value.tablesData['dependency'] = {
    data: [],
    loading: true,
    filter: dependencyFilter,
  }
  details.value.tablesData['dependent'] = {
    data: [],
    loading: true,
    filter: dependentFilter,
  }
  details.value.tableVisible = true
  if (!loadingNeighbours.value) {
    updateTable('dependency', 'asn', dependencyFilter, intervalStart, intervalEnd)
    updateTable('dependent', 'originasn', dependentFilter, intervalStart, intervalEnd)
  }
}

const updateTable = (tableType, hegemonyComparator, filter, intervalStart, intervalEnd) => {
  ihr_api.hegemony(
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
            elem.direct = neighbours.value.includes(asn)
          }
        })

        for (let unprocessed in data) {
          data[unprocessed].increment = -100
          data[unprocessed].hege = 0
          res.push(data[unprocessed])
        }
        results.results = res
      }


      details.value.tablesData[tableType] = {
        data: results.results,
        loading: false,
        filter: filter,
      }
    },
    error => {
      console.error(error) //TODO better error handling
    }
  )
}

const queryHegemonyAPI = () => {
  loadingHegemony.value = true
  ihr_api.hegemony(
    hegemonyFilter.value,
    result => {
      fetchHegemony(result.results)
      loadingHegemony.value = false
      loading.value = loadingHegemony.value || loadingHegemonyCone.value
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const queryHegemonyTier1API = async() => {
  try {
    const result = await new Promise((resolve, reject) => {
      ihr_api.hegemony(
        hegemonyTier1Filter.value,
        result => {
          resolve(result);
        },
        error => {
          reject(error);
        }
      );
    });
    if(result.results.length > 0) noDataError.value = false
  } catch (error) {
    console.error(error); //FIXME do a correct alert
  }
}

const queryHegemonyConeAPI = () => {
  loadingHegemonyCone.value = true
  ihr_api.hegemony_cone(
    hegemonyConeFilter.value,
    result => {
      fetchHegemonyCone(result.results)
      loadingHegemonyCone.value = false
      loading.value = loadingHegemony.value || loadingHegemonyCone.value
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const fetchHegemony = (data) => {
  let tracesLocal = {}
  let missingDataList = []

  let anotherAsn
  let minX, maxX
  if (noDataError.value){
    traces.value = extend(true, [], DEFAULT_TRACE)
    layout.value.annotations = [
      {
        x: 0.5,
        y: 0.25,
        xref: 'paper',
        yref: 'paper',
        text: 'No Data Available',
        showarrow: false,
        font: {
          size: 22,
        },
      },
      {
        x: 0.5,
        y: 0.75,
        xref: 'paper',
        yref: 'paper',
        text: 'No Data Available',
        showarrow: false,
        font: {
          size: 22,
        },
      },
    ]
    return
  }
  else if (data.length == 0) {
    traces.value = extend(true, [], DEFAULT_TRACE)
    layout.value.annotations = [
      {
        x: 0.5,
        y: 0.25,
        xref: 'paper',
        yref: 'paper',
        text: 'Network is Unreachable',
        showarrow: false,
        font: {
          size: 22,
        },
      },
      {
        x: 0.5,
        y: 0.75,
        xref: 'paper',
        yref: 'paper',
        text: 'Network is Unreachable',
        showarrow: false,
        font: {
          size: 22,
        },
      },
    ]
    return
  } else if (data.length > 0) {
    let noDependency = false
    data.forEach(elem => {
      if (elem.originasn == 0) {
        noDependency = true
      }
    })
    if (noDependency) {
      layout.value.annotations = [
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
    if (elem.asn == props.asNumber) {
      return
    }
    let trace = tracesLocal[elem.asn]

    if (anotherAsn === undefined) {
      anotherAsn = elem.asn
    }
    if (trace === undefined) {
      trace = {
        mode: 'lines',
        type: 'scatter',
        x: [],
        y: [],
        name: ihr_api.ihr_NumberToAsOrIxp(elem.asn) + ' ' + elem.asn_name.split(' ')[0],
        hovertemplate:
          '<b>' +
          ihr_api.ihr_NumberToAsOrIxp(elem.asn) +
          ' ' +
          elem.asn_name.split(' ')[0] +
          '</b><br><br>' +
          '%{x}<br>' +
          '%{yaxis.title.text}: <b>%{y:.2f}%</b>' +
          '<extra></extra>',
        connectgaps: false,
      }
      if (elem.hege === 1) {
        trace.name = trace.name + ' (direct)'
      }
      tracesLocal[elem.asn] = trace
      traces.value.push(trace)
    }

    if (!minX) {
      minX = new Date(elem.timebin).getTime()
      maxX = new Date(elem.timebin).getTime()
    } else {
      minX = Math.min(minX, new Date(elem.timebin).getTime())
      maxX = Math.max(maxX, new Date(elem.timebin).getTime())
    }

    // Add null if there is missing data
    let prevDate = new Date(trace.x.slice(-1)[0])
    let currDate = new Date(elem.timebin)

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
  noData.value |= Object.keys(tracesLocal).length == 0
  layout.value.datarevision = new Date().getTime()

  // console.log('md', missingDataList)

  let shapeList = []

  missingDataList.forEach(interval => {
    const intervalStartTime = new Date(interval.start).getTime()
    const intervalEndTime = new Date(interval.end).getTime()
    let skip = false
    data.forEach(elem => {
      const elemTime = new Date(elem.timebin).getTime()
      if (elemTime > intervalStartTime && elemTime < intervalEndTime) {
        skip = true
      }
    })

    if (skip) {
      return
    }

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
    let prevDate = new Date(interval.start).getTime()
    let currDate = new Date(interval.end).getTime()
    let x = (currDate - prevDate) / 2
    let d = new Date(x + prevDate)

    const noDataTrace = {
      mode: 'text',
      text: ['no data'],
      x: [d.toISOString()],
      y: [15],
      showlegend: false,
    }
    traces.value.push(noDataTrace)
  })

  layout.value['shapes'] = shapeList

  if (!maxX || !minX) {
    clearGraph()
    noData.value = t('No data available for this network')
    return
  }
  let maxXIso = new Date(maxX).toISOString().split('.')[0] + 'Z'
  let minXIso = new Date(minX).toISOString().split('.')[0] + 'Z'
  // console.log(minXIso, maxXIso)

  for (let i = 1; i < traces.value.length; i++) {
    if (traces.value[i].mode && traces.value[i].mode === 'text') {
      continue
    }
    let currentTrace = traces.value[i]
    let lastDate = currentTrace.x.slice(-1)[0]
    let firstDate = currentTrace.x[0]
    // console.log('first date, last date', firstDate, lastDate)
    let lastDateMilliSeconds = new Date(lastDate).getTime()
    let firstDateMilliSeconds = new Date(firstDate).getTime()

    if (lastDate !== maxXIso) {
      let noOfPointsToAdd
      let interval = maxX - new Date(currentTrace.x.slice(-1)[0]).getTime()
      noOfPointsToAdd = interval / timeResolution
      // console.log('pts', interval / timeResolution)
      for (let j = 1; j <= noOfPointsToAdd; j++) {
        lastDateMilliSeconds += timeResolution
        let skip = false
        for (let k = 0; k < missingDataList.length; k++) {
          if (
            lastDateMilliSeconds > new Date(missingDataList[k].start).getTime() &&
            lastDateMilliSeconds < new Date(missingDataList[k].end).getTime()
          ) {
            skip = true
            break
          }
        }

        if (skip) continue
        let d = new Date(lastDateMilliSeconds).toISOString().split('.')[0] + 'Z'
        traces.value[i].x.push(d)
        traces.value[i].y.push(0)
      }
      // console.log('lin traces', this.traces[i])
    }

    if (firstDate !== minXIso) {
      // console.log('front defect', firstDate, this.traces[i], minXIso)
      let noOfPointsToAdd
      let interval = new Date(currentTrace.x[0]).getTime() - minX
      noOfPointsToAdd = interval / timeResolution
      // console.log('npad', noOfPointsToAdd)

      const tempX = []
      const tempY = []
      for (let j = 1; j <= noOfPointsToAdd; j++) {
        firstDateMilliSeconds -= timeResolution
        let skip = false
        for (let k = 0; k < missingDataList.length; k++) {
          if (
            firstDateMilliSeconds > new Date(missingDataList[k].start).getTime() &&
            firstDateMilliSeconds < new Date(missingDataList[k].end).getTime()
          ) {
            skip = true
            break
          }
        }

        if (skip) {
          continue
        }
        let d = new Date(firstDateMilliSeconds).toISOString().split('.')[0] + 'Z'
        tempX.push(d)
        tempY.push(0)
      }
      tempX.reverse()
      // console.log('tempx tempy', tempX, tempY)
      traces.value[i].x = tempX.concat(traces.value[i].x)
      traces.value[i].y = tempY.concat(traces.value[i].y)
    }
  }

  //console.log(this.traces.length)
  //console.log(traces)

  if (traces.value.length > 12) {
    layout.value.showlegend = false
  } else {
    layout.value.showlegend = true
  }
}

const fetchHegemonyCone = (data) => {
  let traceLocal = traces.value[0]
  if (traceLocal === undefined) {
    return
  }
  data.forEach(resp => {
    let prevDate = new Date(traceLocal.x.slice(-1)[0])
    let currDate = new Date(resp.timebin)

    if (prevDate && currDate.getTime() > prevDate.getTime() + timeResolution + 1) {
      traceLocal.y.push(null)
      traceLocal.x.push('nodate')
    }

    traceLocal.y.push(resp.conesize)
    traceLocal.x.push(resp.timebin)
  })
  for (let i = 1; i < traceLocal.length; i++) {
    let a = new Date(traceLocal[i - 1].x)
    let b = new Date(traceLocal[i].x)
    if (isNaN(a) || isNaN(b) || b - a < 0) {
      console.error('error', a, b, b - a)
    }
  }
  noData.value |= traceLocal.length == 0
  layout.value.datarevision = new Date().getTime()
}

const clearGraph = () => {
  traces.value = []
  layout.value.datarevision = new Date().getTime()
}

const getDateFormat = (chosenTime) => {
  return `${MONTHS_SHORT[chosenTime.getMonth()]} ${chosenTime.getDate()}, ${chosenTime.getFullYear()}, ${("0" + chosenTime.getUTCHours()).slice(-2)}:${("0" + chosenTime.getUTCMinutes()).slice(-2)}`
}

const bgplay = computed(() => {
  return `/ihr/widget/bgplay?asn=${props.asNumber}&date=${dateStr}`
})

const dateStr = computed(() => {
  const year = details.value.date.getUTCFullYear()
  let day = details.value.date.getUTCDate()
  let month = details.value.date.getUTCMonth() + 1
  let hours = details.value.date.getUTCHours()
  let minutes = details.value.date.getUTCMinutes()
  let seconds = details.value.date.getUTCSeconds()

  if (day < 10) {
    day = '0' + day
  }
  if (month < 10) {
    month = '0' + month
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
})

const networkDependencyData = computed(() => {
  return details.value.tablesData.dependency.data.filter(elem => {
    return elem.asn != props.asNumber
  })
})

const dependentNetworksData = computed(() => {
  return details.value.tablesData.dependent.data.filter(elem => {
    return elem.originasn != props.asNumber
  })
})

const hegemonyUrl = computed(() => {
  return ihr_api.getUrl(hegemonyFilter.value)
})

const hegemonyConeUrl = computed(() => {
  return ihr_api.getUrl(hegemonyConeFilter.value)
})

const dependencyUrl = computed(() => {
  return ihr_api.getUrl(details.value.tablesData.dependency.filter)
})

const dependentUrl = computed(() => {
  return ihr_api.getUrl(details.value.tablesData.dependent.filter)
})

// watch(() => props.addressFamily, () => {
//   apiCall()
// })
// watch(() => props.asNumber, () => {
//   apiCall()
//   details.value.tableVisible = false
// })
watch(() => details.value.activeTab, (newValue) => {
  router.push({
    replace: true,
    query: Object.assign({}, route.query, { hege_tb: newValue })
  })
})
watch(() => details.value.date, (newValue) => {
  const str = newValue.toISOString().slice(0, 16).replace('T', ' ')
  router.push({
    replace: true,
    query: Object.assign({}, route.query, { hege_dt: str })
  })
})
watch(() => props.clear, () => {
  clearGraph()
  nextTick(() => {
    loading.value = false
  })
})
watch(() => props.endTime, () => {
  apiCall()
  tableFromQuery()
})

onBeforeMount(() => {
  updateAxesLabel()
})
onMounted(() => {
  apiCall()
  tableFromQuery()
})
</script>

<template>
  <div class="IHR_chart">
    <ReactiveChart :layout="layout" :traces="traces" @plotly-click="plotClick" :no-data="noData" />
    <div v-if="loading" class="IHR_loading-spinner">
      <QSpinner color="secondary" size="15em" />
    </div>
    <QCard v-if="details.tableVisible" class="bg-accent q-ma-xl" dark>
      <QCardSection class="q-pa-xs">
        <div class="row items-center">
          <div class="col">
            <div class="text-h3">{{ getDateFormat(details.date) }}</div>
          </div>
          <div class="col-auto">
            <QBtn class="IHR_table-close-button" size="sm" round flat @click="details.tableVisible = false" icon="fa fa-times-circle"></QBtn>
          </div>
        </div>
      </QCardSection>
      <QTabs dense v-model="details.activeTab" class="table-card text-grey inset-shadow" indicator-color="secondary"
        active-color="primary" active-bg-color="white" align="justify" narrow-indicator>
        <QTab name="dependency" :label="$t('charts.asInterdependencies.table.dependencyTitle')" />
        <QTab name="dependent" :label="$t('charts.asInterdependencies.table.dependentTitle')" />
        <QTab name="bgpPlay" label="AS Graph" />
        <QTab name="api" label="API" />
      </QTabs>
      <QTabPanels v-model="details.activeTab" animated>
        <QTabPanel name="dependency">
          <AsInterdependenciesTable :data="networkDependencyData" :loading="details.tablesData.dependency.loading" />
        </QTabPanel>
        <QTabPanel name="dependent">
          <AsInterdependenciesTable :data="dependentNetworksData" use-origin-asn :loading="details.tablesData.dependent.loading" />
        </QTabPanel>
        <QTabPanel name="bgpPlay">
          <div class="bgplay-container">
            <Bgplay :as-number="asNumber" :date-time="details.date" />
          </div>
        </QTabPanel>
        <QTabPanel name="api" class="IHR_api-table q-pa-lg" light>
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
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus">
.bgplay-container
    overflow hidden
    padding-top 0px !important
    position relative
</style>
