<script setup>
import { ref, inject, onBeforeMount, onMounted, computed, watch } from 'vue'
import { QSelect, QCard, QTabs, QTab, QTabPanels, QTabPanel } from 'quasar'
import { HegemonyPrefixQuery, AS_FAMILY } from '@/plugins/IhrApi'
import { AS_INTERDEPENDENCIES_LAYOUT } from '@/plugins/layouts/layoutsChart'
import { useRoute, useRouter } from 'vue-router'
import PrefixHegemonyTable from '../tables/PrefixHegemonyTable.vue'
import PrefixHegemonyTableStats from '../tables/PrefixHegemonyTableStats.vue'
import '@/styles/chart.sass'

const ihr_api = inject('ihr_api')

const ROV_SELECTIONS = {
  country: [
    {
      label: 'Originated prefix',
      value: 'Originated prefix',
      description: 'All routes observed in BGP data',
      disable: false,
      icon: 'fas fa-cloud-upload-alt'
    },
    {
      label: 'RPKI invalid',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle'
    },
    {
      label: 'IRR invalid',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation'
    },
    {
      label: 'Bogon ASN',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle'
    }
  ],
  asn: [
    {
      label: 'Originated prefix',
      value: 'Originated prefix',
      description: 'All routes observed in BGP data',
      disable: false,
      icon: 'fas fa-cloud-upload-alt'
    },
    {
      label: 'RPKI invalid (origin & transit)',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle'
    },
    {
      label: 'IRR invalid (origin & transit)',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation'
    },
    {
      label: 'Bogon prefix (origin & transit)',
      value: 'Bogon prefix',
      description: 'Unregistered prefixes seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle'
    },
    {
      label: 'Bogon ASN (transit)',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle'
    }
  ],
  global: [
    {
      label: 'RPKI invalid',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle'
    },
    {
      label: 'IRR invalid',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation'
    },
    {
      label: 'Bogon prefix',
      value: 'Bogon prefix',
      description: 'Unregistered prefixes seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle'
    },
    {
      label: 'Bogon ASN',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle'
    }
  ]
}

