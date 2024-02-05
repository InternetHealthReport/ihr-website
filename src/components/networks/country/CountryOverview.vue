<script setup>
import { QSpinner } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'

const iyp_api = inject('iyp_api')

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}

const props = defineProps({
  countryCode: {
    type: String,
    required: true,
  }
})

const route = useRoute()

const references = ref(REFERENCES)
const loading = ref(3)
const queries = ref([
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
])

const fetchData = (cc) => {
  let params = { cc: cc.toUpperCase() }
  let res = iyp_api.runManyInParallel(queries.value, params)

  res[0].then( results => {
    queries.value[0].data = results.records
    loading.value -= 1
  })

  res[1].then( results => {
    queries.value[1].data = results.records
    loading.value -= 1
  })

  res[2].then( results => {
    queries.value[2].data = results.records
    loading.value -= 1
  })
}

const handleReference = (key) => {
  let externalLink = ''
  let cc = props.countryCode

  if (key === 'bgp.he.net') {
    externalLink = `${references.value[key]}/${cc}`
  } else if (key === 'radar.cloudflare.com') {
    externalLink = `${references.value[key]}/${cc}`
  } else if (key === 'stat.ripe.net') {
    externalLink = `${references.value[key]}/${cc}`
  } else {
    console.log('none')
    return
  }
  return externalLink
}

watch(() => props.countryCode, () => {
  loading.value = 3
  queries.value.forEach(query => {
    query.data = []
  })
  fetchData(props.countryCode)
})

onMounted(() => {
  fetchData(props.countryCode)
})
</script>

<template>
  <div class="IYP_chart">
    <div v-if="loading > 0" class="IYP_loading-spinner">
      <QSpinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-10">
            <div class="row justify-between">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div v-if="queries[0].data.length > 0" class="q-ml-sm">
                  <p><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([6])}), hash: '#autonomous-systems'})">{{ queries[0].data[0].get('as_count') }} registered ASes</RouterLink></p>
                  <p><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([7])}), hash: '#ip-prefixes'})">{{ queries[0].data[0].get('preg_count') }} registered prefixes</RouterLink></p>
                  <p><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([7])}), hash: '#ip-prefixes'})">{{ queries[0].data[0].get('pgeo_count') }} geolocated prefixes</RouterLink></p>
                  <p><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([8])}), hash: '#internet-exchange-points'})">{{ queries[0].data[0].get('ixp_count') }} Internet Exchange Points</RouterLink></p>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent ISPs</h3>
                <div class="column q-ml-sm">
                  <div v-if="queries[1].data.length > 0" class="column">
                    <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: `AS${item.get('asn')}`} })" v-for="item in queries[1].data" :key="Number(item.get('asn'))">
                      AS{{ item.get('asn') }} - {{ item.get('as_name') }}
                    </RouterLink>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Prominent Hosting Providers</h3>
                <div class="column q-ml-sm">
                  <div v-if="queries[2].data.length > 0" class="column">
                    <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: `AS${item.get('asn')}`} })" v-for="item in queries[2].data" :key="Number(item.get('asn'))">
                      AS{{ item.get('asn') }} - {{ item.get('as_name') }}
                    </RouterLink>
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

<style lang="stylus">
p {
  font-size: 1rem;
  margin-bottom: 0;
}
h3 {
  font-size: 1rem;
  line-height: 1.5
}
.overview-footer {
  text-decoration: underline;
  cursor: pointer;
  width: 100%;
  text-align: right;
}
</style>