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
            <div class="row q-gutter-md">
              <div class="col-12 col-md-auto">
                <h3>Prefix Info</h3>
                <div>
                  <p>Prefix: {{ firstPart.prefix }}</p>
                  <p v-if="firstPart.description">Desc: {{ firstPart.description }}</p>
                  <p>Originating ASN: {{ firstPart.asn }}</p>
                  <p>Originating AS Name: {{ firstPart.name }}</p>
                  <p v-if="firstPart.cc">Country of origin: {{ firstPart.cc }}</p>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Top 5 Domains</h3>
                <div class="column">
                  <a :href="handleDomainName(item.domainName)" v-for="item in secondPart" target="_blank" rel="noreferrer">{{
                    handleDomainName(item.domainName)
                  }}</a>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>Reference</h3>
                <div class="column">
                  <a :href="handleReference(key)" v-for="(value, key) in references" target="_blank" rel="noreferrer">{{
                    handleReference(key)
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
  bgp: 'https://bgp.he.net/net',
  bgpTools: 'https://bgp.tools/prefix',
  ripeStat: 'https://stat.ripe.net/app/launchpad',
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
         OPTIONAL MATCH (a)-[:NAME]->(n:Name)
         OPTIONAL MATCH(p)-[:COUNTRY]->(c:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, head(collect(DISTINCT(a.asn))) AS asn, head(collect(DISTINCT(n.name))) AS name, head(collect(DISTINCT(c.country_code))) AS cc, collect(DISTINCT(t.label)) AS tags
        `
      const mappingOne = {
        prefix: 'prefix',
        description: 'descr',
        asn: 'asn',
        name: 'name',
        cc: 'cc',
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
    handleDomainName(name) {
      return 'https://' + name
    },
    handleReference(key) {
      let externalLink = ''
      if (key === 'bgp') {
        externalLink = `${references.bgp}/${this.host}/${this.prefixLength}`
      } else if (key === 'bgpTools') {
        externalLink = `${references.bgpTools}/${this.host}/${this.prefixLength}`
      } else if (key === 'ripeStat') {
        externalLink = `${references.ripeStat}/${this.host}/${this.prefixLength}`
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
