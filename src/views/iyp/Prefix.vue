<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ getPrefix() }}</h1>
    <div>
      <q-chip name="bgp" clickable @click="handleReference" color="blue" text-color="white"> Bgp </q-chip>
      <q-chip name="bgp.tools" clickable @click="handleReference" color="blue" text-color="white"> Bgp.Tools </q-chip>
      <q-chip name="ripe" clickable @click="handleReference" color="blue" text-color="white"> RIPEstat </q-chip>
    </div>
    <div>
      <q-list>
        <q-expansion-item
          :label="$t('iyp.overview.prefix.title')"
          caption="Overview of a Prefix"
          header-class="IHR_charts-title"
          v-model="show.overview"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <Overview :host="host" :prefixLength="prefixLength" />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.prefix.domains.title')" caption="Corresponding Domain Names" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="domains" :columns="domainsColumns" :cypher-query="cypherQueries.domains" />
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.prefix.dependencies.title')" caption="List of Dependencies" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="dependencies" :columns="dependenciesColumns" :cypher-query="cypherQueries.dependencies" />
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.prefix.part.title')" caption="Prefixes that are part of" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="part" :columns="partColumns" :cypher-query="cypherQueries.part" />
            </q-card>
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
const references = {
  bgp: 'https://bgp.he.net/net',
  bgpTools: 'https://bgp.tools/prefix',
  ripeStat: 'https://stat.ripe.net/app/launchpad',
}
export default {
  components: {
    Overview,
    GenericTable,
    QChip,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      domainsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}` },
        { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}` },
        { name: 'Tags', label: 'Domain Tags', align: 'left', field: row => row.tags, format: val => `${val}` },
      ],
      dependenciesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS ${val}` },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      partColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}` },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}` },
      ],
      domains: [],
      dependencies: [],
      part: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
      },
    }
  },
  created() {
    this.host = this.$route.params.host
    this.prefixLength = this.$route.params.prefix_length
  },
  async mounted() {
    const queries = [this.getDomains(), this.getDependencies(), this.getPartOfPrefixes()]
    let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
    console.log(res)
    this.domains = res.domains
    this.dependencies = res.dependencies
    this.part = res.part
    let queriesObj = {}
    queries.forEach(query => {
      queriesObj[query.data] = query.cypherQuery
    })
    this.cypherQueries = queriesObj
  },
  methods: {
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
    },
    getDomains() {
      // '203.13.32.0/24'
      const query =
        'MATCH (p:Prefix {prefix: $prefix})-[:PART_OF]-(i:IP)-[:RESOLVES_TO]-(d:DomainName) MATCH (p)-[:CATEGORIZED]-(t:Tag) MATCH (p)-[:COUNTRY]-(c:Country) RETURN c.country_code as cc, i.ip AS ip, d.name as domain, collect(DISTINCT(t.label)) as tags'
      const mapping = {
        cc: 'cc',
        ip: 'ip',
        domainName: 'domain',
        tags: 'tags',
      }
      const prefix = this.getPrefix()
      console.log(prefix)
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'domains' }
    },
    getDependencies() {
      const query =
        'MATCH (p:Prefix {prefix: $prefix})-[:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name) MATCH (a)-[:COUNTRY]-(c:Country) RETURN c.country_code AS cc, a.asn AS asn, head(collect(DISTINCT(n.name))) AS name'
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'dependencies' }
    },
    getPartOfPrefixes() {
      const query =
        'MATCH (p:Prefix {prefix: $prefix})-[:PART_OF*]->(x:Prefix)-[:CATEGORIZED]-(t:Tag) MATCH (x)-[:COUNTRY]-(c:Country) RETURN c.country_code as cc, x.prefix as prefix, collect(DISTINCT(t.label)) as tags'
      const mapping = {
        cc: 'cc',
        prefix: 'prefix',
        tags: 'tags',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'part' }
    },
    handleReference(e) {
      console.log('Redirect')
      console.log(e.srcElement.outerText)
      let reference = e.srcElement.outerText.trim()
      let externalLink = ''
      if (reference === 'Bgp') {
        externalLink = `${references.bgp}/${this.host}/${this.prefixLength}`
      } else if (reference === 'Bgp.Tools') {
        externalLink = `${references.bgpTools}/${this.host}/${this.prefixLength}`
      } else if (reference === 'RIPEstat') {
        externalLink = `${references.ripeStat}/${this.host}/${this.prefixLength}`
      } else {
        console.log('none')
        return
      }
      console.log(externalLink)
      window.open(externalLink, '_blank')
    },
  },
}
</script>
