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
                <h3>AS Info</h3>
                <div>
                  <p>
                    Website: <a :href="firstPart.website" target="_blank" rel="noopener noreferrer">{{ firstPart.website }}</a>
                  </p>
                  <p>Registered in {{ firstPart.country }}</p>
                  <p>{{ firstPart.prefixes }} Originated Prefixes</p>
                  <p>{{ secondPart.peers }} Peer ASes</p>
                </div>
              </div>
              <div v-if="this.secondPart.rank <= 10" class="col-12 col-md-auto">
                <h3>Ranking</h3>
                <div>
                  <div>{{ this.secondPart.rankingName }}</div>
                  <div class="text-h2 text-center">{{ this.secondPart.rank }}</div>
                </div>
                <!-- <GenericIndicatorsChart
                  v-if="Object.keys(secondPart).length > 0"
                  :chart-data="formatRank(this.secondPart.rank, this.secondPart.rankingName)"
                  :chart-layout="{ title: 'Rankings' }"
                /> -->
              </div>
              <div class="col-12 col-md-2">
                <h3>Top 5 Domains</h3>
                <div class="column">
                  <div v-if="this.thirdPart.length > 0" class="column">
                    <a :href="handleDomainName(item.domainName)" v-for="item in thirdPart" target="_blank" rel="noreferrer">{{
                      handleDomainName(item.domainName)
                    }}</a>
                  </div>
                  <p v-else>No results found.</p>
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
              <div>
                <h3>Tags</h3>
                <q-chip v-for="tag in firstPart.tags" dense size="md" color="gray" text-color="black"> {{ tag }}</q-chip>
              </div>
            </div>

            <div class="row">
              <div v-if="external" @click="handleRoutingFromNetworksToIYP" class="q-mt-lg overview-footer">
                View more details on IYP for AS{{ asNumber }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// Depreceated
// import { ASOverviewQuery } from '../../../plugins/query/IypQuery'

import { QChip } from 'quasar'
import GenericIndicatorsChart from '@/views/charts/iyp/GenericIndicatorsChart'

const references = {
  bgp: 'https://bgp.he.net',
  bgpTools: 'https://bgp.tools/as',
  peeringDB: 'https://www.peeringdb.com/net',
  cloudflareRadar: 'https://radar.cloudflare.com',
  ripeStat: 'https://stat.ripe.net/app/launchpad',
}

export default {
  components: {
    QChip,
    GenericIndicatorsChart,
  },
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    asName: {
      type: String,
      required: false,
    },
    title: {
      type: Function,
      required: false,
    },
    peeringdbId: {
      type: Function,
      required: false,
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
      thirdPart: [],
      loadingStatus: true,
      references: references,
    }
  },
  async mounted() {
    await this.fetchData(this.asNumber)
  },
  methods: {
    async fetchData(asn) {
      const queries = this.getOverview(asn)
      this.loadingStatus = true

      let res = await this.$iyp_api.runManyInOneSessionAndReturnAnObject(queries)
      this.firstPart = res.firstPart[0]
      this.secondPart = res.secondPart[0]
      this.thirdPart = res.thirdPart

      if (this.title !== undefined) {
        this.title(this.firstPart.name)
      }

      if (this.peeringdbId !== undefined) {
        this.peeringdbId(this.secondPart.peeringdbId)
      }

      this.loadingStatus = false
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
      const queryOne = `MATCH (a:AS {asn: $asn})
         OPTIONAL MATCH (a)-[:NAME]->(n:Name)
         OPTIONAL MATCH (a)-[:WEBSITE]->(u:URL)
         OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         OPTIONAL MATCH (a)-[:ORIGINATE]->(p:Prefix)
         MATCH (a)-[:CATEGORIZED]->(t:Tag)
         RETURN u.url AS website, c.country_code AS cc, c.name AS country, COUNT(DISTINCT p.prefix) AS prefixes, head(collect(DISTINCT(n.name))) AS name, collect(DISTINCT(t.label)) as tags
        `
      const queryTwo = `MATCH (a:AS {asn: $asn})
         OPTIONAL MATCH (a)-[:PEERS_WITH]-(b:AS)
         OPTIONAL MATCH (a)-[:EXTERNAL_ID]->(p:PeeringdbNetID)
         OPTIONAL MATCH (a)-[r:RANK]->(s:Ranking)
         RETURN COUNT(DISTINCT b.asn) AS peers, p.id AS peeringdbNetId, r.rank AS rank, s.name AS ranking_name ORDER BY rank LIMIT 1`

      const top5DomainNamesQuery = `
      MATCH (:AS {asn: $asn})-[:ORIGINATE]->(:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
      WHERE rr.rank < 100000 and rr.reference_name = "tranco.top1M"
      RETURN DISTINCT d.name AS domainName, rr.rank AS rank
      ORDER BY rank LIMIT 5
      `

      const mappingOne = {
        website: 'website',
        cc: 'cc',
        country: 'country',
        prefixes: 'prefixes',
        name: 'name',
        tags: 'tags',
      }
      const mappingTwo = {
        peers: 'peers',
        peeringdbId: 'peeringdbNetId',
        rank: 'rank',
        rankingName: 'ranking_name',
      }
      const mappingThree = {
        domainName: 'domainName',
        rank: 'rank',
      }
      return [
        { cypherQuery: queryOne, params: { asn }, mapping: mappingOne, data: 'firstPart' },
        { cypherQuery: queryTwo, params: { asn }, mapping: mappingTwo, data: 'secondPart' },
        { cypherQuery: top5DomainNamesQuery, params: { asn }, mapping: mappingThree, data: 'thirdPart' },
      ]
    },
    formatRank(rank, name) {
      let arr = []
      arr.push({
        rank,
        name,
      })
      return arr
    },
    handleDomainName(name) {
      return 'https://' + name
    },
    handleReference(key) {
      let externalLink = ''
      let asn = this.asNumber

      if (key === 'bgp') {
        externalLink = `${references.bgp}/AS${asn}`
      } else if (key === 'bgpTools') {
        externalLink = `${references.bgpTools}/${asn}`
      } else if (key === 'peeringDB') {
        externalLink = `${references.peeringDB}/${this.secondPart.peeringdbId}`
      } else if (key === 'cloudflareRadar') {
        externalLink = `${references.cloudflareRadar}/as${asn}`
      } else if (key === 'ripeStat') {
        externalLink = `${references.ripeStat}/${asn}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
    handleRoutingFromNetworksToIYP(e) {
      console.log('Routing to IYP')
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: this.asNumber },
      })
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
h3 {
  font-size: 1rem;
  line-height: 1.5
}
.overview-footer {
  text-decoration: underline;
  cursor: pointer;
  width: 100%;
  text-align: right;
}
</style>
