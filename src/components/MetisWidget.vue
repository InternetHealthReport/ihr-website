<script setup>
import RirCountrySunburstChart from './charts/RirCountrySunburstChart.vue'
import MetisTable from './tables/MetisTable.vue'
import { QExpansionItem } from 'quasar'
import { MetisAtlasDeploymentQuery } from '@/plugins/IhrApi'
import getCountryName from '@/plugins/countryName'
import { ref, onMounted, nextTick, inject } from 'vue'
import axios from 'axios'

let rirMapping = {}

const SELECTION_ROW = {
  rank: 0,
  asn: '0',
  asn_name: '',
  cc: ''
}

const RIR_MAP = new Map()

const loadRirMap = () => {
  for (const [rir, cc_list] of Object.entries(rirMapping)) {
    const cc_set = new Set(cc_list)
    RIR_MAP.set(rir, cc_set)
  }
}

const translateCC = (cc) => {
  for (const [rir, cc_set] of RIR_MAP) {
    if (cc_set.has(cc)) {
      return rir
    }
  }
  return cc
}

const props = defineProps({
  af: {
    type: String,
    required: true
  },
  metric: {
    type: String,
    required: true
  },
  nbprobes: {
    type: String,
    default: '100'
  },
  widgetTitle: {
    type: String,
    default: null
  }
})

const apiFilter = ref(null)
const tableData = ref([])
const plotData = ref([])
const fetch = ref(false)
const apiUrl = ref('')
const loading = ref(false)

const ihr_api = inject('ihr_api')

const setFilter = () => {
  if (props.metric && props.nbprobes && props.af) {
    apiFilter.value = new MetisAtlasDeploymentQuery()
      .ranking(props.nbprobes)
      .addressFamily(props.af)
      .metric(props.metric)
      .orderedByTime()
  }
}

const apiCall = () => {
  fetch.value = false
  loading.value = true
  setFilter()
  ihr_api.metisAtlasDeployment(
    apiFilter.value,
    (result) => {
      nextTick(() => {
        readRanking(result.results)
        fetch.value = true
      })
    },
    (error) => {
      console.error(error) //FIXME do a correct alert
      loading.value = false
    }
  )
  loading.value = false
  apiUrl.value = ihr_api.getUrl(apiFilter.value)
}

const readRanking = (data) => {
  tableData.value = []
  plotData.value = []
  const country_counts = new Map()
  const rir_counts = new Map()

  data.forEach((elem) => {
    const row = { ...SELECTION_ROW }
    row.rank = elem.rank
    row.asn = elem.asn
    // AS Names end with ", XX" where XX is the country code.
    row.asn_name = elem.asn_name.slice(0, -4)
    const cc = elem.asn_name.slice(-2)
    let rir = translateCC(cc)
    if (rir === cc) {
      rir = 'Other'
    }
    row.cc = cc
    tableData.value.push(row)
    if (rir_counts.has(rir)) {
      rir_counts.set(rir, rir_counts.get(rir) + 1)
    } else {
      rir_counts.set(rir, 1)
    }
    if (country_counts.has(cc)) {
      country_counts.set(cc, country_counts.get(cc) + 1)
    } else {
      country_counts.set(cc, 1)
    }
  })
  for (const [rir, count] of rir_counts) {
    plotData.value.push([rir, 'Total', count, ''])
  }
  for (const [cc, count] of country_counts) {
    let rir = translateCC(cc)
    if (rir === cc) {
      rir = 'Other'
    }
    plotData.value.push([cc, rir, count, getCountryName(cc)])
  }
}

onMounted(async () => {
  rirMapping = (await axios.get('/data/rir-country-map.json')).data
  loadRirMap()
  apiCall()
})
</script>

<template>
  <div v-if="fetch">
    <h2 v-if="widgetTitle">
      {{ widgetTitle }}
    </h2>
    <div class="row justify-evenly">
      <div class="col-12 col-md-6 q-px-md">
          <MetisTable :data="tableData" :loading="!fetch" />
      </div>
      <div class="col-12 col-md-6 q-px-md q-pb-md">
        <RirCountrySunburstChart :data="plotData" />
      </div>
      
    </div>
    
  </div>
  <div v-else class="spinner-container">
    <q-spinner color="secondary" size="50px" />
  </div>
</template>

<style scoped>
.spinner-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}
</style>
