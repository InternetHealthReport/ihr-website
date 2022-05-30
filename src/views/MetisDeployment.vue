<template>
  <div id="IHR_as-and-ixp-container">
    <div>
      <h1 class="text-center">Metis: Atlas probe deployment recommendations</h1>

      <div class="row justify-center">
        <div class="col-4 IHR_description q-pa-lg">
          <p>
            Select a distance metric, and IP version to generate a list of potential ASes for probe deployment. The implemented
            recommendation algorithm is detailed in: https://url-to-the-paper
          </p>
        </div>
      </div>
      <div class="row justify-center">
        <div class="col-3">
          <q-select v-model="metric" :options="metricoptions" label="Distance metric" />
          <q-select v-model="af" :options="afoptions" label="IP version" />
          <q-btn @click="apiCall" label="Go"></q-btn>
        </div>
      </div>
      <div v-if="fetch">
        <div class="row justify-center">
          <div class="col-7 q-pa-xl">
            <h2 class="text-center">Selected ASes</h2>
            <div v-for="rank in ranking" :key="`${rank.asn}`">
              <ul>
                <li>AS{{ rank.asn }} - {{ rank.asn_name }}</li>
              </ul>
            </div>
          </div>
          <div class="col-3 q-pa-xl">
            <h2 class="text-center">Atlas API specification</h2>
            <textarea class="boxsizingBorder" readonly v-model="apiJson"></textarea>
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
import reportMixin from '@/views/mixin/reportMixin'
import { MetisAtlasDeploymentQuery } from '@/plugins/IhrApi'

const ATLAS_PROBE = {
  tags: {
    include: [],
    exclude: [],
  },
  type: 'asn',
  value: 0,
  requested: 1,
}

export default {
  name: 'MetisDeployment',
  mixins: [reportMixin],
  data() {
    return {
      afoptions: [4, 6],
      metricoptions: ['as_path_length', 'rtt', 'ip_hops'],
      metric: 'as_path_length',
      nbprobes: 10,
      af: 4,
      apiFilter: null,
      ranking: {},
      apiJson: {},
      apiUrl: '',
      fetch: false,
    }
  },
  methods: {
    pushRoute() {},
    setFilter() {
      if (this.metric && this.nbprobes && this.af) {
        this.apiFilter = new MetisAtlasDeploymentQuery()
          .ranking(this.nbprobes)
          .addressFamily(this.af)
          .metric(this.metric)
          .orderedByTime()
          .orderedByRank()
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
      this.ranking = data
      var atlas_asns = []

      data.forEach(elem => {
        var asn = { ...ATLAS_PROBE }
        asn.value = elem.asn
        atlas_asns.push(asn)
      })

      this.apiJson = JSON.stringify({ probes: atlas_asns }, null, 2)
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    font-weight 400

.IHR_anchor
    display block
    position relative
    top -250px
    visibility hidden

.boxsizingBorder {
    width 100%
    height 100%
    margin 5px 0
    padding 3px
}
</style>
