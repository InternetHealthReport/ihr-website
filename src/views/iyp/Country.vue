<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ this.pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :country-code="cc" :title="setPageTitle" />

        <q-expansion-item
          @click="loadSection('ases')"
          :label="$t('iyp.country.ases.title')"
          :caption="$t('iyp.country.ases.caption')+this.pageTitle"
          header-class="IHR_charts-title"
          v-model="sections.ases.show"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.ases.data"
              :columns="sections.ases.columns"
              :loading-status="sections.ases.loading"
              :cypher-query="sections.ases.query"
            />
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('ixps')"
          :label="$t('iyp.country.ixps.title')"
          :caption="$t('iyp.country.ixps.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.ixps.data"
              :columns="sections.ixps.columns"
              :loading-status="sections.ixps.loading"
              :cypher-query="sections.ixps.query"
              :slot-length=1
            >
              <div class="col-6">
                <GenericTreemapChart
                  v-if="sections.ixps.data.length > 0"
                  :chart-data="sections.ixps.data"
                  :chart-layout="{ title: '' }"
                  :config="{ keys: ['org', 'ixp'], root: this.pageTitle }"
                />
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('prefixes')"
          :label="$t('iyp.country.prefixes.title')"
          :caption="$t('iyp.country.prefixes.caption')+this.pageTitle"
          header-class="IHR_charts-title"
          v-model="sections.prefixes.show"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="sections.prefixes.data"
              :columns="sections.prefixes.columns"
              :loading-status="sections.prefixes.loading"
              :cypher-query="sections.prefixes.query"
              :slot-length="2"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <GenericBarChart v-if="sections.prefixes.data.length > 0" :chart-data="sections.prefixes.data" :config="{key:'tags'}" :chart-layout="{ title: 'Tags' }" />
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

        <q-expansion-item
          @click="loadSection('atlas')"
          :label="$t('iyp.country.atlas.title')"
          :caption="$t('iyp.country.atlas.caption')+this.pageTitle"
          header-class="IHR_charts-title"
          v-model="sections.atlas.show"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <GenericTable
              :data="sections.atlas.data"
              :columns="sections.atlas.columns"
              :loading-status="sections.atlas.loading"
              :cypher-query="sections.atlas.query"
              :slot-length="1"
            >
              <GenericTreemapChart
                v-if="sections.atlas.data.length > 0"
                :chart-data="sections.atlas.data"
                :chart-layout="{ title: 'RIPE Atlas probes per AS' }"
                :config="{ keys: ['af', 'asn', 'status', 'id'],  root: this.pageTitle, show_percent: true}"
                />
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
      aggPrefixes: [],
      sections:{
        // Autonomous Systems
        ases: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'nro.delegated_stats'}]-(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true, sort: (a, b) => parseInt(b, 10) - parseInt(a, 10), },
            { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
          ]
        },

        // IXPs
        ixps: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (a:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'peeringdb.ix'}]-(b:IXP)
            MATCH (b)-[:EXTERNAL_ID]-(c:PeeringdbIXID)
            OPTIONAL MATCH (b)-[:MANAGED_BY]-(o:Organization)
            RETURN a.country_code AS cc, b.name as ixp, c.id as id, o.name as org`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true, },
            { name: 'IXP', label: 'IXP (PeeringDB IXID)', align: 'left', field: row => row.get('id'), format: val => `${val}`, sortable: true, sort: (a, b) => parseInt(b, 10) - parseInt(a, 10), },
            { name: 'Name', label: 'Name', align: 'left', field: row => row.get('ixp'), format: val => `${val}`, sortable: true, },
          ]
        },

        // Prefixes
        prefixes: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(p:Prefix)
            OPTIONAL MATCH (p)<-[o:ORIGINATE {reference_org:'IHR'}]-(a:AS)
            OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
            OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
            OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
            OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
            OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
            RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix AS prefix, COLLECT(DISTINCT(t.label)) AS tags, COLLECT(DISTINCT o.descr) AS descr, COLLECT(DISTINCT o.visibility) AS visibility, COLLECT(DISTINCT a.asn) AS asns `,
          columns: [
            { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Geoloc. Country', label: 'Geoloc. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.get('asns'), format: val => `${val.join(', ')}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
            { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
            { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.get('visibility'), format: val => `${Number(val).toFixed(2)}%`, sortable: true },
          ],
        },

        // Atlas Probes
        atlas: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(atlas:AtlasProbe)-[loc:LOCATED_IN]-(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            RETURN atlas.id AS id, atlas.status_name AS status, 'IPv'+loc.af AS af, 'AS'+a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname`,
          columns: [
            { name: 'Probe ID', label: 'ID', align: 'left', field: row => row.get('id'), format: val => `${val}`, sortable: true },
            { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
            { name: 'ASN', label: 'AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
            { name: 'Status', label: 'Status', align: 'left', field: row => row.get('status'), format: val => `${val}`, sortable: true },
          ],
        },
      }
    }
  },
  created() {
    this.cc = this.$route.params.cc
  },
  async mounted() {},
  methods: {
    setPageTitle(title) {
      this.pageTitle = title
    },
    loadSection(key){

      // Don't do anything if already loaded
      if(!this.sections[key].loading){
        return
      }

      // Run the cypher query
      let query_params = { cc: this.cc }
      this.$iyp_api.run(this.sections[key].query, query_params).then(
        results => {

          this.sections[key].data = results.records

          // Post-processing for prefixes
          if ( key == 'prefixes' ){
            this.aggPrefixes = this.aggregatePrefixes(this.sections[key].data)
          }

          this.sections[key].loading = false
        }
      )
    },
    aggregatePrefixes( prefixData ){
      var asCount = {}

      prefixData.forEach( item => {
        item.get('asns').forEach( asn => {
          if(!asCount[asn]){
            asCount[asn] = {
              nbPrefixes:1,
              asn: 'AS'+asn,
              get(key) {
                return this[key]
              }
            }
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

          // re-load opened sections
          let keys = Object.keys(this.sections)
          keys.forEach( key => {
            if( !this.sections[key].loading ){
              this.sections[key].loading = true
              this.loadSection(key)
            }
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
