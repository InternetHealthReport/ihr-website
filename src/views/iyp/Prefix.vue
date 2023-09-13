<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ getPrefix() }}</h1>
    <div>
      <q-list>
        <Overview :host="host" :prefixLength="prefixLength" />

        <q-expansion-item
          @click="handleClick(expansionItems.domains.title)"
          :label="$t('iyp.prefix.domains.title')"
          caption="Corresponding Domain Names"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="domains"
              :columns="domainsColumns"
              :loading-status="this.loadingStatus.domains"
              :cypher-query="cypherQueries.domains"
              :slot-length="3"
            >
              <GenericPieChart v-if="domains.length > 0" :chart-data="domains" :chart-layout="{ title: 'Country' }" />
              <GenericBarChart v-if="domains.length > 0" :chart-data="domains" :chart-layout="{ title: 'Tags' }" />
              <GenericTreemapChart
                v-if="domains.length > 0"
                :chart-data="domains"
                :chart-layout="{ title: 'Domain Names' }"
                :config="{ key: 'domainName', root: this.getPrefix(), values: false }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick(expansionItems.dependencies.title)"
          :label="$t('iyp.prefix.dependencies.title')"
          caption="List of Dependencies"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="dependencies"
              :columns="dependenciesColumns"
              :loading-status="this.loadingStatus.dependencies"
              :cypher-query="cypherQueries.dependencies"
              :slot-length="1"
            >
              <GenericPieChart v-if="dependencies.length > 0" :chart-data="dependencies" :chart-layout="{ title: 'Tags' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick(expansionItems.prefixes.title)"
          :label="$t('iyp.prefix.prefixes.title')"
          caption="Covering Prefixes"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="part"
              :columns="partColumns"
              :loading-status="this.loadingStatus.part"
              :cypher-query="cypherQueries.part"
              :slot-length="2"
            >
              <GenericPieChart v-if="part.length > 0" :chart-data="part" :chart-layout="{ title: 'Country' }" />
              <!-- <GenericBarChart v-if="part.length > 0" :chart-data="part" :chart-layout="{ title: 'Tags' }" /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import { QChip } from 'quasar'
import Overview from '@/views/charts/iyp/PrefixOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericPieChart from '@/views/charts/iyp/GenericPieChart'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'

const expansionItems = {
  domains: {
    title: 'Domain Names',
    subTitle: 'Corresponding Domain Names',
  },
  dependencies: {
    title: 'Dependencies',
    subTitle: 'List Of Dependencies',
  },
  prefixes: {
    title: 'Covering Prefixes',
    subTitle: 'Covering Prefixes',
  },
}

export default {
  components: {
    Overview,
    GenericTable,
    QChip,
    GenericPieChart,
    GenericBarChart,
    GenericTreemapChart,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      domainsColumns: [
        { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}`, sortable: true },
        { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}`, sortable: true },
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Domain Tags', align: 'left', field: row => row.tags, format: val => `${val}`, sortable: true },
      ],
      dependenciesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS ${val}`, sortable: true },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      partColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
        { name: 'Origin ASN', label: 'Origin ASN', align: 'left', field: row => row.origin, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}`, sortable: true },
      ],
      domains: [],
      dependencies: [],
      part: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
        domains: false,
        dependencies: false,
        part: false,
      },
      loadingStatus: {
        domains: false,
        dependencies: false,
        part: false,
      },
      count: {
        domains: 0,
        dependencies: 0,
        part: 0,
      },
      expansionItems: expansionItems,
      expanded: [],
    }
  },
  created() {
    this.host = this.$route.params.host
    this.prefixLength = this.$route.params.prefix_length
  },
  async mounted() {},
  methods: {
    // getData will run multiple queries in parallel
    // This method is not in use
    async getData() {
      const queries = [this.getDomains(), this.getDependencies(), this.getPartOfPrefixes()]
      let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
      // console.log(res)
      this.domains = res.domains
      this.dependencies = res.dependencies
      this.part = res.part
      let queriesObj = {}
      queries.forEach(query => {
        queriesObj[query.data] = query.cypherQuery
      })
      this.cypherQueries = queriesObj
    },
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
    },
    getDomains() {
      // '203.13.32.0/24'
      // const query = `
      // MATCH (p:Prefix {prefix: $prefix})-[:PART_OF]-(i:IP)-[:RESOLVES_TO]-(d:DomainName)
      // MATCH (p)-[:CATEGORIZED]-(t:Tag)
      // OPTIONAL MATCH (p)-[:COUNTRY]-(c:Country)
      // RETURN c.country_code as cc, i.ip AS ip, d.name as domain, collect(DISTINCT(t.label)) as tags
      // `
      const query = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(d:DomainName)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (p)-[:COUNTRY]->(c:Country)
      OPTIONAL MATCH (d)-[ra:RANK]->(:Ranking {name: 'Tranco top 1M'})
      RETURN c.country_code as cc, i.ip AS ip, d.name as domain, collect(DISTINCT t.label) as tags, ra.rank AS rank
      `
      const mapping = {
        rank: 'rank',
        cc: 'cc',
        ip: 'ip',
        domainName: 'domain',
        tags: 'tags',
      }
      const prefix = this.getPrefix()
      // console.log(prefix)
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'domains' }
    },
    getDependencies() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})-[:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name) 
      OPTIONAL MATCH (a)-[:COUNTRY]-(c:Country) 
      RETURN c.country_code AS cc, a.asn AS asn, head(collect(DISTINCT(n.name))) AS name
      `
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'dependencies' }
    },
    getPartOfPrefixes() {
      // const query = `
      // MATCH (p:Prefix {prefix: $prefix})-[:PART_OF*]->(x:Prefix)-[:CATEGORIZED]-(t:Tag)
      // OPTIONAL MATCH (x)-[:COUNTRY]-(c:Country)
      // RETURN c.country_code as cc, x.prefix as prefix, collect(DISTINCT(t.label)) as tags
      // `
      const query = `
      MATCH (p:Prefix {prefix: $prefix})-[:PART_OF*]->(x:Prefix)
      OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (x)-[:COUNTRY]->(c:Country)
      OPTIONAL MATCH (x)<-[:ORIGINATE]-(a:AS)
      RETURN c.country_code as cc, x.prefix as prefix, collect(a.asn) as origin_asn, collect(DISTINCT t.label) as tags
      `
      const mapping = {
        cc: 'cc',
        prefix: 'prefix',
        origin: 'origin_asn',
        tags: 'tags',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'part' }
    },
    async handleClick(key) {
      if (!this.expanded.includes(key)) {
        this.expanded.push(key)
      }

      const clickedItem = key
      let query = {}
      if (clickedItem === expansionItems.domains.title || clickedItem === expansionItems.domains.subTitle) {
        query = this.getDomains()
      } else if (clickedItem === expansionItems.dependencies.title || clickedItem === expansionItems.dependencies.subTitle) {
        query = this.getDependencies()
      } else if (clickedItem === expansionItems.prefixes.title || clickedItem === expansionItems.prefixes.subTitle) {
        query = this.getPartOfPrefixes()
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
      this[query.data] = formattedRes

      this.cypherQueries[query.data] = query.cypherQuery
      this.loadingStatus[query.data] = false
    },
  },
  watch: {
    '$route.params': {
      handler: async function (params) {
        console.log('Prefix Changed')
        // console.log(params.host)
        if (params.host != this.host || params.prefixLength != this.prefixLength) {
          this.host = this.$route.params.host
          this.prefixLength = this.$route.params.prefix_length

          // reset to zero
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
