<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
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
                <div class="q-ml-sm">
                  <!-- <p v-if="firstPart.description">Description: <b>{{ firstPart.description }}</b> </p> -->
                  <p v-if="firstPart.country">Registered in <router-link :to="{ name: 'iyp_country', params: {cc:firstPart.cc } }">{{ firstPart.country }}</router-link> ({{ firstPart.rir.toUpperCase() }})</p>
                  <div v-if="firstPart.asn[0][0]">
                    <p>Originated by:</p>
                      <div v-for="item in firstPart.asn" :key='item[0]' target="_blank">
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
                <h3>Top 5 Domains</h3>
                <div  class="q-ml-sm column">
                  <a :href="item.domainName" v-for="item in secondPart" :key='item.domainName' target="_blank" rel="noreferrer">{{
                    item.domainName
                  }}</a>
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
              <div class="q-mt-md">
                <h3>Tags</h3>
                <router-link v-for="tag in firstPart.tags" :key="tag" :to="{ name: 'iyp_tag', params: {tag: tag}}">
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
      firstPart: {asn:[[false]]},
      secondPart: {},
      loadingStatus: false,
      references: references,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      const queries = this.getOverview()

      this.loadingStatus = true
      let res = await this.$iyp_api.runManyInOneSessionAndReturnAnObject(queries)
      this.firstPart = res.firstPart[0]
      this.secondPart = res.secondPart
      this.loadingStatus = false

      if (this.title !== undefined) {
        if (this.firstPart.description){
          this.title('- '+this.firstPart.description)
        }
        else{
          this.title('')
        }
      }
    },
    getOverview() {
      const queryOne = `MATCH (p:Prefix {prefix: $prefix})
         OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
         OPTIONAL MATCH(p)-[deleg:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, collect(DISTINCT([toString(a.asn), COALESCE(pdbn.name, btn.name, ripen.name)])) AS asn, c.name AS country, collect(DISTINCT(t.label)) AS tags, deleg.registry AS rir, c.country_code AS cc
        `
      const mappingOne = {
        prefix: 'prefix',
        description: 'descr',
        asn: 'asn',
        country: 'country',
        cc: 'cc',
        tags: 'tags',
        rir: 'rir',
      }

      const queryTwo = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)
      OPTIONAL MATCH (d)-[ra:RANK]->(:Ranking {name: 'Tranco top 1M'})
      RETURN  DISTINCT d.name as domain, ra.rank AS rank ORDER BY rank LIMIT 5
      `
      const mappingTwo = {
        domainName: 'domain',
        rank: 'rank',
      }

      const prefix = this.getPrefix()

      return [
        { cypherQuery: queryOne, params: { prefix: prefix }, mapping: mappingOne, data: 'firstPart' },
        { cypherQuery: queryTwo, params: { prefix: prefix }, mapping: mappingTwo, data: 'secondPart' },
      ]
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
        this.loadingStatus = true
        await this.fetchData()
      }
    },
    async prefixLength(newValue, oldValue) {
      if(!this.loadingStatus){
        this.loadingStatus = true
        await this.fetchData()
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
