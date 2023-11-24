<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :as-number="this.asn" :title="setPageTitle" :peeringdbId="setPeeringdbId" />

        <q-expansion-item
          @click="handleClick('ipPrefixes')"
          :label="$t('iyp.as.ipPrefix.title')"
          :caption="$t('iyp.as.ipPrefix.caption')+this.asn"
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
              <div class="row justify-evenly">
                <div class="col-4">
                  <GenericPieChart v-if="ipPrefixes.length > 0" :chart-data="ipPrefixes" :chart-layout="{ title: 'Geo-location (Maxmind)' }" />
                </div>
                <div class="col-6">
                  <GenericBarChart v-if="ipPrefixes.length > 0" :chart-data="ipPrefixes" :config="{key:'tags'}" :chart-layout="{ title: 'Tags' }" />
                </div>
               <div class="col-10">
                <GenericTreemapChart
                  v-if="ipPrefixes.length > 0"
                  :chart-data="ipPrefixes"
                  :chart-layout="{ title: 'Breakdown per RIR and geo-location (Maxmind)' }"
                  :config="{ keys: ['rir', 'cc', 'prefix'], root: this.asn, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.descr}<extra>%{customdata.__percent:.1f}%</extra>' }"
                 />
                </div>
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('peers')"
          :label="$t('iyp.as.peers.title')"
          :caption="$t('iyp.as.peers.caption')+this.asn"
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
              <GenericTreemapChart
                v-if="peers.length > 0"
                :chart-data="peers"
                :chart-layout="{ title: `ASes directly connected to AS${this.asn}` }"
                :config="{ keys: ['cc', 'asn'], root: this.asn, show_percent: true, hovertemplate: '<b>%{label} %{customdata.name}</b><extra>%{customdata.__percent:.1f}%</extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('upstreams')"
          :label="$t('iyp.as.upstreams.title')"
          :caption="'AS'+this.asn+' depends on these peer & upstream ASes'"
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
            <GenericBarChart v-if="dependings.length > 0" :chart-data="dependings" :config="{key:'name', value:'hegemony_score'}"/>
             <!--  <GenericTreemapChart
                v-if="dependings.length > 0"
                :chart-data="dependings"
                :chart-layout="{ title: 'Dependings' }"
                :config="{ keys: ['cc', 'asn'], keyValue: 'hegemony_score', root: this.asn, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
                /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('downstreams')"
          :label="$t('iyp.as.downstreams.title')"
          :caption="$t('iyp.as.downstreams.caption')+this.asn"
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
              <div class="col-6">
                <GenericTreemapChart
                  v-if="dependents.length > 0"
                  :chart-data="dependents"
                  :chart-layout="{ title: '' }"
                  :config="{ keys: ['cc', 'asn'], keyValue: 'hegemony_score', root: this.asn, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
                />
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('popularDomains')"
          :label="$t('iyp.as.popularDomains.title')"
          :caption="$t('iyp.as.popularDomains.caption')+this.asn"
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
         <!--      <GenericHoverEventsChart
                v-if="popularDomains.length > 0"
                :chart-data="popularDomains"
                :chart-layout="{ title: 'Popular Domains' }"
                /> -->
              <GenericTreemapChart
                v-if="popularDomains.length > 0"
                :chart-data="popularDomains"
                :config="{ keys: ['tld', 'domainName'], keyValue: 'inv_rank', root: this.asn, textinfo: 'label', hovertemplate: '<b>%{label}</b> <br><br>%{customdata.rankingName}: %{customdata.rank}<extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('rankings')"
          :label="$t('iyp.as.rankings.title')"
          :caption="$t('iyp.as.rankings.caption')+this.asn"
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
          @click="handleClick('siblings')"
          :label="$t('iyp.as.siblings.title')"
          :caption="$t('iyp.as.siblings.caption')"
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
          @click="handleClick('ixps')"
          :label="$t('iyp.as.ixp.title')"
          :caption="$t('iyp.as.ixp.caption')+this.asn"
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
              <GenericTreemapChart v-if="ixps.length > 0" :chart-data="ixps" :config="{ keys: ['cc', 'name'],  keyValue: '', root: '', show_percent: true }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('facilities')"
          :label="$t('iyp.as.facilities.title')"
          :caption="$t('iyp.as.facilities.caption')+this.asn"
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

      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/ASOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericPieChart from '@/views/charts/iyp/GenericPieChart'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericIndicatorsChart from '@/views/charts/iyp/GenericIndicatorsChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'

