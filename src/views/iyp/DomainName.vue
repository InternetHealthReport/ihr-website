<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <!-- Overview: IPv4, IPv6 addresses, RPKI, # Nameservers? -->
    <div>
      <q-list>

        <q-expansion-item
          @click="loadSection('ips')"
          :label="$t('iyp.domainname.ips.title')"
          :caption="$t('iyp.domainname.ips.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.ips.data"
              :columns="sections.ips.columns"
              :loading-status="sections.ips.loading"
              :cypher-query="sections.ips.query"
              :slot-length="1"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <GenericBarChart v-if="sections.ips.data.length > 0" :chart-data="sections.ips.data" :config="{key:'tags'}" :chart-layout="{ title: 'Prefix Tags' }" />
                </div>
                <div class="col-8">
                  <GenericTreemapChart
                    v-if="sections.ips.data.length > 0"
                    :chart-data="sections.ips.data"
                    :config="{ keys: ['asn', 'prefix', 'ip'], root: this.pageTitle, hovertemplate: '<b>%{label}<br>%{value}</b> <br><br><extra></extra>' }"
                  />
                </div>
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('nameservers')"
          :label="$t('iyp.domainname.nameservers.title')"
          :caption="$t('iyp.domainname.nameservers.caption')+this.pageTitle"
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
              <div class="row justify-evenly">
                <div class="col-4">
                  <GenericBarChart v-if="sections.nameservers.data.length > 0" :chart-data="sections.nameservers.data" :config="{key:'tags'}" :chart-layout="{ title: 'Prefix Tags' }" />
                </div>
                <div class="col-8">
                  <GenericTreemapChart
                    v-if="sections.nameservers.data.length > 0"
                    :chart-data="sections.nameservers.data"
                    :config="{ keys: ['asn', 'prefix', 'ip', 'nameserver'], root: this.pageTitle, hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br><extra></extra>' }"
                  />
                </div>
              </div>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('country_query')"
          :label="$t('iyp.domainname.country_query.title')"
          :caption="$t('iyp.domainname.country_query.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.country_query.data"
              :columns="sections.country_query.columns"
              :loading-status="sections.country_query.loading"
              :cypher-query="sections.country_query.query"
              :slot-length="1"
              :pagination="sections.as_query.pagination"
            >
              <GenericTreemapChart
                v-if="sections.country_query.data.length > 0"
                :chart-data="sections.country_query.data"
                :config="{ keys: ['name'], keyValue: 'perc', root: this.pageTitle, hovertemplate: '<b>%{label}<br>%{value}%</b> <br><br><extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('as_query')"
          :label="$t('iyp.domainname.as_query.title')"
          :caption="$t('iyp.domainname.as_query.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.as_query.data"
              :columns="sections.as_query.columns"
              :loading-status="sections.as_query.loading"
              :cypher-query="sections.as_query.query"
              :slot-length="1"
              :pagination="sections.as_query.pagination"
            >
              <GenericTreemapChart
                v-if="sections.as_query.data.length > 0"
                :chart-data="sections.as_query.data"
                :config="{ keys: ['name'], keyValue: 'perc', root: this.pageTitle, hovertemplate: '<b>%{label}<br>%{value}%</b> <br><br><extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('rankings')"
          :label="$t('iyp.domainname.rankings.title')"
          :caption="$t('iyp.domainname.rankings.caption')+this.pageTitle"
          header-class="IHR_charts-title"
          v-model="sections.rankings.show"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.rankings.data"
              :columns="sections.rankings.columns"
              :loading-status="sections.rankings.loading"
              :cypher-query="sections.rankings.query"
              :pagination="sections.rankings.pagination"
            >
            </GenericTable>
          </q-card>
        </q-expansion-item>


      </q-list>
    </div>
  </div>
</template>

<script>
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'


