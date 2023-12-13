<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :host="host" :prefixLength="prefixLength" :title="setPageTitle" />

        <q-expansion-item
          @click="loadSection('domains')"
          :label="$t('iyp.prefix.popularDomains.title')"
          :caption="$t('iyp.prefix.popularDomains.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.domains.data"
              :columns="sections.domains.columns"
              :loading-status="sections.domains.loading"
              :cypher-query="sections.domains.query"
              :slot-length="1"
            >
              <GenericTreemapChart
                v-if="sections.domains.data.length > 0"
                :chart-data="sections.domains.data"
                :config="{ keys: ['tld', 'domain', 'ip'], keyValue: 'inv_rank', root: this.getPrefix(), hovertemplate: '<b>%{customdata.get(`domain`)}<br>%{label}</b> <br><br>%{customdata.rankingName}: %{customdata.rank}<br>%{customdata.tags}<extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('nameservers')"
          :label="$t('iyp.prefix.nameservers.title')"
          :caption="$t('iyp.prefix.nameservers.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.nameservers.data"
              :columns="sections.nameservers.columns"
              :loading-status="sections.nameservers.loading"
              :cypher-query="sections.nameservers.query"
              :slot-length="1"
            >
              <GenericTreemapChart
                v-if="sections.nameservers.data.length > 0"
                :chart-data="sections.nameservers.data"
                :config="{ keys: ['tld', 'nameserver', 'ip'], root: this.getPrefix(), hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br>Manage %{customdata.nb_domains} popular domains<extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('upstreams')"
          :label="$t('iyp.prefix.upstreams.title')"
          :caption="this.getPrefix()+' depends on these ASes'"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.upstreams.data"
              :columns="sections.upstreams.columns"
              :loading-status="sections.upstreams.loading"
              :cypher-query="sections.upstreams.query"
              :slot-length="1"
            >
            <GenericBarChart v-if="sections.upstreams.data.length > 0" :chart-data="sections.upstreams.data"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"}, range: [0,100],}}' :config="{key:'asn', groupKey: 'af', value:'hege' , xlabel_prefix:'AS'}"/>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('roas')"
          :label="$t('iyp.prefix.roas.title')"
          :caption="$t('iyp.prefix.roas.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.roas.data"
              :columns="sections.roas.columns"
              :loading-status="sections.roas.loading"
              :cypher-query="sections.roas.query"
              :slot-length="0"
            >
           <!--  <GenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
             range: [0,100],}}' :config="{key:'asn', value:'hege' , xlabel_prefix:'AS'}"/> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('lessSpecifics')"
          :label="$t('iyp.prefix.lessSpecific.title')"
          :caption="$t('iyp.prefix.lessSpecific.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.lessSpecifics.data"
              :columns="sections.lessSpecifics.columns"
              :loading-status="sections.lessSpecifics.loading"
              :cypher-query="sections.lessSpecifics.query"
            >
            <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('moreSpecifics')"
          :label="$t('iyp.prefix.moreSpecific.title')"
          :caption="$t('iyp.prefix.moreSpecific.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.moreSpecifics.data"
              :columns="sections.moreSpecifics.columns"
              :loading-status="sections.moreSpecifics.loading"
              :cypher-query="sections.moreSpecifics.query"
            >
            <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/PrefixOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'


