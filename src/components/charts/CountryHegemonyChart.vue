<script setup>
import { QSpinner, QCard, QTabs, QTab, QTabPanels, QTabPanel } from 'quasar'
import CountryHegemonyTable from '../tables/CountryHegemonyTable.vue'
import { useRoute, useRouter } from 'vue-router'
import { HegemonyCountryQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { AS_INTERDEPENDENCIES_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { ref, onBeforeMount, onMounted, computed, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: 'y2',
    name: t('charts.countryHegemony.defaultTrace'),
    showlegend: false,
    hovertemplate: '%{x}<br>' + '%{yaxis.title.text}: <b>%{y:.2f}</b>' + '<extra></extra>',
  },
]

const props = defineProps({
  countryCode: {
    type: String,
    required: true,
  },
  addressFamily: {
    type: Number,
    default: AS_FAMILY.v4,
  },
  eyeballThreshold: {
    type: Number,
    default: 10,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  }
})

const emits = defineEmits({
  'eyeballs': (asns) => {
    if (asns !== null) {
      return true
    } else {
      console.warn('ASns is missing!');
      return false
    }
  }
})

const details = ref({
  activeTab: 'dependency',
  date: null,
  tablesData: {
    dependency: { data: [] },
  },
  tableVisible: true,
})
const loading = ref(true)
const hegemonyFilter = ref(null)
const traces = ref(DEFAULT_TRACE)
const layout = ref(AS_INTERDEPENDENCIES_LAYOUT)
const major_eyeball = ref([])
const noData = ref('')

const updateAxesLabel = () => {
  layout.value.yaxis.title = props.countryCode + ` ${t('charts.countryHegemony.yaxis')}`
  layout.value.yaxis2.title = `${t('charts.countryHegemony.yaxis2')} ` + props.countryCode
}

const makeHegemonyFilter = () => {
  return new HegemonyCountryQuery()
    .country(props.countryCode)
    .addressFamily(props.addressFamily)
    .timeInterval(props.startTime, props.endTime)
}

const apiCall = () => {
  updateAxesLabel()
  hegemonyFilter.value = makeHegemonyFilter()
  loading.value = true
  queryCountryHegemonyAPI()
}

const queryCountryHegemonyAPI = () => {
  loading.value = true
  ihr_api.hegemony_country(
    hegemonyFilter.value,
    result => {
      fetchCountryHegemony(result.results)
      loading.value = false
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const median = (values) => {
  if (values == undefined) {
    return 0
  }
  if (values.length === 0) {
    return 0
  }

  values.sort((a, b) => {
    return a - b
  })

  const half = Math.floor(values.length / 2)

  if (values.length % 2) {
    return values[half]
  }

  return (values[half - 1] + values[half]) / 2.0
}

const fetchCountryHegemony = (data) => {
  traces.value = []
  let tracesLocal = {}
  data.forEach(elem => {
    let trace = tracesLocal[elem.asn]
    if (trace === undefined) {
      trace = {
        hege_as: [],
        hege_eye_all: [],
        hege_eye_transit: [],
        asn: elem.asn,
        asn_name: elem.asn_name,
        eyeball: 0,
        name: ihr_api.ihr_NumberToAsOrIxp(elem.asn) + ' ' + elem.asn_name.split(' ')[0],
        hovertemplate:
          '<b>' +
          ihr_api.ihr_NumberToAsOrIxp(elem.asn) +
          ' ' +
          elem.asn_name.split(' ')[0] +
          '</b><br><br>' +
          '%{x}<br>' +
          '%{yaxis.title.text}: <b>%{y:.2f}</b>' +
          '<extra></extra>',
      }
      tracesLocal[elem.asn] = trace
      traces.value.push(trace)
    }
    if (elem.weightscheme == 'as') {
      if (!elem.transitonly) {
        trace.hege_as.push(elem.hege)
      }
    } else if (elem.weightscheme == 'eyeball') {
      if (elem.transitonly) {
        trace.hege_eye_transit.push(elem.hege)
      } else {
        trace.hege_eye_all.push(elem.hege)
        trace.eyeball = elem.weight
      }
    }
  })

  // Compute median value from each array of hegemony scores
  major_eyeball.value = []
  traces.value.forEach(elem => {
    elem.hege_as = median(elem.hege_as) * 100
    elem.hege_eye_all = median(elem.hege_eye_all) * 100
    elem.hege_eye_transit = median(elem.hege_eye_transit) * 100

    if (elem.eyeball > props.eyeballThreshold) {
      major_eyeball.value.push(elem.asn)
    }
  })
  emits('eyeballs', major_eyeball.value)

  // TODO remove the 2 fl
  noData.value |= Object.keys(tracesLocal).length == 0
  layout.value.datarevision = new Date().getTime()

  details.value.tableVisible = true
  details.value.tablesData['dependency'] = {
    data: traces.value,
  }
}

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

const countryHegemonyData = computed(() => {
  return details.value.tablesData.dependency.data
})

const hegemonyUrl = computed(() => {
  return ihr_api.getUrl(hegemonyFilter.value)
})

watch(() => props.addressFamily, () => {
  apiCall()
})
watch(() => props.countryCode, () => {
  apiCall()
})
watch(() => props.endTime, () => {
  apiCall()
})
watch(() => details.value.activeTab, (newValue) => {
  router.push({
    replace: true,
    query: Object.assign({}, route.query, { hege_tb: newValue })
  })
})

onBeforeMount(() => {
  updateAxesLabel()
})

onMounted(() => {
  details.value.date = `${props.startTime} - ${props.endTime}`
  apiCall()
})
</script>

<template>
  <div class="IHR_chart">
    <div v-if="loading" class="IHR_loading-spinner">
      <QSpinner color="secondary" size="15em" />
    </div>
    <QCard v-if="details.tableVisible" class="q-ma-xl">
      <QTabs
        v-model="details.activeTab"
        class="table-card text-grey bg-grey-2"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="dependency" :label="$t('charts.countryHegemony.table.dependencyTitle')" />
        <QTab name="api" label="API" />
      </QTabs>
      <QTabPanels v-model="details.activeTab" animated>
        <QTabPanel name="dependency">
          <CountryHegemonyTable :data="countryHegemonyData" :loading="loading" />
        </QTabPanel>
        <QTabPanel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{ $t('charts.countryHegemony.table.apiTitle') }}</h3>
          <table>
            <tr>
              <td>
                <a :href="hegemonyUrl" target="_blank" id="tableUrl">{{ hegemonyUrl }}</a>
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
  padding-top 1100px
  position relative


.bgplay-container 
  &iframe
    border 0
    height 100%
    left 0
    position absolute
    top 0
    width 100%
</style>