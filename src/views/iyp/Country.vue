<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ this.cc }}</h1>
    <div>
      <q-list>
        <q-expansion-item
          :label="$t('iyp.overview.country.title')"
          caption="Overview of a country"
          header-class="IHR_charts-title"
          v-model="show.overview"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <Overview :country-code="cc" />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.country.ases.title')" caption="Autonomous Systems (ASes)" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="ases" :columns="asesColumns" :cypher-query="cypherQueries.ases" />
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.country.ixps.title')" caption="Internet Exchange Points (IXPs)" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="ixps" :columns="ixpsColumns" :cypher-query="cypherQueries.ixps" />
            </q-card>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/CountryOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
export default {
  components: {
    Overview,
    GenericTable,
  },
  data() {
    return {
      cc: null,
      asesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      ixpsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.ixp, format: val => `${val}` },
      ],
      // ases stands for autonomous systems
      ases: [],
      ixps: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
      },
    }
  },
  created() {
    this.cc = this.$route.params.cc
  },
  async mounted() {
    const queries = [this.getASes(), this.getIXPs()]
    let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
    console.log(res)
    this.ases = res.ases
    this.ixps = res.ixps
    let queriesObj = {}
    queries.forEach(query => {
      queriesObj[query.data] = query.cypherQuery
    })
    this.cypherQueries = queriesObj
  },
  methods: {
    // ases stands for autonomous systems
    getASes() {
      const query =
        'MATCH (c:Country {country_code: $cc})-[r]-(a:AS)-[:NAME]-(n:Name) WITH c.country_code AS cc, a.asn AS asn, head(collect(DISTINCT(n.name))) AS name RETURN cc, asn, name LIMIT 100'
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { cc: this.cc }, mapping, data: 'ases' }
    },
    getIXPs() {
      const query =
        'MATCH (a:Country {country_code: $cc})-[:COUNTRY {reference_name: $ref}]-(b:IXP) RETURN a.country_code AS cc, b.name as ixp'
      const mapping = {
        cc: 'cc',
        ixp: 'ixp',
      }
      return { cypherQuery: query, params: { cc: this.cc, ref: 'peeringdb.ix' }, mapping, data: 'ixps' }
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