export default {
  components: {
    Overview,
    GenericTable,
    GenericBarChart,
    GenericTreemapChart,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      pageTitle: 'Prefix - Loading..',
      sections: {

        domains: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(d:DomainName)
            OPTIONAL MATCH (d)-[:CATEGORIZED]->(t:Tag)
            OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
            RETURN COLLECT(DISTINCT i.ip) AS ip, d.name as domain, collect(DISTINCT t.label) as tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, 1/toFloat(ra.rank) AS inv_rank, rn.name as rankingName`
          ,
          columns: [
            { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.get('rank')?Number(row.get('rank')): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
            { name: 'TLD', label: 'TLD', align: 'left', field: row => row.get('tld'), format: val => `${val}`, sortable: true },
            { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.get('domain'), format: val => `${val}`, sortable: true },
            { name: 'IP', label: 'IP', align: 'left', field: row => row.get('ip'), format: val => `${val.join(', ')}`, sortable: true },
            { name: 'Tags', label: 'Domain Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
          ]
        },

        nameservers: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(n:AuthoritativeNameServer)
            OPTIONAL MATCH (n)<-[:MANAGED_BY]-(d:DomainName)
            RETURN COLLECT(DISTINCT i.ip) AS ip, n.name as nameserver, split(n.name, '.')[-1] AS tld, COUNT(DISTINCT d.name) AS nb_domains`,
          columns: [
            { name: 'TLD', label: 'TLD', align: 'left', field: row => row.get('tld'), format: val => `${val}`, sortable: true },
            { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.get('nameserver'), format: val => `${val}`, sortable: true },
            { name: 'Domain', label: 'Nb. Popular Domain Names', align: 'left', field: row => row.get('nb_domains'), format: val => `${val}`, sortable: true },
            { name: 'IP', label: 'IP', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
          ]
        },

        upstreams: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})-[dep:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name)
            OPTIONAL MATCH (a)-[:COUNTRY {reference_org:'NRO'}]-(c:Country)
            RETURN DISTINCT a.asn AS asn, head(collect(c.country_code)) AS cc, head(collect(DISTINCT(n.name))) AS name, 100*dep.hege AS hege `,
          columns: [
            { name: 'Reg. Country', label: 'Reg. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true, description: 'Country code of the organization for which the ASN is registered for. (Delegated Stat.)' },
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
          ]
        },

        roas: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(a:AS)
            RETURN a.asn AS asn, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri`,
          columns: [
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Prefix Length', label: 'Prefix Length', align: 'left', field: row => row.get('maxLength'), format: val => `${val}`, sortable: true },
            { name: 'NotBefore', label: 'NotBefore', align: 'left', field: row => row.get('notBefore'), format: val => `${val}`, sortable: true },
            { name: 'NotAfter', label: 'NotAfter', align: 'left', field: row => row.get('notAfter'), format: val => `${val}`, sortable: true },
            { name: 'URL', label: 'URL', align: 'right', field: row => row.get('uri'), format: val => `${val}`, sortable: true },
          ]
        },

        lessSpecifics: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})-[:PART_OF*]->(x:Prefix)
            WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0'
            OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
            OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
            OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
            OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
            OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
            OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
            RETURN c.country_code AS cc, x.prefix as prefix, collect(DISTINCT a.asn) as asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility`,
          columns: [
            { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
            { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
            { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.get('visibility'), format: val => `${Number(val).toFixed(2)}%`, sortable: true },
          ]
        },

        moreSpecifics: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF*]-(x:Prefix)
            WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0'
            OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
            OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
            OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
            OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
            OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
            OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
            RETURN c.country_code AS cc, x.prefix as prefix, collect(DISTINCT a.asn) as asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility`,
          columns: [
            { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true },
            { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
            { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
            { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
            { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.get('visibility'), format: val => `${Number(val).toFixed(2)}%`, sortable: true },
          ]
        },
      },
    }
  },
  created() {
    this.host = this.$route.params.host
    this.prefixLength = this.$route.params.prefix_length
  },
  async mounted() {},
  methods: {
    setPageTitle(title) {
      this.pageTitle = `${this.getPrefix()} ${title}`
    },
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
    },
    loadSection(key){

      // Don't do anything if already loaded
      if(!this.sections[key].loading){
        return
      }

      // Run the cypher query
      let query_params = { prefix: this.getPrefix() }
      this.$iyp_api.run(this.sections[key].query, query_params).then(
        results => {
          this.sections[key].data = results.records
          this.sections[key].loading = false
        }
      )
    },
  },
  watch: {
    '$route.params': {
      handler: async function (params) {
        if (params.host != this.host || params.prefixLength != this.prefixLength) {
          this.host = this.$route.params.host
          this.prefixLength = this.$route.params.prefix_length

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