export default {
  components: {
    Overview,
    GenericTable,
    GenericPieChart,
    GenericBarChart,
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
        { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.rir_country, format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.visibility, format: val => `${Number(val).toFixed(2)}%`, sortable: true },
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
        { name: 'Facilities', label: 'Facilities', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      siblingsColumns: [
        { name: 'Country', label: 'Country', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      dependentsColumns: [
        { name: 'Country', label: 'Country', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Dependent AS', label: 'Dependent AS', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
        {
          name: 'Hegemony Score',
          label: 'Hegemony Score',
          align: 'left',
          field: row => row.hegemony_score,
          format: val => `${Number(val).toFixed(2)}%`,
          sortable: true,
        },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
      ],
      dependingsColumns: [
        { name: 'Country', label: 'Country', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Depending AS', label: 'Depending AS', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
        {
          name: 'Hegemony Score',
          label: 'Hegemony Score',
          align: 'left',
          field: row => row.hegemony_score,
          format: val => `${Number(val).toFixed(2)}%`,
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
      expanded: [],
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
    },
    getPeers() {
      const query = `MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(peer:AS)
         OPTIONAL MATCH (peer)-[:NAME]->(n:Name)
         OPTIONAL MATCH (peer)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
         RETURN c.country_code AS cc, peer.asn AS peer, head(collect(DISTINCT(n.name))) AS name
        `
      const mapping = {
        cc: 'cc',
        asn: 'peer',
        name: 'name',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'peers' }
    },
    getIpPrefixes() {
      const query = `MATCH (:AS {asn: $asn})-[o:ORIGINATE]->(p:Prefix)
         OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
         OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
         OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
         RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix as prefix, collect(DISTINCT(t.label)) AS tags, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility
        `
      const mapping = {
        cc: 'cc',
        rir: 'rir',
        rir_country: 'rir_country',
        prefix: 'prefix',
        tags: 'tags',
        descr: 'descr',
        visibility: 'visibility'
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
        asn: 'ixp',
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
         RETURN DISTINCT d.name AS domainName, rr.rank AS rank, rn.name AS rankingName, split(d.name, '.')[-1] AS tld, 1/toFloat(rr.rank) AS inv_rank
         ORDER BY rank
        `
      const mapping = {
        domainName: 'domainName',
        tld: 'tld',
        rank: 'rank',
        inv_rank: 'inv_rank',
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
    getDownstreams() {
      const query = `MATCH (a:AS {asn: $asn})<-[d:DEPENDS_ON]-(b:AS)
            WHERE a.asn <> b.asn
            OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
            OPTIONAL MATCH (b)-[:CATEGORIZED]->(t:Tag)
            RETURN DISTINCT b.asn AS dependent, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS cc, 100*d.hege AS hegemony_score, collect(DISTINCT t.label) AS tags
            `
      const mapping = {
        asn: 'dependent',
        name: 'name',
        cc: 'cc',
        hegemony_score: 'hegemony_score',
        tags: 'tags',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'dependents' }
    },
    getUpstreams() {
      const query = `MATCH (a:AS {asn: $asn})-[d:DEPENDS_ON]->(b:AS)
            WHERE a.asn <> b.asn
            OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
            RETURN DISTINCT b.asn AS dependency, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS country, 100*d.hege AS hegemony_score
            ORDER BY country
            `
      const mapping = {
        asn: 'dependency',
        name: 'name',
        cc: 'country',
        hegemony_score: 'hegemony_score',
      }
      return { cypherQuery: query, params: { asn: this.asn }, mapping, data: 'dependings' }
    },
    setPageTitle(title) {
      this.pageTitle = `AS${this.asn} - ${title}`
    },
    setPeeringdbId(id) {
      this.peeringdbId = id
    },
    async handleClick(key) {
      if (!this.expanded.includes(key)) {
        this.expanded.push(key)
      }

      const clickedItem = key
      let query = {}
      if (clickedItem === 'ipPrefixes') {
        query = this.getIpPrefixes()
      } else if (clickedItem === 'peers') {
        query = this.getPeers()
      } else if (clickedItem === 'ixps') {
        query = this.getIxps()
      } else if (clickedItem === 'rankings') {
        query = this.getRankings()
      } else if (clickedItem === 'popularDomains') {
        query = this.getPopularDomains()
      } else if (clickedItem === 'facilities') {
        query = this.getFacilities()
      } else if (clickedItem === 'siblings') {
        query = this.getSiblings()
      } else if (clickedItem === 'downstreams') {
        query = this.getDownstreams()
      } else if (clickedItem === 'upstreams') {
        query = this.getUpstreams()
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
      // console.log(formattedRes)
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
          let items = Object.keys(this.count)
          items.forEach(item => (this.count[item] = 0))
          this.expanded.forEach(async key => {
            await this.handleClick(key)
          })
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
