<template>
  <div>
    <h2 v-if="widgetTitle">{{ widgetTitle }}</h2>
    <div class="row justify-center">
      <div class="col q-px-md q-pb-md">
        <rir-country-sunburst-chart :data="plotData" />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col q-px-md">
        <q-expansion-item label="Show data" class="bg-grey-2">
          <metis-table :data="tableData" :loading="!fetch" />
        </q-expansion-item>
      </div>
    </div>
  </div>
</template>

<script>
import MetisTable from './charts/tables/MetisTable'
import RirCountrySunburstChart from './charts/RirCountrySunburstChart.vue'
import { MetisAtlasDeploymentQuery } from '@/plugins/IhrApi'
import rirMapping from '@/assets/rir-country-map.json'
import getCountryName from '../plugins/countryName'

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
}

function translateCC(cc) {
  for (const [rir, cc_set] of RIR_MAP) {
    if (cc_set.has(cc)) {
      return rir
    }
  }
  return cc
}

export default {
  name: 'MetisWidget',
  components: {
    MetisTable,
    RirCountrySunburstChart,
  },
  props: {
    af: {
      type: String,
      required: true,
    },
    metric: {
      type: String,
      required: true,
    },
    nbprobes: {
      type: String,
      default: '100',
    },
    widgetTitle: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      apiFilter: null,
      tableData: [],
      plotData: [],
      fetch: false,
    }
  },
  mounted() {
    loadRirMap()
    this.apiCall()
  },
  methods: {
    setFilter() {
      if (this.metric && this.nbprobes && this.af) {
        this.apiFilter = new MetisAtlasDeploymentQuery().ranking(this.nbprobes).addressFamily(this.af).metric(this.metric).orderedByTime()
      }
    },
    apiCall() {
      this.fetch = false
      this.setFilter()
      this.$ihr_api.metisAtlasDeployment(
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
      this.apiUrl = this.$ihr_api.getUrl(this.apiFilter)
    },
    readRanking(data) {
      this.tableData = []
      this.plotData = []
      var country_counts = new Map()
      var rir_counts = new Map()

      data.forEach(elem => {
        var row = { ...SELECTION_ROW }
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
        this.tableData.push(row)
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
        this.plotData.push([rir, 'Total', count, ''])
      }
      for (const [cc, count] of country_counts) {
        let rir = translateCC(cc)
        if (rir === cc) {
          rir = 'Other'
        }
        this.plotData.push([cc, rir, count, getCountryName(cc)])
      }
    },
  },
}
</script>
