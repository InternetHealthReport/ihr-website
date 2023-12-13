<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>

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
              <GenericTreemapChart
                v-if="sections.nameservers.data.length > 0"
                :chart-data="sections.nameservers.data"
                :config="{ keys: ['asn', 'nameserver', 'ip'], root: this.pageTitle, hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br><extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('ips')"
          :label="$t('iyp.domainnames.ips.title')"
          :caption="$t('iyp.domainnames.ips.caption')+this.pageTitle"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.ips.data"
              :columns="sections.ips.columns"
              :loading-status="sections.ips.loading"
              :cypher-query="sections.ips.query"
            >
              <GenericTreemapChart
                v-if="sections.ips.data.length > 0"
                :chart-data="sections.ips.data"
                :config="{ keys: ['asn', 'ip'], root: this.pageTitle, hovertemplate: '<b>%{label}<br>%{label}</b> <br><br><extra></extra>' }"
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
    GenericTreemapChart,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      pageTitle: 'Prefix - Loading..',
      sections: {

        // Rankings
        rankings: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:DomainName {name: $domain})-[rr:RANK]-(r:Ranking)
            RETURN r.name AS rank_name, rr.rank AS rank, 1/(1+toFloat(rr.rank)) AS inv_rank`,
          columns: [
            { name: 'Ranking Name', label: 'ID', align: 'left', field: row => row.get('rank_name'), format: val => `${val}`, sortable: true, description: 'Name of the ranking. Different rankings have different meanings, please see the page corresponding to each ranking for more details.'  },
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
            OPTIONAL MATCH (n)-[:RESOLVES_TO]->(i:IP)-[:PART_OF]-(:Prefix)-[:ORIGINATE]-(a:AS)
            RETURN  n.name as nameserver, split(n.name, '.')[-1] AS tld, i.ip AS ip, 'AS'+a.asn AS asn`,
          columns: [
            { name: 'TLD', label: 'TLD', align: 'left', field: row => row.get('tld'), format: val => `${val}`, sortable: true },
            { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.get('nameserver'), format: val => `${val}`, sortable: true },
            { name: 'IP', label: 'IP', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
            { name: 'Orig. AS', label: 'Orig. AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
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
            RETURN DISTINCT a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, i.ip as ip`,
          columns: [
            { name: 'IP address', label: 'IP address', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
            { name: 'Orig. AS', label: 'Orig. AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
            { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('asname'), format: val => `${val}`, sortable: true },
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
