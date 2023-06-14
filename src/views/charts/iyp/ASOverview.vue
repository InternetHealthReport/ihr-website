<template>
  <div>
    <p>AS Name: {{ overview.name }}</p>
    <p>AS Number: {{ asNumber }}</p>
    <p>Country of origin: {{ overview.country }}</p>
    <p>
      Website: <a href="overview.website" target="_blank" rel="noopener noreferrer">{{ overview.website }}</a>
    </p>
    <p>AS Prefix Count: AS{{ asNumber }} has {{ overview.prefixesCount }} prefixes</p>
    <p>AS Peers: AS{{ asNumber }} has {{ overview.peersCount }} peers</p>
    <p>AS Siblings: AS{{ asNumber }} has {{ overview.siblingsCount }} siblings</p>
  </div>
</template>
<script>
import { ASOverviewQuery } from '../../../plugins/query/IypQuery'

export default {
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    asName: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      overview: {},
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      // 'MATCH (a:AS {asn: $asn})-[r:NAME]-(b) RETURN b.name AS name LIMIT 1'
      // MATCH (a:AS {asn: 2497})-[r:COUNTRY]-(b) RETURN a, b LIMIT 1
      // MATCH (a:AS {asn: 2497})-[r:WEBSITE]-(b) RETURN a, b
      // MATCH (a:AS {asn: 2497})-[r:DEPENDS_ON]-(b:Prefix) RETURN a, b LIMIT 10
      let query = new ASOverviewQuery(this.asNumber)
      let asOverview = await this.$iyp_api.getASOverview(query)
      this.overview = asOverview
      // let results = await this.$iyp_api.run(query, { asn: this.asNumber })
      // console.log(results.records[0].get('name'))
      // this.overview = results
      // for (let record of results.records) {
      //   console.log(`Person with name: ${record.get('name')}`)
      //   console.log(`Available properties for this node are: ${record.keys}\n`)
      // }
    },
  },
}
</script>
<style>
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
