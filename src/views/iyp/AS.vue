<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ pageTitle }}</h1>
    <div>
      <q-list>
        <q-expansion-item
          :label="$t('iyp.overview.as.title')"
          caption="Overview of AS"
          header-class="IHR_charts-title"
          v-model="show.overview"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <Overview :as-number="this.asn" :title="setPageTitle" />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.peers.title')" caption="AS Peers" header-class="IHR_charts-title">
          <q-separator />
          <q-card v-if="tableVisible" class="q-ma-xl">
            <GenericTable :data="peers" :columns="peerColumns" :cypher-query="cypherQueries.peers" />
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.ipPrefix.title')" caption="IP Prefix" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable :data="ipPrefixes" :columns="ipPrefixColumns" :cypher-query="cypherQueries.ipPrefixes" />
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.ixp.title')" caption="Internet Exchange Points" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable :data="ixps" :columns="ixpsColumns" :cypher-query="cypherQueries.ixps" />
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.rankings.title')" caption="Rankings" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable :data="rankings" :columns="rankingsColumns" :cypher-query="cypherQueries.rankings" />
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.popularDomains.title')" caption="Popular Domain Names" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable :data="popularDomains" :columns="popularDomainsColumns" :cypher-query="cypherQueries.popularDomains" />
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.as.tags.title')" caption="Tags" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <q-list>
                <q-item v-for="(tag, idx) in tags" :key="idx">
                  <q-item-section>{{ tag.tag }}</q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/ASOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
