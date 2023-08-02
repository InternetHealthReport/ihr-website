<template>
  <div>
    <div v-if="loadingStatus" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div>
      <p>AS Name: {{ firstPart.name }}</p>
      <p>AS Number: {{ asNumber }}</p>
      <p>Country of origin: {{ firstPart.country }}</p>
      <p>Country Code: {{ firstPart.cc }}</p>
      <p>
        Website: <a :href="firstPart.website" target="_blank" rel="noopener noreferrer">{{ firstPart.website }}</a>
      </p>
      <p>AS Prefix Count: AS{{ asNumber }} has {{ firstPart.prefixes }} prefixes</p>
      <p>AS Peers: AS{{ asNumber }} has {{ secondPart.peers }} peers</p>
      <p>AS Siblings: AS{{ asNumber }} has {{ secondPart.siblings }} siblings</p>
    </div>
  </div>
</template>

<script>
// Depreceated
// import { ASOverviewQuery } from '../../../plugins/query/IypQuery'

export default {
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    asName: {
      type: String,
    },
    title: {
      type: Function,
      required: true,
    },
    peeringdbId: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      firstPart: {},
      secondPart: {},
      loadingStatus: true,
    }
  },
  async mounted() {
    this.loadingStatus = true
    await this.fetchData(this.asNumber)
    this.loadingStatus = false
  },
  methods: {
    async fetchData(asn) {
      const queries = this.getOverview(asn)
      let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
      console.log(res)

      this.firstPart = res.firstPart[0]
      this.secondPart = res.secondPart[0]
      this.title(this.firstPart.name)
      this.peeringdbId(this.secondPart.peeringdbId)
    },
    getOverview(asn) {
      // Depreceated
      // let query = new ASOverviewQuery(asn)
      // try {
      //   let asOverview = await this.$iyp_api.getASOverview(query)
      //   this.overview = asOverview
      //   this.title(this.overview.name)
      //   this.loadingStatus = false
      // } catch (e) {
      //   console.error(e)
      //   this.loadingStatus = false
      // }
      const queryOne =
        'MATCH (a:AS {asn: $asn})-[:NAME]-(n:Name) MATCH (a)-[:WEBSITE]-(u:URL) MATCH (a)-[:COUNTRY]-(c:Country) MATCH (a)-[:DEPENDS_ON]-(p:Prefix)  RETURN u.url AS website, c.country_code AS cc, c.name AS country, count(p) AS prefixes, n.name AS name LIMIT (1)'
      const queryTwo =
        'MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(b) MATCH(a)-[:SIBLING_OF]-(c) MATCH (a)-[:EXTERNAL_ID]-(p) RETURN count(b) AS peers, count(c) AS siblings, p.id as peeringdbNetId'
      const mappingOne = {
        website: 'website',
        cc: 'cc',
        country: 'country',
        prefixes: 'prefixes',
        name: 'name',
      }
      const mappingTwo = {
        peers: 'peers',
        siblings: 'siblings',
        peeringdbId: 'peeringdbNetId',
      }
      return [
        { cypherQuery: queryOne, params: { asn }, mapping: mappingOne, data: 'firstPart' },
        { cypherQuery: queryTwo, params: { asn }, mapping: mappingTwo, data: 'secondPart' },
      ]
    },
  },
  watch: {
    async asNumber(newAsn, oldAsn) {
      this.loadingStatus = true
      await this.fetchData(newAsn)
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
