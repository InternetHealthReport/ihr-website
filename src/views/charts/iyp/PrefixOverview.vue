<template>
  <div class="IYP_chart">
    <div v-if="loading > 3" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <!-- <h2 class="q-mb-sm">Overview</h2> -->
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-8">
            <div class="row justify-evenly">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div v-if="queries[0].data.length > 0" class="q-ml-sm">
                  <p v-if="queries[0].data[0].get('country')">Registered in <router-link :to="{ name: 'iyp_country', params: {cc:queries[0].data[0].get('cc') } }">{{ queries[0].data[0].get('country') }}</router-link> ({{ queries[0].data[0].get('rir').toUpperCase() }})</p>
                  <div v-if="queries[0].data[0].get('asn')[0][0]">
                    <p>Originated by:</p>
                      <div v-for="item in queries[0].data[0].get('asn')" :key='item[0]' target="_blank">
                        <router-link :to="{ name:'iyp_asn', params:{ asn:item[0] } }">
                        AS{{ item[0] }} {{ item[1] }}
                        </router-link>
                      </div>
                  </div>
                  <div v-else>
                    <p>Prefix Not Announced on BGP</p>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Popular Domains</h3>
                <div  v-if="queries[1].data.length > 0" class="q-ml-sm column">
                  <router-link :to="{ name: 'iyp_domainname', params: {domain:item.get('domain')}}" v-for="item in queries[1].data" :key="item.get('domain')">
                    {{ item.get('domain') }}
                  </router-link>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div  class="q-ml-sm column">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="value" target="_blank" rel="noreferrer">{{
                    key
                  }}</a>
                </div>
              </div>
            </div>
            <div class="row">
              <div v-if="queries[0].data.length > 0" class="q-mt-md">
                <h3>Tags</h3>
                <router-link v-for="tag in queries[0].data[0].get('tags')" :key="tag" :to="{ name: 'iyp_tag', params: {tag: tag}}">
                  <q-chip dense size="md" color="info" text-color="white">{{ tag }}</q-chip>
                </router-link>
              </div>
            </div>

            <div class="row">
              <div v-if="external" @click="handleRoutingFromNetworksToIYP" class="q-mt-lg overview-footer">
                View more details on IYP for Prefix {{ getPrefix() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { QChip } from 'quasar'

const references = {
  'bgp.he.net': 'https://bgp.he.net/net',
  'bgp.tools': 'https://bgp.tools/prefix',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}

export default {
  components: {
    QChip,
  },
  props: {
    host: {
      type: String,
      required: true,
    },
    prefixLength: {
      type: String,
      required: true,
    },
    external: {
      type: Boolean,
      required: false,
      default: false,
    },
    title: {
      type: Function,
      required: false,
    },
  },
  data() {
    return {
      loading: 2,
      references: references,
      queries: [
        {
          data: [],
          query: `MATCH (p:Prefix {prefix: $prefix})
            OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            OPTIONAL MATCH(p)-[deleg:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
            OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
            RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, collect(DISTINCT([toString(a.asn), COALESCE(pdbn.name, btn.name, ripen.name)])) AS asn, c.name AS country, collect(DISTINCT(t.label)) AS tags, deleg.registry AS rir, c.country_code AS cc`
        },
        {
          data: [],
          query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)
            OPTIONAL MATCH (d)-[ra:RANK]->(:Ranking {name: 'Tranco top 1M'})
            RETURN  DISTINCT d.name as domain, ra.rank AS rank ORDER BY rank LIMIT 5 `
        }
      ],
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    fetchData() {

      let params = { prefix: this.getPrefix() }
      let res = this.$iyp_api.runManyInParallel(this.queries, params)

      res[0].then( results => {
        this.queries[0].data = results.records
        if (this.title !== undefined) {
          this.title('- '+this.queries[0].data[0].get('descr'))
        }
        this.loading -= 1
      })

      res[1].then( results => {
        this.queries[1].data = results.records
        this.loading -= 1
      })
    },
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
    },
    handleReference(key) {
      let externalLink = ''
      if (key === 'bgp.he.net') {
        externalLink = `${references[key]}/${this.host}/${this.prefixLength}`
      } else if (key === 'bgp.tools') {
        externalLink = `${references[key]}/${this.host}/${this.prefixLength}`
      } else if (key === 'stat.ripe.net') {
        externalLink = `${references[key]}/${this.host}/${this.prefixLength}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
    handleRoutingFromNetworksToIYP() {
      this.$router.push({
        name: 'iyp_prefix',
        params: { host: this.host, prefix_length: this.prefixLength },
      })
    },
  },
  watch: {
    async host(newValue, oldValue) {
      if(!this.loadingStatus){
        this.loading = 3
        this.queries.forEach( query => {
          query.data = []
        })
        this.fetchData()
      }
    },
    async prefixLength(newValue, oldValue) {
      if(!this.loadingStatus){
        this.loading = 3
        this.queries.forEach( query => {
          query.data = []
        })
        this.fetchData()
      }
    }
  }
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
