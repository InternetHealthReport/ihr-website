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
          caption="$t('iyp.country.ixps.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="ixps"
              :columns="ixpsColumns"
              :loading-status="this.loadingStatus.ixps"
              :cypher-query="cypherQueries.ixps"
              :slot-length=1
            >
              <div class="col-6">
                <GenericTreemapChart
                  v-if="ixps.length > 0"
                  :chart-data="ixps"
                  :chart-layout="{ title: '' }"
                  :config="{ keys: ['org', 'ixp'], root: this.pageTitle }"
                />
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('prefixes')"
          :label="$t('iyp.country.prefixes.title')"
          :caption="$t('iyp.country.prefixes.caption')+this.pageTitle"
          header-class="IHR_charts-title"
          v-model="show.prefixes"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="prefixes"
              :columns="prefixColumns"
              :loading-status="this.loadingStatus.prefixes"
              :cypher-query="cypherQueries.prefixes"
              :slot-length="2"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <GenericBarChart v-if="prefixes.length > 0" :chart-data="prefixes" :config="{key:'tags'}" :chart-layout="{ title: 'Tags' }" />
                </div>
               <div class="col-8">
                  <GenericTreemapChart
                  v-if="aggPrefixes.length > 0"
                  :chart-data="aggPrefixes"
                  :chart-layout="{ title: 'Number of prefixes per Origin AS' }"
                  :config="{ keys: ['asn'], keyValue: 'nbPrefixes', root: this.pageTitle, show_percent: true}"
                  />
                </div>
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>


      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/CountryOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'

export default {
  components: {
    Overview,
    GenericTable,
    GenericTreemapChart,
    GenericBarChart
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
      prefixColumns: [
        { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.rir_country, format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Geoloc. Country', label: 'Geoloc. Country', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.asns, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.visibility, format: val => `${Number(val).toFixed(2)}%`, sortable: true },
      ],
      // ases stands for autonomous systems
      ases: [],
      ixps: [],
      prefixes: [],
      aggPrefixes: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
        ases: false,
        ixps: false,
        prefixes: false,
      },
      loadingStatus: {
        ases: false,
        ixps: false,
        prefixes: false,
      },
      count: {
        ases: 0,
        ixps: 0,
        prefixes: 0,
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
      OPTIONAL MATCH (b)-[:MANAGED_BY]-(o:Organization)
      RETURN a.country_code AS cc, b.name as ixp, c.id as id, o.name as org`
      const mapping = {
        cc: 'cc',
        ixp: 'ixp',
        org: 'org',
        id: 'id',
      }
      return { cypherQuery: query, params: { cc: this.cc, ref: 'peeringdb.ix' }, mapping, data: 'ixps' }
    },
    getIpPrefixes() {
      const query = `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(p:Prefix)
         OPTIONAL MATCH (p)<-[o:ORIGINATE {reference_org:'IHR'}]-(a:AS)
         OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
         OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
         OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
         RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix AS prefix, COLLECT(DISTINCT(t.label)) AS tags, COLLECT(DISTINCT o.descr) AS descr, COLLECT(DISTINCT o.visibility) AS visibility, COLLECT(DISTINCT a.asn) AS asns
        `
      const mapping = {
        cc: 'cc',
        rir: 'rir',
        asns: 'asns',
        rir_country: 'rir_country',
        prefix: 'prefix',
        tags: 'tags',
        descr: 'descr',
        visibility: 'visibility'
      }
      return { cypherQuery: query, params: { cc: this.cc }, mapping, data: 'prefixes' }
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
      } else if (clickedItem == 'prefixes') {
        query = this.getIpPrefixes()
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

      if ( clickedItem == 'prefixes' ){
        this.aggPrefixes = this.aggregatePrefixes(formattedRes)
      }
      this.loadingStatus[query.data] = false
    },
    aggregatePrefixes( prefixData ){
      var asCount = {}

      prefixData.forEach( item => {
        item.asns.forEach( asn => {
          if(!asCount[asn]){
            asCount[asn] = {nbPrefixes:1, asn: 'AS'+asn}
          }
          else{
            asCount[asn].nbPrefixes += 1
          }
        })
      })
      return Object.values(asCount)
    }
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
