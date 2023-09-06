<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :as-number="this.asn" :title="setPageTitle" :peeringdbId="setPeeringdbId" />

        <div>
          <p @click="handleExpansion('prefix')">Prefix</p>
          <p @click="handleExpansion('dependents')">Dependents</p>
        </div>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.peers.title')"
          caption="AS Peers"
          header-class="IHR_charts-title"
          v-model="show.peers"
        >
          <q-separator />
          <q-card v-if="peers" class="IHR_charts-body">
            <GenericTable
              :data="peers"
              :columns="peerColumns"
              :loading-status="this.loadingStatus.peers"
              :cypher-query="cypherQueries.peers"
              :slot-length="1"
            >
              <GenericPieChart v-if="peers.length > 0" :chart-data="peers" :chart-layout="{ title: 'Country' }" />
              <!-- <GenericTreemapChart
                v-if="peers.length > 0"
                :chart-data="peers"
                :chart-layout="{ title: 'Peer ASes' }"
                :config="{ key: 'cc', root: this.asn, values: false }"
              /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.ipPrefix.title')"
          caption="IP Prefix"
          header-class="IHR_charts-title"
          v-model="show.ipPrefixes"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="ipPrefixes"
              :columns="ipPrefixColumns"
              :loading-status="this.loadingStatus.ipPrefixes"
              :cypher-query="cypherQueries.ipPrefixes"
              :slot-length="2"
            >
              <GenericPieChart v-if="ipPrefixes.length > 0" :chart-data="ipPrefixes" :chart-layout="{ title: 'Country' }" />
              <GenericBarChart v-if="ipPrefixes.length > 0" :chart-data="ipPrefixes" :chart-layout="{ title: 'Tags' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.ixp.title')"
          caption="Internet Exchange Points"
          header-class="IHR_charts-title"
          v-model="show.ixps"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="ixps"
              :columns="ixpsColumns"
              :loading-status="this.loadingStatus.ixps"
              :cypher-query="cypherQueries.ixps"
              :slot-length="2"
            >
              <GenericPieChart v-if="ixps.length > 0" :chart-data="ixps" :chart-layout="{ title: 'Country' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.rankings.title')"
          caption="Rankings"
          header-class="IHR_charts-title"
          v-model="show.rankings"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="rankings"
              :columns="rankingsColumns"
              :loading-status="this.loadingStatus.rankings"
              :cypher-query="cypherQueries.rankings"
              :slot-length="1"
            >
              <GenericIndicatorsChart v-if="rankings.length > 0" :chart-data="rankings" :chart-layout="{ title: 'Rankings' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.popularDomains.title')"
          caption="Popular Domain Names"
          header-class="IHR_charts-title"
          v-model="show.popularDomains"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="popularDomains"
              :columns="popularDomainsColumns"
              :loading-status="this.loadingStatus.popularDomains"
              :cypher-query="cypherQueries.popularDomains"
              :slot-length="1"
            >
              <GenericHoverEventsChart
                v-if="popularDomains.length > 0"
                :chart-data="popularDomains"
                :chart-layout="{ title: 'Popular Domains' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.facilities.title')"
          caption="Facilities"
          header-class="IHR_charts-title"
          v-model="show.facilities"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="facilities"
              :columns="facilitiesColumns"
              :loading-status="this.loadingStatus.facilities"
              :cypher-query="cypherQueries.facilities"
            />
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.siblings.title')"
          caption="AS Siblings"
          header-class="IHR_charts-title"
          v-model="show.siblings"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="siblings"
              :columns="siblingsColumns"
              :loading-status="this.loadingStatus.siblings"
              :cypher-query="cypherQueries.siblings"
            />
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.dependents.title')"
          caption="AS Dependents"
          header-class="IHR_charts-title"
          v-model="show.dependents"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="dependents"
              :columns="dependentsColumns"
              :loading-status="this.loadingStatus.dependents"
              :cypher-query="cypherQueries.dependents"
              :slot-length="1"
            >
              <GenericTreemapChart
                v-if="dependents.length > 0"
                :chart-data="dependents"
                :chart-layout="{ title: 'Dependents' }"
                :config="{ key: 'cc', root: this.asn, values: true }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.as.dependings.title')"
          caption="AS Dependings"
          header-class="IHR_charts-title"
          v-model="show.dependings"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="dependings"
              :columns="dependingsColumns"
              :loading-status="this.loadingStatus.dependings"
              :cypher-query="cypherQueries.dependings"
              :slot-length="1"
            >
              <GenericTreemapChart
                v-if="dependings.length > 0"
                :chart-data="dependings"
                :chart-layout="{ title: 'Dependings' }"
                :config="{ key: 'cc', root: this.asn, values: true }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import { QChip } from 'quasar'
