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
                  <p v-if="firstPart.country">Registered in {{ firstPart.country }}</p>
                  <p v-if="firstPart.description">Description: {{ firstPart.description }}</p>
                  <p>Originated by: </p>
                  <div class="column">
                    <p v-for="item in firstPart.asn" target="_blank" rel="noreferrer">
                    AS{{ item[0] }} {{item[1]}}
                    </p>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Top 5 Domains</h3>
                <div  class="q-ml-sm column">
                  <a :href="item.domainName" v-for="item in secondPart" target="_blank" rel="noreferrer">{{
                    item.domainName
                  }}</a>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div  class="q-ml-sm column">
                  <a :href="handleReference(key)" v-for="(value, key) in references" target="_blank" rel="noreferrer">{{
                    key
                  }}</a>
                </div>
              </div>
            </div>
            <div class="row">
              <div class="q-mt-md">
                <h3>Tags</h3>
                <q-chip v-for="tag in firstPart.tags" dense size="md" color="gray" text-color="black"> {{ tag }}</q-chip>
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
  },
  data() {
    return {
      firstPart: {},
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
    },
    getOverview() {
      const queryOne = `MATCH (p:Prefix {prefix: $prefix})<-[o:ORIGINATE]-(a:AS)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(n:Name)
         OPTIONAL MATCH(p)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, collect(DISTINCT([toString(a.asn), n.name])) AS asn, c.name AS country, collect(DISTINCT(t.label)) AS tags
        `
      const mappingOne = {
        prefix: 'prefix',
        description: 'descr',
        asn: 'asn',
        country: 'country',
        tags: 'tags',
      }

      const queryTwo = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(d:DomainName)
      OPTIONAL MATCH (d)-[ra:RANK]->(:Ranking {name: 'Tranco top 1M'})
      RETURN  DISTINCT i.ip AS ip, d.name as domain, ra.rank AS rank ORDER BY rank LIMIT 5
      `
      const mappingTwo = {
        ip: 'ip',
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
      console.log('Routing to IYP')
      this.$router.push({
        name: 'iyp_prefix',
        params: { host: this.host, prefix_length: this.prefixLength },
      })
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