const props = defineProps({
  asNumber: {
    type: Number
  },
  countryCode: {
    type: String
  },
  addressFamily: {
    type: Number,
    default: AS_FAMILY.v4
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
  activeTab: 'routes',
  date: null,
  tablesData: {
    routes: [],
    origins: [],
    transits: []
  },
  tableVisible: true
})
const statsDisable = ref(false)
const loading = ref(true)
const hegemonyFilter = ref(null)
const routes = ref([])
const origins = ref({})
const transits = ref({})
const layout = ref(AS_INTERDEPENDENCIES_LAYOUT)
const selectionOptions = ref(null)
const selection = ref(null)
const route = useRoute()
const router = useRouter()

onBeforeMount(() => {
  if (props.asNumber != null) {
    selectionOptions.value = ROV_SELECTIONS.asn
    selection.value = selectionOptions.value[1]
  } else if (props.countryCode != null) {
    selectionOptions.value = ROV_SELECTIONS.country
    selection.value = selectionOptions.value[1]
  } else {
    selectionOptions.value = ROV_SELECTIONS.global
    selection.value = selectionOptions.value[0]
  }
})

onMounted(() => {
  details.value.date = `${props.startTime} - ${props.endTime}`
  if (route.query.rov_tb == null) {
    details.value.activeTab = 'routes'
  } else {
    details.value.activeTab = route.query.rov_tb
  }
})

const makeHegemonyFilter = () => {
  const filter = new HegemonyPrefixQuery().timeInterval(props.startTime, props.endTime)
  if (props.countryCode != null) {
    filter.country(props.countryCode)
  }
  if (props.asNumber != null) {
    if (selection.value.value == 'Originated prefix') {
      filter.originAs(props.asNumber)
      statsDisable.value = true
    } else {
      filter.asn(props.asNumber)
    }
  }
  if (selection.value.value == 'Bogon prefix') {
    filter.delegatedPrefixStatus('available')
    statsDisable.value = true
  } else if (selection.value.value == 'Bogon ASN') {
    filter.delegatedAsnStatus('available')
    statsDisable.value = true
  } else if (selection.value.value == 'IRR invalid') {
    filter.irrStatus('Invalid')
    statsDisable.value = false
  } else if (selection.value.value == 'RPKI invalid') {
    filter.rpkiStatus('Invalid')
    statsDisable.value = false
  }
  return filter
}

const apiCall = () => {
  hegemonyFilter.value = makeHegemonyFilter()
  queryPrefixHegemonyAPI()
}

const queryPrefixHegemonyAPI = () => {
  loading.value = true
  ihr_api.hegemony_prefix(
    hegemonyFilter.value,
    (result) => {
      fetchPrefixHegemony(result.results)
      loading.value = false
    },
    (error) => {
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
  var half = Math.floor(values.length / 2)
  if (values.length % 2) {
    return values[half]
  }
  return (values[half - 1] + values[half]) / 2.0
}

const fetchPrefixHegemony = (data) => {
  routes.value = []
  origins.value = {}
  transits.value = {}
  const traces = {}
  data.forEach((elem) => {
    const trace_key = elem.prefix + elem.originasn
    let trace = traces[trace_key]
    if (trace === undefined) {
      trace = {
        maxHege: 1,
        dependencies: {},
        visibility: elem.visibility,
        prefix: { value: elem.prefix, descr: elem.descr },
        originasn: { asn: elem.originasn, name: elem.originasn_name },
        rpki_status: elem.rpki_status,
        irr_status: elem.irr_status,
        country: elem.country,
        delegated_prefix_status: elem.delegated_prefix_status,
        delegated_asn_status: elem.delegated_asn_status,
        name: ihr_api.ihr_NumberToAsOrIxp(elem.asn) + ' ' + elem.asn_name.split(' ')[0],
        hovertemplate:
          '<b>' +
          ihr_api.ihr_NumberToAsOrIxp(elem.asn) +
          ' ' +
          elem.asn_name.split(' ')[0] +
          '</b><br><br>' +
          '%{x}<br>' +
          '%{yaxis.title.text}: <b>%{y:.2f}</b>' +
          '<extra></extra>'
      }
      traces[trace_key] = trace
      routes.value.push(trace)
    }

    const asnRoute = elem.originasn + elem.prefix

    // Count the different status per origin ASN
    if (!(elem.originasn in origins.value)) {
      origins.value[elem.originasn] = {
        count: {},
        name: elem.originasn_name,
        asn: elem.originasn
      }
    }
    if (selection.value.value.startsWith('RPKI')) {
      if (!(elem.rpki_status in origins.value[elem.originasn]['count'])) {
        origins.value[elem.originasn]['count'][elem.rpki_status] = {}
      }
      origins.value[elem.originasn]['count'][elem.rpki_status][asnRoute] = 1
    } else if (selection.value.value.startsWith('IRR')) {
      if (!(elem.irr_status in origins.value[elem.originasn]['count'])) {
        origins.value[elem.originasn]['count'][elem.irr_status] = {}
      }
      origins.value[elem.originasn]['count'][elem.irr_status][asnRoute] = 1
    } else if (selection.value.value.startsWith('Bogon prefix')) {
      if (!(elem.delegated_prefix_status in origins.value[elem.originasn]['count'])) {
        origins.value[elem.originasn]['count'][elem.delegated_prefix_status] = {}
      }
      origins.value[elem.originasn]['count'][elem.delegated_prefix_status][asnRoute] = 1
    } else if (selection.value.value.startsWith('Bogon ASN')) {
      if (!(elem.delegated_asn_status in origins.value[elem.originasn]['count'])) {
        origins.value[elem.originasn]['count'][elem.delegated_asn_status] = {}
      }
      origins.value[elem.originasn]['count'][elem.delegated_asn_status][asnRoute] = 1
    }

    if (elem.asn == elem.originasn) {
      trace.maxHege = elem.hege
    } else {
      trace.dependencies[elem.asn] = {
        asn: elem.asn,
        name: elem.asn_name,
        hege: elem.hege
      }

      // Count the different status per transit ASN
      if (!(elem.asn in transits.value)) {
        transits.value[elem.asn] = {
          count: {},
          name: elem.asn_name,
          asn: elem.asn
        }
      }

      if (selection.value.value.startsWith('RPKI')) {
        if (!(elem.rpki_status in transits.value[elem.asn]['count'])) {
          transits.value[elem.asn]['count'][elem.rpki_status] = {}
        }
        transits.value[elem.asn]['count'][elem.rpki_status][asnRoute] = 1
      } else if (selection.value.value.startsWith('IRR')) {
        if (!(elem.irr_status in transits.value[elem.asn]['count'])) {
          transits.value[elem.asn]['count'][elem.irr_status] = {}
        }
        transits.value[elem.asn]['count'][elem.irr_status][asnRoute] = 1
      } else if (selection.value.value.startsWith('Bogon prefix')) {
        if (!(elem.delegated_prefix_status in transits.value[elem.asn]['count'])) {
          transits.value[elem.asn]['count'][elem.delegated_prefix_status] = {}
        }
        transits.value[elem.asn]['count'][elem.delegated_prefix_status][asnRoute] = 1
      } else if (selection.value.value.startsWith('Bogon ASN')) {
        if (!(elem.delegated_asn_status in transits.value[elem.asn]['count'])) {
          transits.value[elem.asn]['count'][elem.delegated_asn_status] = {}
        }
        transits.value[elem.asn]['count'][elem.delegated_asn_status][asnRoute] = 1
      }

      if (elem.asn == elem.originasn) {
        trace.maxHege = elem.hege
      } else {
        trace.dependencies[elem.asn] = {
          asn: elem.asn,
          name: elem.asn_name,
          hege: elem.hege
        }

        // Count the different status per transit ASN
        if (!(elem.asn in transits.value)) {
          transits.value[elem.asn] = {
            count: {},
            name: elem.asn_name,
            asn: elem.asn
          }
        }

        if (selection.value.value.startsWith('RPKI')) {
          if (!(elem.rpki_status in transits.value[elem.asn]['count'])) {
            transits.value[elem.asn]['count'][elem.rpki_status] = {}
          }
          transits.value[elem.asn]['count'][elem.rpki_status][asnRoute] = 1
        } else if (selection.value.value.startsWith('IRR')) {
          if (!(elem.irr_status in transits.value[elem.asn]['count'])) {
            transits.value[elem.asn]['count'][elem.irr_status] = {}
          }
          transits.value[elem.asn]['count'][elem.irr_status][asnRoute] = 1
        } else if (selection.value.value.startsWith('Bogon prefix')) {
          if (!(elem.delegated_prefix_status in transits.value[elem.asn]['count'])) {
            transits.value[elem.asn]['count'][elem.delegated_prefix_status] = {}
          }
          transits.value[elem.asn]['count'][elem.delegated_prefix_status][asnRoute] = 1
        } else if (selection.value.value.startsWith('Bogon ASN')) {
          if (!(elem.delegated_asn_status in transits.value[elem.asn]['count'])) {
            transits.value[elem.asn]['count'][elem.delegated_asn_status] = {}
          }
          transits.value[elem.asn]['count'][elem.delegated_asn_status][asnRoute] = 1
        }
      }
    }
  })
  // Compute median value of hegemony scores
  routes.value.forEach((elem) => {
    elem.hege_as = median(elem.hege_as) * 100
  })

  // Count unique routes
  Object.values(transits.value).forEach((transit) => {
    Object.keys(transit.count).forEach((status) => {
      transit.count[status] = Object.keys(transit.count[status]).length
    })
  })
  Object.values(origins.value).forEach((origin) => {
    Object.keys(origin.count).forEach((status) => {
      origin.count[status] = Object.keys(origin.count[status]).length
    })
  })

  details.value.tableVisible = true
  details.value.tablesData.routes = routes.value
  details.value.tablesData.origins = Object.values(origins.value)
  details.value.tablesData.transits = Object.values(transits.value)
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

const prefixHegemonyData = computed(() => {
  return details.value.tablesData.routes
})

const prefixHegemonyDataOrigins = computed(() => {
  return details.value.tablesData.origins
})

const prefixHegemonyDataTransits = computed(() => {
  return details.value.tablesData.transits
})

const hegemonyUrl = computed(() => {
  return ihr_api.getUrl(hegemonyFilter.value)
})

watch(selection, () => {
  apiCall()
})
watch(
  () => props.addressFamily,
  () => {
    apiCall()
  }
)
watch(
  () => props.countryCode,
  () => {
    apiCall()
  }
)
watch(
  () => props.endTime,
  () => {
    apiCall()
  }
)
watch(
  () => details.value.activeTab,
  (newValue) => {
    router.push({
      replace: true,
      query: Object.assign({}, route.query, { rov_tb: newValue })
    })
  }
)
</script>

<template>
  <div class="IHR_chart">
    <div class="row justify-center">
      <div class="col-xs-10 col-sm-4 col-lg-2">
        <QSelect v-model="selection" :options="selectionOptions"></QSelect>
      </div>
    </div>
    <br />
    <QCard v-if="details.tableVisible" :flat="route.name == 'rov' ? false : true">
      <QTabs
        v-model="details.activeTab"
        class="table-card text-grey bg-grey-2"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="routes" :label="$t('charts.prefixHegemony.table.routesTitle')" />
        <QTab
          name="origins"
          :disable="statsDisable"
          :label="$t('charts.prefixHegemony.table.originsTitle')"
        />
        <QTab
          name="transits"
          :disable="statsDisable"
          :label="$t('charts.prefixHegemony.table.transitsTitle')"
        />
        <QTab name="api" label="API" />
      </QTabs>
      <QTabPanels v-model="details.activeTab" animated>
        <QTabPanel name="routes">
          <PrefixHegemonyTable
            :data="prefixHegemonyData"
            :loading="loading"
            :showCountry="countryCode == null"
          />
        </QTabPanel>
        <QTabPanel name="origins">
          <PrefixHegemonyTableStats
            :data="prefixHegemonyDataOrigins"
            :loading="loading"
            :columnName="selection.label"
          />
        </QTabPanel>
        <QTabPanel name="transits">
          <PrefixHegemonyTableStats
            :data="prefixHegemonyDataTransits"
            :loading="loading"
            :columnName="selection.label"
          />
        </QTabPanel>
        <QTabPanel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{ $t('charts.prefixHegemony.table.apiTitle') }}</h3>
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

<style lang="stylus"></style>