import Overview from '@/views/charts/iyp/ASOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericPieChart from '@/views/charts/iyp/GenericPieChart'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericHoverEventsChart from '@/views/charts/iyp/GenericHoverEventsChart'
import GenericIndicatorsChart from '@/views/charts/iyp/GenericIndicatorsChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'

const expansionItems = {
  peers: {
    title: 'Peer ASes',
    subTitle: 'AS Peers',
  },
  ipPrefixes: {
    title: 'IP Prefix',
    subTitle: 'IP Prefix',
  },
  ixps: {
    title: 'IXPs',
    subTitle: 'Internet Exchange Points',
  },
  rankings: {
    title: 'Rankings',
    subTitle: 'Rankings',
  },
  popularDomains: {
    title: 'Popular Domains',
    subTitle: 'Popular Domain Names',
  },
  facilities: {
    title: 'Facilities',
    subTitle: 'Facilities',
  },
  siblings: {
    title: 'Sibling ASes',
    subTitle: 'AS Siblings',
  },
  dependents: {
    title: 'Dependent ASes',
    subTitle: 'AS Dependents',
  },
  dependings: {
    title: 'Depending ASes',
    subTitle: 'AS Dependings',
  },
}

export default {
  components: {
    Overview,
    GenericTable,
    QChip,
    GenericPieChart,
    GenericBarChart,
    GenericHoverEventsChart,
    GenericIndicatorsChart,
    GenericTreemapChart,
  },
  data() {
    return {
      asn: null,
      peeringdbId: null,
      pageTitle: 'ASN - AS Name',
      activeTab: 'data',
      tableVisible: true,
      statsDisable: false,
      peerColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      ipPrefixColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
        { name: 'AF', label: 'IP version', align: 'left', field: row => row.af, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}`, sortable: true },
      ],
      ixpsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'IXP', label: 'IXP Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      rankingsColumns: [
        { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      popularDomainsColumns: [
        { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}`, sortable: true },
        { name: 'Domain Name', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}`, sortable: true },
        {
          name: 'Ranking Name',
          label: 'Ranking Name',
          align: 'left',
          field: row => row.rankingName,
          format: val => `${val}`,
          sortable: true,
        },
      ],
      facilitiesColumns: [
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      siblingsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      dependentsColumns: [
        { name: 'Dependent AS', label: 'Dependent AS', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        {
          name: 'Hegemony Score',
          label: 'Hegemony Score',
          align: 'left',
          field: row => row.hegemonyScore,
          format: val => `${val}`,
          sortable: true,
        },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}`, sortable: true },
      ],
      dependingsColumns: [
        { name: 'Depending AS', label: 'Depending AS', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        {
          name: 'Hegemony Score',
          label: 'Hegemony Score',
          align: 'left',
          field: row => row.hegemonyScore,
          format: val => `${val}`,
          sortable: true,
        },
      ],
      ipPrefixes: [],
      peers: [],
      ixps: [],
      rankings: [],
      popularDomains: [],
      facilities: [],
      siblings: [],
      dependents: [],
      dependings: [],
      cypherQueries: {},
      show: {
        peers: false,
        ipPrefixes: false,
        ixps: false,
        rankings: false,
        popularDomains: false,
        facilities: false,
        siblings: false,
        dependents: false,
        dependings: false,
      },
      chartData: [],
      loadingStatus: {
        peers: false,
        ipPrefixes: false,
        ixps: false,
        rankings: false,
        popularDomains: false,
        facilities: false,
        siblings: false,
        dependents: false,
        dependings: false,
      },
      count: {
        peers: 0,
        ipPrefixes: 0,
        ixps: 0,
        rankings: 0,
        popularDomains: 0,
        facilities: 0,
        siblings: 0,
        dependents: 0,
        dependings: 0,
      },
    }
  },
  async created() {
    this.asn = parseInt(this.$route.params.asn)

    // getData will run multiple queries in parallel
    // await this.getData()
  },
  async mounted() {},
  computed: {},
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

    // getData will run multiple queries in parallel
    // This method is not in use
    async getData() {
      const queries = [this.getPeers(), this.getIxps(), this.getRankings(), this.getPopularDomains(), this.getFacilities()]
      let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)

      this.peers = res.peers
      this.ixps = res.ixps
      this.rankings = res.rankings
      this.popularDomains = res.popularDomains
      this.facilities = res.facilities

      let queriesObj = {}
      queries.forEach(query => {
        queriesObj[query.data] = query.cypherQuery
      })
      this.cypherQueries = queriesObj
      this.loadingStatus.peers = false

      // await this.getPeers()
      // await this.getIpPrefix()
      // await this.getIxps()
      // await this.getRankings()
      // await this.getPopularDomains()
    },
    getPeers() {
      const query = `MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(peer:AS)
         OPTIONAL MATCH (peer)-[:NAME]->(n:Name)
         OPTIONAL MATCH (peer)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         RETURN c.country_code AS cc, peer.asn AS peer, head(collect(DISTINCT(n.name))) AS name
         ORDER BY peer
        `
      const mapping = {
        cc: 'cc',
        asn: 'peer',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'peers' }
    },
    getIpPrefix() {
      const query = `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(p:Prefix)
         OPTIONAL MATCH (p)-[:COUNTRY]->(c:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         RETURN c.country_code AS cc, p.prefix as prefix, p.af as af, collect(DISTINCT(t.label)) AS tags
         ORDER BY prefix
        `
      const mapping = {
        cc: 'cc',
        af: ['af', 'low'],
        prefix: 'prefix',
        tags: 'tags',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'ipPrefixes' }
    },
    getIxps() {
      const query = `MATCH (a:AS {asn: $asn})-[:MEMBER_OF]->(i:IXP)-[:EXTERNAL_ID]->(p:PeeringdbIXID)
         OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
         RETURN c.country_code as cc, i.name as ixp, p.id as id
         ORDER BY cc, ixp
        `
      const mapping = {
        cc: 'cc',
        name: 'ixp',
        id: 'id',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'ixps' }
    },
    getRankings() {
      const query = 'MATCH (:AS {asn: $asn})-[r:RANK]->(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank'
      const mapping = {
        rank: 'rank',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'rankings' }
    },
    getPopularDomains() {
      const query = `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
         WHERE rr.rank < 100000 and rr.reference_name = $rankingName
         RETURN DISTINCT d.name AS domainName, rr.rank AS rank, rn.name AS rankingName
         ORDER BY rank
        `
      const mapping = {
        domainName: 'domainName',
        rank: 'rank',
        rankingName: 'rankingName',
      }
      return { cypherQuery: query, params: { asn: this.asn, rankingName: 'tranco.top1M' }, mapping, data: 'popularDomains' }
    },
    getTags() {
      const query = `MATCH (:AS {asn: $asn})-[:CATEGORIZED]->(t:Tag)
       RETURN t.label as tag
       ORDER BY tag
      `
      const mapping = {
        tag: 'tag',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'tags' }
    },
    getFacilities() {
      const query = `MATCH (n:AS {asn: $asn})-[:LOCATED_IN]->(f:Facility)<-[:LOCATED_IN]-(p:AS)
         MATCH (n)-[:PEERS_WITH]-(p)
         RETURN p.asn as asn, collect(DISTINCT f.name) as name
        `
      const mapping = {
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'facilities' }
    },
    getSiblings() {
      const query =
        'MATCH (a:AS {asn: $asn})-[:SIBLING_OF]-(sibling:AS)-[:NAME]->(n:Name) MATCH (sibling)-[:COUNTRY]->(c) RETURN c.country_code AS cc, sibling.asn AS asn, head(collect(DISTINCT(n.name))) as name'
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'siblings' }
    },
    getDependents() {
      const query = `MATCH (a:AS {asn: $asn})<-[d:DEPENDS_ON]-(b:AS)
            WHERE a.asn <> b.asn
            OPTIONAL MATCH (b)-[:NAME]->(n:Name)
            OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
            OPTIONAL MATCH (b)-[:CATEGORIZED]->(t:Tag)
            RETURN DISTINCT b.asn AS dependent, head(collect(n.name)) AS name, c.country_code AS cc, d.hege AS hegemony_score, collect(DISTINCT t.label) AS tags
            `
      const mapping = {
        asn: 'dependent',
        name: 'name',
        cc: 'cc',
        hegemonyScore: 'hegemony_score',
        tags: 'tags',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'dependents' }
    },
    getDependings() {
      const query = `MATCH (a:AS {asn: $asn})-[d:DEPENDS_ON]->(b:AS)
            WHERE a.asn <> b.asn
            OPTIONAL MATCH (b)-[:NAME]->(n:Name)
            OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
            RETURN DISTINCT b.asn AS dependency, head(collect(n.name)) AS name, c.country_code AS country, d.hege AS hegemony_score
            ORDER BY country
            `
      const mapping = {
        asn: 'dependency',
        name: 'name',
        cc: 'country',
        hegemonyScore: 'hegemony_score',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'dependings' }
    },
    setPageTitle(title) {
      this.pageTitle = `AS${this.asn} - ${title}`
    },
    setPeeringdbId(id) {
      this.peeringdbId = id
    },
    async handleClick(e) {
      console.log(e.srcElement.innerText)
      const clickedItem = e.srcElement.innerText

      let query = {}
      if (clickedItem === expansionItems.ipPrefixes.title || clickedItem === expansionItems.ipPrefixes.subTitle) {
        query = this.getIpPrefix()
      } else if (clickedItem === expansionItems.peers.title || clickedItem === expansionItems.peers.subTitle) {
        query = this.getPeers()
      } else if (clickedItem === expansionItems.ixps.title || clickedItem === expansionItems.ixps.subTitle) {
        query = this.getIxps()
      } else if (clickedItem === expansionItems.rankings.title || clickedItem === expansionItems.rankings.subTitle) {
        query = this.getRankings()
      } else if (clickedItem === expansionItems.popularDomains.title || clickedItem === expansionItems.popularDomains.subTitle) {
        query = this.getPopularDomains()
      } else if (clickedItem === expansionItems.facilities.title || clickedItem === expansionItems.facilities.subTitle) {
        query = this.getFacilities()
      } else if (clickedItem === expansionItems.siblings.title || clickedItem === expansionItems.siblings.subTitle) {
        query = this.getSiblings()
      } else if (clickedItem === expansionItems.dependents.title || clickedItem === expansionItems.dependents.subTitle) {
        query = this.getDependents()
      } else if (clickedItem === expansionItems.dependings.title || clickedItem === expansionItems.dependings.subTitle) {
        query = this.getDependings()
      } else {
        return
      }

      this.count[query.data] += 1
      if (this.count[query.data] > 1) {
        return
      }
      // console.log(`${this.count[query.data]} time`)
      this.loadingStatus[query.data] = true
      const results = await this.$iyp_api.run(query.cypherQuery, query.params)
      const formattedRes = this.$iyp_api.formatResponse(results, query.mapping)
      console.log(formattedRes)
      this[query.data] = formattedRes

      this.cypherQueries[query.data] = query.cypherQuery
      this.loadingStatus[query.data] = false
    },
    getSlotLength() {
      return this.$children.filter(child => child.$options.name === 'PieChart' || child.$options.name === 'BarChart').length
    },
    handleExpansion(key) {
      if (key == 'prefix') {
        this.show.ipPrefixes = !this.show.ipPrefixes
      } else if (key == 'dependents') {
        this.show.dependents = !this.show.dependents
      }
    },
  },
  watch: {
    '$route.params.asn': {
      handler: async function (asn) {
        if (parseInt(asn) != this.asn) {
          this.asn = parseInt(asn)
          await this.getData()
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
