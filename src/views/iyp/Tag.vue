<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">Tag: {{ tag }}</h1>
    <div v-if="sections.nodes.loading" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
   <div v-else class="row justify-center">
      <div class='col-4'>
        <h2 class="text-center">Data Sources: {{ allSources(sections.nodes.data[0]).join(', ') }}</h2>
      </div>
   </div>
    <div>
      <q-list>
        <q-expansion-item
          v-if='sections.domains.show'
          @click="loadSection('domains')"
          :label="sections.nodes.data[0].get('nb_domains')+' '+$t('iyp.tag.popularDomains.title')"
          :caption="$t('iyp.tag.popularDomains.caption')+this.tag+' by '+sections.nodes.data[0].get('data_source_domains').join(', ')"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.domains.data"
              :columns="sections.domains.columns"
              :loading-status="sections.domains.loading"
              :cypher-query="sections.domains.query"
              :slot-length="0"
            >
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          v-if='sections.ases.show'
          @click="loadSection('ases')"
          :label="sections.nodes.data[0].get('nb_ases')+' '+$t('iyp.tag.ases.title')"
          :caption="$t('iyp.tag.ases.caption')+this.tag+' by '+sections.nodes.data[0].get('data_source_ases').join(', ')"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.ases.data"
              :columns="sections.ases.columns"
              :loading-status="sections.ases.loading"
              :cypher-query="sections.ases.query"
              :slot-length="1"
            >
                <GenericTreemapChart
                  v-if="sections.ases.data.length > 0 & sections.ases.data.length < 5000"
                  :chart-data="sections.ases.data"
                  :chart-layout="{ title: 'Breakdown per RIR and registered country' }"
                  :config="{ keys: ['rir', 'cc', 'asn'], root: this.tag, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<extra>%{customdata.__percent:.1f}%</extra>' }"
                 />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
            v-if='sections.prefixes.show'
          @click="loadSection('prefixes')"
          :label="sections.nodes.data[0].get('nb_prefixes')+' '+$t('iyp.tag.prefixes.title')"
          :caption="$t('iyp.tag.prefixes.caption')+this.tag+' by '+sections.nodes.data[0].get('data_source_prefixes').join(', ')"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.prefixes.data"
              :columns="sections.prefixes.columns"
              :loading-status="sections.prefixes.loading"
              :cypher-query="sections.prefixes.query"
              :slot-length="1"
            >
                <GenericTreemapChart
                  v-if="sections.prefixes.data.length > 0 & sections.prefixes.data.length < 5000"
                  :chart-data="sections.prefixes.data"
                  :chart-layout="{ title: 'Breakdown per origin AS and registered country code' }"
                  :config="{ keys: ['as_cc', 'asn', 'prefix'], root: this.tag, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.descr}<extra>%{customdata.__percent:.1f}%</extra>' }"
                 />
            </GenericTable>
          </q-card>
        </q-expansion-item>

      </q-list>
    </div>
  </div>
</template>

<script>
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'


export default {
  components: {
    GenericTable,
    GenericTreemapChart
  },
  data() {
    return {
      tag: null,
      sections:{

        nodes: {
          data: [],
          loading: true,
          query: `MATCH (t:Tag {label: $tag})
            OPTIONAL MATCH (t)<-[cat_a:CATEGORIZED]-(a:AS) WITH t, count(DISTINCT a) as nb_ases, COLLECT(DISTINCT cat_a.reference_org) as data_source_ases
            OPTIONAL MATCH (t)<-[cat_p:CATEGORIZED]-(p:Prefix) WITH t, nb_ases, data_source_ases, count(DISTINCT p) as nb_prefixes, COLLECT(DISTINCT cat_p.reference_org) as data_source_prefixes
            OPTIONAL MATCH (t)<-[cat_d:CATEGORIZED]-(d:DomainName) WITH t, nb_ases, data_source_ases, nb_prefixes, data_source_prefixes, count(DISTINCT d) as nb_domains, COLLECT(DISTINCT cat_d.reference_org) as data_source_domains
            RETURN  nb_domains, nb_ases, nb_prefixes, data_source_ases, data_source_domains, data_source_prefixes`,
        },

        domains: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(d:DomainName)
            OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
            OPTIONAL MATCH (d)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
            RETURN d.name AS domain, collect(DISTINCT to.label) AS other_tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, rn.name AS rankingName, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
          columns: [
            { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.get('classifier_org'), row.get('classifier_name')], format: val => `${val[0]} (${val[1]})`, sortable: true },
            { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.get('rank')?Number(row.get('rank')): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
            { name: 'TLD', label: 'TLD', align: 'left', field: row => row.get('tld'), format: val => `${val}`, sortable: true },
            { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.get('domainName'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.get('other_tags'), format: val => `${val.join(', ')}`, sortable: true },
          ]
        },

        ases: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(a:AS)
            OPTIONAL MATCH (a)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(n:Name)
            OPTIONAL MATCH (a)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
            RETURN a.asn as asn, n.name as name, collect(DISTINCT to.label) as other_tags, toUpper(COALESCE(creg.registry,  '-')) AS rir, creg_country.country_code AS cc, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
          columns: [
            { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.get('classifier_org'), row.get('classifier_name')], format: val => `${val[0]} (${val[1]})`, sortable: true },
            { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('cc'), format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.get('other_tags'), format: val => `${val.join(', ')}`, sortable: true },
          ]
        },

        prefixes: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(p:Prefix)
            OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
            OPTIONAL MATCH (a)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
            OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
            OPTIONAL MATCH (p)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
            RETURN p.prefix as prefix, collect(DISTINCT to.label) as other_tags, c.country_code AS cc, creg_country.country_code as as_cc, collect(DISTINCT a.asn) as asn, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
          columns: [
            { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.get('classifier_org'), row.get('classifier_name')], format: val => `${val[0]} (${val[1]})`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
            { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val.join(', AS')}`, sortable: true },
            { name: 'Reg. Country', label: 'AS Reg. Country ', align: 'left', field: row => row.get('as_cc'), format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
            { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.get('other_tags'), format: val => `${val.join(', ')}`, sortable: true },
          ]
        },
      },
    }
  },
  created() {
    this.tag = this.$route.params.tag
  },
  mounted() {
    this.loadSection('nodes')
  },
  methods: {
    allSources( res ) {

      return [...new Set([...res.get('data_source_ases'), ...res.get('data_source_domains'), ...res.get('data_source_prefixes')])]

    },
    loadSection(key){

      // Don't do anything if already loaded
      if(!this.sections[key].loading){
        return
      }

      // Run the cypher query
      let query_params = { tag: this.tag }
      this.$iyp_api.run(this.sections[key].query, query_params).then(
        results => {
          this.sections[key].data = results.records
          this.sections[key].loading = false
        }
      )
    },
  },
  watch: {
    'sections.nodes.data': {
      handler: function () {
        this.sections.domains.show = this.sections.nodes.data[0].get('nb_domains') > 0
        this.sections.ases.show = this.sections.nodes.data[0].get('nb_ases') > 0
        this.sections.prefixes.show = this.sections.nodes.data[0].get('nb_prefixes') > 0
      }
    },
    '$route.params': {
      handler: function (params) {
        if (params.tag != this.tag) {
          this.tag = this.$route.params.tag

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
