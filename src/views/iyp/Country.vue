<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ this.pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :country-code="cc" :title="setPageTitle" />

        <q-expansion-item
          @click="handleClick('ases')"
          :label="$t('iyp.country.ases.title')"
          :caption="$t('iyp.country.ases.title')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="ases"
              :columns="asesColumns"
              :loading-status="this.loadingStatus.ases"
              :cypher-query="cypherQueries.ases"
            />
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('ixps')"
          :label="$t('iyp.country.ixps.title')"
          caption="Internet Exchange Points (IXPs)"
          header-class="IHR_charts-title"
        >
          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="ixps"
              :columns="ixpsColumns"
              :loading-status="this.loadingStatus.ixps"
              :cypher-query="cypherQueries.ixps"
            />
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
      pageTitle: null,
      asesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        {
          name: 'ASN',
          label: 'ASN',
          align: 'left',
          field: row => row.asn,
          format: val => `AS${val}`,
          sortable: true,
          sort: (a, b) => parseInt(b, 10) - parseInt(a, 10),
        },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      ixpsColumns: [
        {
          name: 'CC',
          label: 'CC',
          align: 'left',
          field: row => row.cc,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'IXP',
          label: 'IXP (PeeringDB IXID)',
          align: 'left',
          field: row => row.id,
          format: val => `${val}`,
          sortable: true,
          sort: (a, b) => parseInt(b, 10) - parseInt(a, 10),
        },
        {
          name: 'Name',
          label: 'Name',
          align: 'left',
          field: row => row.ixp,
          format: val => `${val}`,
          sortable: true,
        },
      ],
      // ases stands for autonomous systems
      ases: [],
      ixps: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
        ases: false,
        ixps: false,
      },
      loadingStatus: {
        ases: false,
        ixps: false,
      },
      count: {
        ases: 0,
        ixps: 0,
      },
      expanded: [],
    }
  },
  created() {
    this.cc = this.$route.params.cc
  },
  async mounted() {},
  methods: {
    // getData will run multiple queries in parallel
    // This method is not in use
    async getData() {
      const queries = [this.getASes(), this.getIXPs()]
      let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
      this.ases = res.ases
      this.ixps = res.ixps
      let queriesObj = {}
      queries.forEach(query => {
        queriesObj[query.data] = query.cypherQuery
      })
      this.cypherQueries = queriesObj
    },
    // ases stands for autonomous systems
    getASes() {
      const query = `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'nro.delegated_stats'}]-(a:AS)
         OPTIONAL MATCH (sibling)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
         OPTIONAL MATCH (sibling)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
         OPTIONAL MATCH (sibling)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
         RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name
        `
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { cc: this.cc }, mapping, data: 'ases' }
    },
    getIXPs() {
      const query = `
      MATCH (a:Country {country_code: $cc})<-[:COUNTRY {reference_name: $ref}]-(b:IXP)
      MATCH (b)-[:EXTERNAL_ID]-(c:PeeringdbIXID)
      RETURN a.country_code AS cc, b.name as ixp, c.id as id`
      const mapping = {
        cc: 'cc',
        ixp: 'ixp',
        id: 'id',
      }
      return { cypherQuery: query, params: { cc: this.cc, ref: 'peeringdb.ix' }, mapping, data: 'ixps' }
    },
    setPageTitle(title) {
      this.pageTitle = title
    },
    async handleClick(key) {
      if (!this.expanded.includes(key)) {
        this.expanded.push(key)
      }

      const clickedItem = key
      let query = {}
      if (clickedItem === 'ases') {
        query = this.getASes()
      } else if (clickedItem == 'ixps') {
        query = this.getIXPs()
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
    '$route.params.cc': {
      handler: async function (cc) {
        console.log('Country Changed')
        if (cc != this.cc) {
          this.cc = cc

          // reset count to zero
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