export default {
  components: {
    Overview,
    GenericTable,
  },
  data() {
    return {
      asn: null,
      pageTitle: 'ASN - AS Name',
      activeTab: 'data',
      tableVisible: true,
      statsDisable: false,
      peerColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.peer, format: val => `AS${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      ipPrefixColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}` },
        { name: 'AF', label: 'IP version', align: 'left', field: row => row.af, format: val => `${val}` },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}` },
      ],
      ixpsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      rankingsColumns: [
        { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      popularDomainsColumns: [
        { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}` },
        { name: 'Domain Name', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}` },
        { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.rankingName, format: val => `${val}` },
      ],
      ipPrefixes: [],
      peers: [],
      ixps: [],
      tags: [],
      rankings: [],
      popularDomains: [],
      cypherQueries: {},
      show: {
        overview: true,
      },
    }
  },
  created() {
    this.asn = parseInt(this.$route.params.asn)
  },
  async mounted() {
    const queries = [this.getPeers(), this.getIpPrefix(), this.getIxps(), this.getTags(), this.getRankings(), this.getPopularDomains()]
    let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
    console.log(res)

    this.peers = res.peers
    this.ipPrefixes = res.ipPrefixes
    this.ixps = res.ixps
    this.tags = res.tags
    this.rankings = res.rankings
    this.popularDomains = res.popularDomains

    let queriesObj = {}
    queries.forEach(query => {
      queriesObj[query.data] = query.cypherQuery
    })
    this.cypherQueries = queriesObj

    // await this.getPeers()
    // await this.getIpPrefix()
    // await this.getIxps()
    // await this.getTags()
    // await this.getRankings()
    // await this.getPopularDomains()
  },
  methods: {
    // async getPeers() {
    //   const query =
    //     'MATCH (a:AS {asn: $asn})-[:PEERS_WITH]->(peer:AS)-[:NAME]->(n:Name) MATCH (peer)-[:COUNTRY]->(c) WITH c.country_code AS cc, peer.asn AS peer, collect(DISTINCT(n.name)) AS name RETURN cc, peer, name LIMIT 10'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     cc: 'cc',
    //     peer: 'peer',
    //     name: 'name',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   // let formattedResults = []
    //   // for (let record of results.records) {
    //   //   formattedResults.push({ cc: record.get('cc'), peer: record.get('peer'), name: record.get('name')[0] })
    //   // }
    //   this.peers = formattedRes
    // },
    // async getIpPrefix() {
    //   const query =
    //     'MATCH (a:AS {asn: $asn})-[r:DEPENDS_ON]-(p:Prefix)-[:COUNTRY]-(c:Country) MATCH (p)-[:CATEGORIZED]-(t:Tag) WITH c, p, collect(DISTINCT(t.label)) AS tags RETURN c.country_code AS cc, p.prefix as prefix, p.af as af, tags LIMIT 100'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     cc: 'cc',
    //     af: ['af', 'low'],
    //     prefix: 'prefix',
    //     tags: 'tags',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.ipPrefixes = formattedRes
    // },
    // async getIxps() {
    //   const query =
    //     'MATCH (a:AS {asn: $asn})-[:MEMBER_OF]-(i:IXP)-[:COUNTRY]-(c:Country) RETURN c.country_code as cc, i.name as ixp LIMIT 10'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     cc: 'cc',
    //     name: 'ixp',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.ixps = formattedRes
    // },
    // async getRankings() {
    //   const query = 'MATCH (a:AS {asn: $asn})-[r:RANK]-(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     rank: 'rank',
    //     name: 'name',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.rankings = formattedRes
    // },
    // async getPopularDomains() {
    //   const query =
    //     'MATCH (:AS {asn: $asn})-[:ORIGINATE]-(:Prefix)-[:PART_OF]-(:IP)-[:RESOLVES_TO]-(d:DomainName)-[r:RANK]-(ranking:Ranking) WHERE r.rank < 100000 RETURN d.name AS domainName, r.rank AS rank, ranking.name AS rankingName ORDER BY rank'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     domainName: 'domainName',
    //     rank: 'rank',
    //     rankingName: 'rankingName',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.popularDomains = formattedRes
    // },
    // async getTags() {
    //   const query = 'MATCH (a:AS {asn: $asn})-[c:CATEGORIZED]-(t:Tag) return t.label as tag'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     tag: 'tag',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.tags = formattedRes
    // },

    // Structure of the function to fetch the data previously,
    // async getTagsPrevious() {
    //   const query = 'MATCH (a:AS {asn: $asn})-[c:CATEGORIZED]-(t:Tag) return t.label as tag'
    //   const results = await this.$iyp_api.run(query, { asn: this.asn })
    //   const mapping = {
    //     tag: 'tag',
    //   }
    //   const formattedRes = this.$iyp_api.formatResponse(results, mapping)
    //   this.tags = formattedRes
    // },

    // Structure of the function to fetch the data at present,
    // getTagsPresent() {
    //   const query = 'MATCH (a:AS {asn: $asn})-[c:CATEGORIZED]-(t:Tag) return t.label as tag'
    //   const mapping = {
    //     tag: 'tag',
    //   }
    //   return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'tags' }
    // },

    getPeers() {
      const query =
        'MATCH (a:AS {asn: $asn})-[:PEERS_WITH]->(peer:AS)-[:NAME]->(n:Name) MATCH (peer)-[:COUNTRY]->(c) WITH c.country_code AS cc, peer.asn AS peer, head(collect(DISTINCT(n.name))) AS name RETURN cc, peer, name LIMIT 100'
      const mapping = {
        cc: 'cc',
        peer: 'peer',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'peers' }
    },
    getIpPrefix() {
      const query =
        'MATCH (a:AS {asn: $asn})-[r:DEPENDS_ON]-(p:Prefix)-[:COUNTRY]-(c:Country) MATCH (p)-[:CATEGORIZED]-(t:Tag) WITH c, p, collect(DISTINCT(t.label)) AS tags RETURN c.country_code AS cc, p.prefix as prefix, p.af as af, tags LIMIT 100'
      const mapping = {
        cc: 'cc',
        af: ['af', 'low'],
        prefix: 'prefix',
        tags: 'tags',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'ipPrefixes' }
    },
    getIxps() {
      const query =
        'MATCH (a:AS {asn: $asn})-[:MEMBER_OF]-(i:IXP)-[:COUNTRY]-(c:Country) RETURN c.country_code as cc, i.name as ixp LIMIT 100'
      const mapping = {
        cc: 'cc',
        name: 'ixp',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'ixps' }
    },
    getRankings() {
      const query = 'MATCH (a:AS {asn: $asn})-[r:RANK]-(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank'
      const mapping = {
        rank: 'rank',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'rankings' }
    },
    getPopularDomains() {
      const query =
        'MATCH (:AS {asn: $asn})-[:ORIGINATE]-(:Prefix)-[:PART_OF]-(:IP)-[:RESOLVES_TO]-(d:DomainName)-[r:RANK]-(ranking:Ranking) WHERE r.rank < 100000 RETURN d.name AS domainName, r.rank AS rank, ranking.name AS rankingName ORDER BY rank'
      const mapping = {
        domainName: 'domainName',
        rank: 'rank',
        rankingName: 'rankingName',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'popularDomains' }
    },
    getTags() {
      const query = 'MATCH (a:AS {asn: $asn})-[c:CATEGORIZED]-(t:Tag) return t.label as tag'
      const mapping = {
        tag: 'tag',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'tags' }
    },
    setPageTitle(title) {
      this.pageTitle = `AS${this.asn} - ${title}`
    },
  },
  watch: {
    '$route.params.asn': {
      handler: function (asn) {
        if (parseInt(asn) != this.asn) {
          this.loadingStatus = true
          this.asn = parseInt(asn)
        }
      },
      deep: true,
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
