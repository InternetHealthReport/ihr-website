<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ getPrefix() }}</h1>
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
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/PrefixOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
export default {
  components: {
    Overview,
    GenericTable,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      domainsColumns: [
        { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}` },
        { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}` },
      ],
      dependenciesColumns: [
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS ${val}` },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      domains: [],
      dependencies: [],
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
    const queries = [this.getDomains(), this.getDependencies()]
    let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
    console.log(res)
    this.domains = res.domains
    this.dependencies = res.dependencies
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
      const query = 'MATCH (p:Prefix {prefix: $prefix})-[:PART_OF]-(i:IP)-[:RESOLVES_TO]-(d:DomainName) RETURN i.ip AS ip, d.name as domain'
      const mapping = {
        ip: 'ip',
        domainName: 'domain',
      }
      const prefix = this.getPrefix()
      console.log(prefix)
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'domains' }
    },
    getDependencies() {
      const query =
        'MATCH (p:Prefix {prefix: $prefix})-[:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name) RETURN a.asn AS asn, head(collect(DISTINCT(n.name))) AS name'
      const mapping = {
        asn: 'asn',
        name: 'name',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'dependencies' }
    },
  },
}
</script>
