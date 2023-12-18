<template>
  <div class="IYP_chart">
    <div v-if="loading > 0" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-8">
            <div class="row justify-between">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div v-if="this.queries[0].data.length > 0" class="q-ml-sm">
                  <p>{{ queries[0].data[0].get('as_count') }} registered ASes</p>
                  <p>{{ queries[0].data[0].get('preg_count') }} registered prefixes</p>
                  <p>{{ queries[0].data[0].get('pgeo_count') }} geolocated prefixes</p>
                  <p>{{ queries[0].data[0].get('ixp_count') }} Internet Exchange Points</p>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent ISPs</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.queries[1].data.length > 0" class="column">
                    <router-link :to="{ name: 'iyp_asn', params: { asn: item.get('asn')} }" v-for="item in queries[1].data" :key="Number(item.get('asn'))">
                      AS{{ item.get('asn') }} - {{ item.get('as_name') }}
                    </router-link>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent Hosting Providers</h3>
                <div class="column q-ml-sm">
                  <div v-if="this.queries[2].data.length > 0" class="column">
                    <router-link :to="{ name: 'iyp_asn', params: { asn: item.get('asn')} }" v-for="item in queries[2].data" :key="Number(item.get('asn'))">
                      AS{{ item.get('asn') }} - {{ item.get('as_name') }}
                    </router-link>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div class="column q-ml-sm">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="String(key)" target="_blank" rel="noreferrer">
                    {{ key }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

const references = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}


export default {
  props: {
    countryCode: {
      type: String,
      required: true,
    },
    title: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      references: references,
      loading: 3,
      queries: [
        {
          data: [],
          query: `MATCH (c:Country {country_code: $cc})
          OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(a:AS) WITH c, COUNT(DISTINCT a) as as_count
          OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "peeringdb.ix"}]-(i:IXP) WITH c, as_count, COUNT(DISTINCT i) as ixp_count
          OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(pd:Prefix) WITH c, as_count, ixp_count, COUNT(DISTINCT pd) as preg_count
          OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "ihr.rov"}]-(pg:Prefix) WITH c, as_count, ixp_count, preg_count, COUNT(DISTINCT pg) as pgeo_count
          RETURN c.name AS country_name, as_count, ixp_count, preg_count, pgeo_count `

        },
        {
          data: [],
          query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[rr:RANK]-(:Ranking)-[:COUNTRY]-(c)
          WHERE rr.rank < 10
          OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
          OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
          OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
          RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, SUM(10-rr.rank) AS nb_rankings
          ORDER BY nb_rankings DESC LIMIT 5`
        },
        {
          data: [],
          query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[:CATEGORIZED]-(:Tag {label:'Tranco 10k Host'}),
  (a)-[:ORIGINATE]-(:Prefix)-[:PART_OF]-(:IP)-[:RESOLVES_TO]-(d:DomainName)
          OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
          OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
          OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
          RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, COUNT(DISTINCT d) AS nb_domains
          ORDER BY nb_domains DESC LIMIT 5`
        }
      ]
    }
  },
  mounted() {
    this.fetchData(this.countryCode)
  },
  methods: {
    fetchData(cc) {

      let params = { cc: cc.toUpperCase() }
      let res = this.$iyp_api.runManyInParallel(this.queries, params)

      res[0].then( results => {
        this.queries[0].data = results.records
        if (this.title !== undefined) {
          this.title(this.queries[0].data[0].get('country_name'))
        }
        this.loading -= 1
      })

      res[1].then( results => {
        this.queries[1].data = results.records
        this.loading -= 1
      })

      res[2].then( results => {
        this.queries[2].data = results.records
        this.loading -= 1
      })
    },

    handleReference(key) {
      let externalLink = ''
      let cc = this.countryCode

      if (key === 'bgp.he.net') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'radar.cloudflare.com') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'stat.ripe.net') {
        externalLink = `${references[key]}/${cc}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
  },
  watch: {
    countryCode(newCC, oldCC) {
      this.loading = 3
      this.queries.forEach( query => {
        query.data = []
      })
      this.fetchData(newCC)
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