export default {
  components: {
    GenericTable,
    GenericBarChart,
    GenericTreemapChart,
  },
  data() {
    return {
      domainName: null,
      pageTitle: 'Loading domain name...',
      sections: {

        // Rankings
        rankings: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[rr:RANK]-(r:Ranking)
            RETURN r.name AS rank_name, rr.rank AS rank, 1/(1+toFloat(rr.rank)) AS inv_rank`,
          columns: [
            { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.get('rank_name'), format: val => `${val}`, sortable: true, description: 'Name of the ranking. Different rankings have different meanings, please see the page corresponding to each ranking for more details.'  },
            { name: 'Rank', label: 'Rank', align: 'left', field: row => Number(row.get('rank')), format: val => `${val}`, sortable: true, description: 'Position in the ranking.'   },
          ],
          pagination: {
            sortBy: 'Rank', //string column name
            ascending: true //boolean
          }
        },

        nameservers: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[:MANAGED_BY]-(n:AuthoritativeNameServer)
            OPTIONAL MATCH (n)-[:RESOLVES_TO]->(i:IP)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
            OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
            RETURN  DISTINCT i.ip AS ip, n.name as nameserver, 'AS'+a.asn AS asn, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
          columns: [
            { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.get('nameserver'), format: val => `${val}`, sortable: true },
            { name: 'IP', label: 'IP', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
            { name: 'Prefix Tags', label: 'Prefix Tags', align: 'left', field: row => row.get('tags'), format: val => `${val}`, sortable: true },
            { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
          ]
        },

        ips: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[:RESOLVES_TO]-(i:IP)
            OPTIONAL MATCH (i)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
            RETURN DISTINCT 'AS'+a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, i.ip as ip, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
          columns: [
            { name: 'IP address', label: 'IP address', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
            { name: 'Prefix Tags', label: 'Prefix Tags', align: 'left', field: row => row.get('tags'), format: val => `${val}`, sortable: true },
            { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
            { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('asname'), format: val => `${val}`, sortable: true },
          ]
        },

        country_query: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[q:QUERIED_FROM]->(c:Country)
            RETURN  c.country_code AS cc, c.name AS name, q.value AS perc`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Country', label: 'Country', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
            { name: 'Percentage of DNS queries', label: 'Percentage of DNS queries', align: 'left', field: row => Number(row.get('perc')), format: val => `${val.toFixed(2)}`, sortable: true, description: 'Percentage of DNS queries received by Cloudflare\'s open resolver in the country. (Cloudflare Radar)' },
          ],
          pagination: {
            sortBy: 'Percentage of DNS queries', //string column name
            descending: true //boolean
          }
        },

        as_query: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[q:QUERIED_FROM]->(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            RETURN  a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, q.value AS perc`,
          columns: [
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
            { name: 'AS Name', label: 'AS Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
            { name: 'Percentage of DNS queries', label: 'Percentage of DNS queries', align: 'left', field: row => Number(row.get('perc')), format: val => `${val.toFixed(2)}`, sortable: true, description: 'Percentage of DNS queries received by Cloudflare\'s open resolver in the country. (Cloudflare Radar)' },
          ],
          pagination: {
            sortBy: 'Percentage of DNS queries', //string column name
            descending: true //boolean
          }
        },

      },
    }
  },
  created() {
    this.domainName = this.$route.params.domain
    this.pageTitle = this.domainName
  },
  methods: {
    loadSection(key){

      // Don't do anything if already loaded
      if(!this.sections[key].loading){
        return
      }

      // Run the cypher query
      let query_params = { domain: this.domainName }
      this.$iyp_api.run(this.sections[key].query, query_params).then(
        results => {
          this.sections[key].data = results.records
          this.sections[key].loading = false
        }
      )
    },
  },
  watch: {
    '$route.params.domain': {
      handler: function (newDomain) {
        if ( newDomain != this.domainName ) {
          this.domainName = newDomain
          this.pageTitle = this.domainName

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
