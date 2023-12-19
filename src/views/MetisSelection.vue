<script setup>
import { RouterLink } from 'vue-router'
import { QInput, QSelect, QBtn, copyToClipboard } from 'quasar'
import Tr from '@/i18n/translation'
import MetisTable from '@/components/tables/MetisTable.vue'
import { ref, onMounted, inject, nextTick  } from 'vue'
import rirMapping from '@/assets/rir-country-map.json'
import getCountryName from '../plugins/countryName'
import { MetisAtlasSelectionQuery } from '@/plugins/IhrApi'
import RirCountrySunburstChart from '@/components/charts/RirCountrySunburstChart.vue'
const ATLAS_PROBE = {
  type: 'asn',
  value: 0,
  requested: 1,
}
const SELECTION_ROW = {
  rank: 0,
  asn: '0',
  asn_name: '',
  cc: '',
}
const RIR_MAP = new Map()

const loadRirMap = () => {
  for(const [rir, cc_list] of Object.entries(rirMapping)) {
    const cc_set = new Set(cc_list)
    RIR_MAP.set(rir, cc_set)
  }
}

const translateCC = (cc) => {
  for(const [rir, cc_set] of RIR_MAP) {
    if (cc_set.has(cc)) {
      return rir
    }
  }
  return cc
}

const afoptions = ref([
  {
    label: 'IPv4',
    value: 4,
  },
  {
    label: 'IPv6',
    value: 6,
  }
])
const metricoptions = ref([
  {
    label: 'AS-path length',
    value: 'as_path_length',
  },
  {
    label: 'RTT',
    value: 'rtt',
  },
  {
    label: 'IP hops',
    value: 'ip_hops',
  }
])
const metric = ref({
  label: 'AS-path length',
  value: 'as_path_length',
})
const nbprobes = ref(10)
const af = ref({
  label: 'IPv4',
  value: 4
})
const apiFilter = ref(null)
const ranking = ref({})
const tableData = ref([])
const plotData = ref([])
const apiJson = ref({})
const apiUrl = ref('')
const fetch = ref(false)
const loading = ref(false)

const ihr_api = inject('ihr_api')

onMounted(() => {
  loadRirMap()
})

const pushRoute = () => {}

const setFilter = () => {
  if (metric.value && nbprobes.value && af.value) {
    apiFilter.value = new MetisAtlasSelectionQuery()
      .ranking(nbprobes.value)
      .addressFamily(af.value.value)
      .metric(metric.value.value)
      .orderedByTime()
  }
}

const apiCall = () => {
  fetch.value = false
  loading.value = true
  setFilter()
  ihr_api.metisAtlasSelection(
    apiFilter.value,
    result => {
      nextTick(() => {
        readRanking(result.results)
        fetch.value = true
      })
    },
    error => {
      console.error(error) //FIXME do a correct alert
      loading.value = false
    }
  )
  loading.value = false
  apiUrl.value = ihr_api.getUrl(apiFilter.value)
}

const readRanking = (data) => {
  ranking.value = data
  tableData.value = []
  plotData.value = []
  const atlasAsns = []
  const countryCounts = new Map()
  const rirCounts = new Map()

  data.forEach(elem => {
    const asn = { ...ATLAS_PROBE }
    const row = { ...SELECTION_ROW }
    asn.value = elem.asn
    atlasAsns.push(asn)
    row.rank = elem.rank
    row.asn = elem.asn
    // AS Names end with ", XX" where XX is the country code.
    row.asn_name = elem.asn_name.slice(0, -4)
    const countryCode = elem.asn_name.slice(-2)
    let rir = translateCC(countryCode)
    if (rir === countryCode) {
      rir = 'Other'
    }
    row.cc = countryCode
    tableData.value.push(row)
    if (rirCounts.has(rir)) {
      rirCounts.set(rir, rirCounts.get(rir) + 1)
    } else {
      rirCounts.set(rir, 1)
    }
    if (countryCounts.has(countryCode)) {
      countryCounts.set(countryCode, countryCounts.get(countryCode) + 1)
    } else {
      countryCounts.set(countryCode, 1)
    }
  })
  for (const [rir, count] of rirCounts) {
    plotData.value.push([rir, 'Total', count, ''])
  }
  for (const [cc, count] of countryCounts) {
    let rir = translateCC(cc)
    if (rir === cc) {
      rir = 'Other'
    }
    plotData.value.push([cc, rir, count, getCountryName(cc)])
  }

  apiJson.value = JSON.stringify({ probes: atlasAsns }, null, 2)
}

const copyAPI = () => {
  copyToClipboard(apiJson.value)
    .then(() => {})
    .catch(() => {
      console.error('Failed to copy API Json to clipboard.')
    })
}
</script>

<template>
  <div>
    <h1 class="text-center">{{ $t('mentis.mentisSelection.title') }}</h1>
    <div class="row justify-center q-pa-md">
      <div class="IHR_description">
        <p>
          {{ $t('mentis.mentisSelection.description') }}
        </p>
        <p v-html="$t('mentis.mentisSelection.body')">
        </p>
        <p>
          {{ $t('mentis.mentisSelection.historicalData.body') }}
          <RouterLink :to="Tr.i18nRoute({ name: 'api' })">{{ $t('mentis.mentisSelection.historicalData.apiPage') }}</RouterLink>.
        </p>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-3">
        <QInput v-model="nbprobes" label="Number of probes" />
        <QSelect v-model="metric" :options="metricoptions" label="Distance metric" />
        <QSelect v-model="af" :options="afoptions" label="IP version" />
        <QBtn class="q-mt-sm" @click="apiCall" label="Go"></QBtn>
      </div>
    </div>
    <div v-if="fetch">
      <div class="q-pa-md">
        <div class="row justify-evenly">
          <div class="col-6 q-px-md">
            <MetisTable :data="tableData" :loading="loading" />
          </div>
          <div class="col-5 q-px-xl">
            <h2>Country distribution</h2>
            <RirCountrySunburstChart :data="plotData" />
          </div>
        </div>
        <div class="row justify-center">
          <div class="IHR_block q-px-md">
            <h2>Atlas API specification</h2>
            <QBtn class="q-mb-sm" color="secondary" @click="copyAPI" label="Copy"></QBtn>
            <textarea class="apiTextarea" readonly v-model="apiJson"></textarea>
          </div>
        </div>
        <div class="row justify-center">
          <div class="col-10 q-pa-xl">
            <h3>
              Data source: <a :href="apiUrl">{{ apiUrl }}</a>
            </h3>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
.IHR_description
    font-weight 400
    max-width 900px

.IHR_block
  max-width 900px

.apiTextarea
  width 100%
  min-height 500px
</style>
