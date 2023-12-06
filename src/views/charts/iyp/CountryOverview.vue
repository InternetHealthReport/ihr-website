<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-8">
            <div class="row justify-between">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div class="q-ml-sm">
                  <p>{{ firstPart.as_count }} registered ASes</p>
                  <p>{{ firstPart.preg_count }} registered prefixes</p>
                  <p>{{ firstPart.pgeo_count }} geolocated prefixes</p>
                  <p>{{ firstPart.ixp_count }} Internet Exchange Points</p>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent ISPs</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.secondPart.length > 0" class="column">
                    <router-link :to="{ name: 'iyp_asn', params: { asn: item.asn} }" v-for="item in secondPart" :key="item.asn">
                      AS{{ item.asn }} - {{ item.as_name }}
                    </router-link>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent Hosting Providers</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.thirdPart.length > 0" class="column">
                    <router-link :to="{ name: 'iyp_asn', params: { asn: item.asn} }" v-for="item in thirdPart" :key="item.asn">
                      AS{{ item.asn }} - {{ item.as_name }}
                    </router-link>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div class="column q-ml-sm">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="key" target="_blank" rel="noreferrer">
                    {{ key }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

const references = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}


export default {
  props: {
    countryCode: {
      type: String,
      required: true,
    },
    title: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      firstPart: {},
      secondPart: [],
      thirdPart: [],
      loadingStatus: true,
      references: references
    }
  },
  async mounted() {
    await this.fetchData(this.countryCode)
  },
  methods: {
    async fetchData(cc) {
      const queries = this.getOverview(cc)
      this.loadingStatus = true

      let res = await this.$iyp_api.runManyInOneSessionAndReturnAnObject(queries)
      this.firstPart = res.firstPart[0]
      this.secondPart = res.secondPart
      this.thirdPart = res.thirdPart
      if (this.title !== undefined) {
        this.title(this.firstPart.country_name)
      }

      this.loadingStatus = false
    },
    getOverview(country_code) {
      const queryOne = `MATCH (c:Country {country_code: $cc})
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(a:AS) WITH c, COUNT(DISTINCT a) as as_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "peeringdb.ix"}]-(i:IXP) WITH c, as_count, COUNT(DISTINCT i) as ixp_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(pd:Prefix) WITH c, as_count, ixp_count, COUNT(DISTINCT pd) as preg_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "ihr.rov"}]-(pg:Prefix) WITH c, as_count, ixp_count, preg_count, COUNT(DISTINCT pg) as pgeo_count
         RETURN c.name AS country_name, as_count, ixp_count, preg_count, pgeo_count
        `

      const queryTwo = `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_org:'NRO'}]-(a:AS)-[rr:RANK]-(:Ranking)-[:COUNTRY]-(c)
        WHERE rr.rank < 10
        OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
        RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, SUM(10-rr.rank) AS nb_rankings
        ORDER BY nb_rankings DESC LIMIT 5`

      const queryThree = `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_org:'NRO'}]-(a:AS)-[:CATEGORIZED]-(:Tag {label:'Tranco 10k Host'}),
(a)-[:ORIGINATE]-(:Prefix)-[:PART_OF]-(:IP)-[:RESOLVES_TO]-(d:DomainName)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
        OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
        RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, COUNT(DISTINCT d) AS nb_domains
        ORDER BY nb_domains DESC LIMIT 5`

      const mappingOne = {
        country_name: 'country_name',
        as_count: 'as_count',
        ixp_count: 'ixp_count',
        preg_count: 'preg_count',
        pgeo_count: 'pgeo_count',
      }

      const mappingTwo = {
        asn: 'asn',
        as_name: 'as_name',
        nb_rankings: 'nb_rankings',
      }

      const mappingThree = {
        asn: 'asn',
        as_name: 'as_name',
        nb_domains: 'nb_domains',
      }

      let cc = country_code.toUpperCase()
      return  [
        { cypherQuery: queryOne, params: { cc }, mapping: mappingOne, data: 'firstPart' },
        { cypherQuery: queryTwo, params: { cc }, mapping: mappingTwo, data: 'secondPart' },
        { cypherQuery: queryThree, params: { cc }, mapping: mappingThree, data: 'thirdPart' }
      ]
    },

    handleReference(key) {
      let externalLink = ''
      let cc = this.countryCode

      if (key === 'bgp.he.net') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'radar.cloudflare.com') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'stat.ripe.net') {
        externalLink = `${references[key]}/${cc}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
  },
  watch: {
    async countryCode(newCC, oldCC) {
      this.loadingStatus = true
      await this.fetchData(newCC)
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
