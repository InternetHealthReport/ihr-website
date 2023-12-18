<template>
  <div class="IYP_chart">
    <div v-if="loading > 0" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-8">
            <div class="row justify-between">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div v-if="queries[0].data.length > 0" class="q-ml-sm">
                  <p>Registered in <router-link :to="{ name: 'iyp_country', params: {cc: queries[0].data[0].get('cc') } }"> {{ queries[0].data[0].get('country') }} </router-link></p>
                  <p>Member of {{ queries[0].data[0].get('nb_ixp') }} IXPs in {{ queries[0].data[0].get('nb_country') }} Countries</p>
                  <p>{{ queries[0].data[0].get('prefixes_v4') }} IPv4 and {{ queries[0].data[0].get('prefixes_v6') }} IPv6 Originated Prefixes</p>
                  <p v-if="this.queries[1].data.length > 0">{{ queries[1].data[0].get('peers') }} Connected ASes</p>
                  <p>
                    Website: <a :href="queries[0].data[0].get('website')" target="_blank" rel="noopener noreferrer">{{ queries[0].data[0].get('website')}}</a>
                  </p>
                </div>
              </div>
              <div v-if="this.queries[1].data.length > 0" class="col-12 col-md-auto">
                <h3>Ranking</h3>
                <div class="q-ml-sm">
                  <div>{{ this.queries[1].data[0].get('ranking_name') }}</div>
                  <div class="text-h2 text-center">{{ this.queries[1].data[0].get('rank') }}</div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>Popular Domains</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.queries[2].data.length > 0" class="column">
                    <router-link :to="{ name: 'iyp_domainname', params: {domain:item.get('domainName')}}" v-for="item in queries[2].data" :key="item.get('domainName')">
                      {{ item.get('domainName') }}
                    </router-link>
                  </div>
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
              <div  v-if="queries[0].data.length > 0" class="q-mt-md">
                <h3>Tags</h3>
                <router-link v-for="tag in queries[0].data[0].get('tags')" :key="tag" :to="{ name: 'iyp_tag', params: {tag: tag}}">
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
      queries: [
        {
          data: [],
          query: `MATCH (a:AS {asn: $asn})
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
         RETURN u.url AS website, c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, collect(DISTINCT(t.label)) as tags, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country `
        },
        {
          data: [],
          query: `MATCH (a:AS {asn: $asn})
         OPTIONAL MATCH (a)-[:PEERS_WITH]-(b:AS)
         OPTIONAL MATCH (a)-[:EXTERNAL_ID]->(p:PeeringdbNetID)
         OPTIONAL MATCH (a)-[r:RANK]->(s:Ranking)
         WHERE r.rank < 10
         RETURN COUNT(DISTINCT b.asn) AS peers, p.id AS peeringdbNetId, r.rank AS rank, s.name AS ranking_name ORDER BY rank LIMIT 1`
        },
        {
          data: [],
          query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
      WHERE rr.reference_name = "tranco.top1M"
      RETURN DISTINCT d.name AS domainName, rr.rank AS rank
      ORDER BY rank LIMIT 5
      `
        }
      ],
      loading: 3,
      references: references,
    }
  },
  async mounted() {
    this.fetchData(this.asNumber)
  },
  methods: {
    fetchData(asn) {

      let params = { asn: asn }
      let res = this.$iyp_api.runManyInParallel(this.queries, params)

      res[0].then( results => {
        this.queries[0].data = results.records
        if (this.title !== undefined) {
          this.title(this.queries[0].data[0].get('name'))
        }
        this.loading -= 1
      })

      res[1].then( results => {
        this.queries[1].data = results.records
        this.pdbid = this.queries[1].data[0].get('peeringdbNetId')
        this.loading -= 1
      })

      res[2].then( results => {
        this.queries[2].data = results.records
        this.loading -= 1
      })
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
        externalLink = `${references[key]}/${this.pdbid}`
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
    asNumber(newAsn, oldAsn) {
      this.loading = 3
      this.queries.forEach( query => {
        query.data = []
      })
      this.fetchData(newAsn)
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
