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
            <div class="row justify-between">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div class="q-ml-sm">
                  <p>Registered in <router-link :to="{ name: 'iyp_country', params: {cc: firstPart.cc } }"> {{ firstPart.country }} </router-link></p>
                  <p>Member of {{ firstPart.nb_ixp }} IXPs in {{ firstPart.nb_country}} Countries</p>
                  <p>{{ firstPart.prefixes_v4 }} IPv4 and {{ firstPart.prefixes_v6 }} IPv6 Originated Prefixes</p>
                  <p>{{ secondPart.peers }} Connected ASes</p>
                  <p>
                    Website: <a :href="firstPart.website" target="_blank" rel="noopener noreferrer">{{ firstPart.website }}</a>
                  </p>
                </div>
              </div>
              <div v-if="this.secondPart.rank <= 10" class="col-12 col-md-auto">
                <h3>Ranking</h3>
                <div class="q-ml-sm">
                  <div>{{ this.secondPart.rankingName }}</div>
                  <div class="text-h2 text-center">{{ this.secondPart.rank }}</div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>Top 5 Domains</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.thirdPart.length > 0" class="column">
                    <a :href="item.domainName" v-for="item in thirdPart" :key="item.domainName" target="_blank" rel="noreferrer">{{
                      item.domainName
                    }}</a>
                  </div>
                  <p v-else>No results found.</p>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div class="column q-ml-sm">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="key" target="_blank" rel="noreferrer">{{
                    key
                  }}</a>
                </div>
              </div>
            </div>

            <div class="row">
              <div>
                <h3>Tags</h3>
                <router-link v-for="tag in firstPart.tags" :key="tag" :to="{ name: 'iyp_tag', params: {tag: tag}}">
                  <q-chip dense size="md" color="info" text-color="white">{{ tag }}</q-chip>
                </router-link>
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

import { QChip } from 'quasar'

const references = {
  'bgp.he.net': 'https://bgp.he.net',
  'bgp.tools': 'https://bgp.tools/as',
  'peeringdb.com': 'https://www.peeringdb.com/net',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}

export default {
  components: {
    QChip,
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
      const queryOne = `MATCH (a:AS {asn: $asn})
         OPTIONAL MATCH (a)-[:ORIGINATE]->(p4:Prefix {af:4})
         WITH COALESCE(COUNT(DISTINCT p4.prefix), 0) AS prefixes_v4, a
         OPTIONAL MATCH (a)-[:ORIGINATE]->(p6:Prefix {af:6})
         WITH COALESCE(COUNT(DISTINCT p6.prefix), 0) AS prefixes_v6, prefixes_v4, a
         OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
         OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
         OPTIONAL MATCH (a)-[:NAME]->(n:Name)
         OPTIONAL MATCH (a)-[:WEBSITE]->(u:URL)
         OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:COUNTRY]-(ixp_country:Country)
         OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         OPTIONAL MATCH (a)-[:CATEGORIZED]->(t:Tag)
         RETURN u.url AS website, c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, collect(DISTINCT(t.label)) as tags, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country
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
        nb_country: 'nb_country',
        nb_ixp: 'nb_ixp',
        prefixes_v4: 'prefixes_v4',
        prefixes_v6: 'prefixes_v6',
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
    handleReference(key) {
      let externalLink = ''
      let asn = this.asNumber

      if (key === 'bgp.he.net') {
        externalLink = `${references[key]}/AS${asn}`
      } else if (key === 'bgp.tools') {
        externalLink = `${references[key]}/${asn}`
      } else if (key === 'peeringdb.com') {
        externalLink = `${references[key]}/${this.secondPart.peeringdbId}`
      } else if (key === 'radar.cloudflare.com') {
        externalLink = `${references[key]}/as${asn}`
      } else if (key === 'stat.ripe.net') {
        externalLink = `${references[key]}/${asn}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
    handleRoutingFromNetworksToIYP(e) {
      console.log('Routing to IYP', e)
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
