<template>
  <div>
    <h1 class="text-center">Metis: Atlas probe selection</h1>
    <div class="row justify-center q-pa-md">
      <div class="IHR_description">
        <p>
          On this page, we provide a simple interface to select a probe set based on the latest topology measurement results. The data is
          updated every Sunday/Monday night at midnight UTC (e.g., 2022-05-30T00:00) and is based on the last four weeks of measurement
          data.
        </p>
        <p>
          We actually provide a list of autonomous systems (ASes) instead of probes. This is because the connected probes are constantly
          changing. In order to avoid querying the Atlas API each time in parallel, we provide the API specification that can be directly
          used with the
          <a href="https://atlas.ripe.net/measurements/form/" target="_blank"
            >template that Atlas provides when creating a new measurement</a
          >. The specification is a bit bulky, but Atlas currently does not provide a way to enter a <i>list</i> of ASes.
        </p>
        <p>
          Select a number of Atlas probes, a distance metric, and IP version to generate a list of diverse probe ASes. In addition to the
          API specification, the results can also be downloaded as a CSV file. The corresponding query to the IHR API is also listed at the
          bottom of the page.
        </p>
        <p>
          If you are looking for historical data or want to automate the process, check out the
          <router-link to="/en-us/api/">Metis section of the IHR API</router-link>.
        </p>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-3">
        <q-input v-model="nbprobes" label="Number of probes" />
        <q-select v-model="metric" :options="metricoptions" label="Distance metric" />
        <q-select v-model="af" :options="afoptions" label="IP version" />
        <q-btn class="q-mt-sm" @click="apiCall" label="Go"></q-btn>
      </div>
    </div>
    <div v-if="fetch">
      <div class="q-pa-md">
        <div class="row justify-evenly">
          <div class="col-6 q-px-md">
            <metis-table :data="tableData" :loading="loading" />
          </div>
          <div class="col-5 q-px-xl">
            <h2>Country distribution</h2>
            <rir-country-sunburst-chart :data="plotData" />
          </div>
        </div>
        <div class="row justify-center">
          <div class="IHR_block q-px-md">
            <h2>Atlas API specification</h2>
            <q-btn class="q-mb-sm" color="secondary" @click="copyAPI" label="Copy"></q-btn>
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

<script>
import MetisTable from './charts/tables/MetisTable'
import RirCountrySunburstChart from './charts/RirCountrySunburstChart'
import { MetisAtlasSelectionQuery } from '@/plugins/IhrApi'
import rirMapping from '@/assets/rir-country-map.json'
import getCountryName from '../plugins/countryName'
import { copyToClipboard } from 'quasar'

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

function loadRirMap() {
  for (const [rir, cc_list] of Object.entries(rirMapping)) {
    const cc_set = new Set(cc_list)
    RIR_MAP.set(rir, cc_set)
  }
  console.log(RIR_MAP)
}

function translateCC(cc) {
  console.log(cc)
  for (const [rir, cc_set] of RIR_MAP) {
    console.log(cc_set)
    if (cc_set.has(cc)) {
      console.log(rir)
      return rir
    }
  }
  return cc
}

export default {
  name: 'MetisSelection',
  components: {
    MetisTable,
    RirCountrySunburstChart,
  },
  data() {
    return {
      afoptions: [
        {
          label: 'IPv4',
          value: 4,
        },
        {
          label: 'IPv6',
          value: 6,
        },
      ],
      metricoptions: [
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
        },
      ],
      metric: {
        label: 'AS-path length',
        value: 'as_path_length',
      },
      nbprobes: 10,
      af: {
        label: 'IPv4',
        value: 4,
      },
      apiFilter: null,
      ranking: {},
      tableData: [],
      plotData: [],
      apiJson: {},
      apiUrl: '',
      fetch: false,
      loading: false,
    }
  },
  mounted() {
    loadRirMap()
  },
  methods: {
    pushRoute() {},
    setFilter() {
      if (this.metric && this.nbprobes && this.af) {
        this.apiFilter = new MetisAtlasSelectionQuery()
          .ranking(this.nbprobes)
          .addressFamily(this.af.value)
          .metric(this.metric.value)
          .orderedByTime()
      }
    },
    apiCall() {
      this.fetch = false
      this.loading = true
      this.setFilter()
      this.$ihr_api.metisAtlasSelection(
        this.apiFilter,
        result => {
          this.$nextTick(function () {
            this.readRanking(result.results)
          })
        },
        error => {
          console.error(error) //FIXME do a correct alert
          this.loading = false
        }
      )
      this.fetch = true
      this.loading = false
      this.apiUrl = this.$ihr_api.getUrl(this.apiFilter)
    },
    readRanking(data) {
      this.ranking = data
      this.tableData = []
      this.plotData = []
      var atlasAsns = []
      var countryCounts = new Map()
      var rirCounts = new Map()

      data.forEach(elem => {
        var asn = { ...ATLAS_PROBE }
        var row = { ...SELECTION_ROW }
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
        this.tableData.push(row)
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
        this.plotData.push([rir, 'Total', count, ''])
      }
      for (const [cc, count] of countryCounts) {
        let rir = translateCC(cc)
        if (rir === cc) {
          rir = 'Other'
        }
        this.plotData.push([cc, rir, count, getCountryName(cc)])
      }

      this.apiJson = JSON.stringify({ probes: atlasAsns }, null, 2)
    },
    copyAPI() {
      copyToClipboard(this.apiJson)
        .then(() => {
          //success
        })
        .catch(() => {
          console.error('Failed to copy API Json to clipboard.')
        })
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    font-weight 400
    max-width 900px

.IHR_block
  max-width 900px

.apiTextarea
  width 100%
  min-height 500px
</style>
