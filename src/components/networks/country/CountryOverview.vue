<script setup>
import { QSpinner, QMarkupTable } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import '@/styles/chart.css'

const iyp_api = inject('iyp_api')

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad'
}

const props = defineProps({
  countryCode: {
    type: String,
    required: true
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
      RETURN c.name AS country_name, as_count, ixp_count, preg_count, pgeo_count`
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
    query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[ca:CATEGORIZED]-(:Tag {label:'Tranco 10k Host'}),
      (a)-[:ORIGINATE]-(:Prefix)-[:PART_OF]-(:IP)-[re:RESOLVES_TO {reference_name:'openintel.tranco1m'}]-(d:HostName)
      USING INDEX re:RESOLVES_TO(reference_name)
      WITH a, COUNT(DISTINCT d) AS nb_domains ORDER BY nb_domains DESC LIMIT 5
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, nb_domains`
  }
])

const fetchData = async (cc) => {
  let params = { cc: cc.toUpperCase() }
  iyp_api.run([{ statement: queries.value[0].query, parameters: params }]).then((results) => {
    queries.value[0].data = results[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[1].query, parameters: params }]).then((results) => {
    queries.value[1].data = results[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[2].query, parameters: params }]).then((results) => {
    queries.value[2].data = results[0]
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

watch(
  () => props.countryCode,
  () => {
    loading.value = 3
    queries.value.forEach((query) => {
      query.data = []
    })
    fetchData(props.countryCode)
  }
)

onMounted(() => {
  fetchData(props.countryCode)
})
</script>

<template>
  <div>
    <QMarkupTable separator="horizontal">
      <div v-if="loading > 0" class="IHR_loading-spinner">
        <QSpinner color="secondary" size="15em" />
      </div>
      <thead>
        <tr>
          <th class="text-left">Summary</th>
          <th class="text-left">Prominent ISPs</th>
          <th class="text-left">Prominent Hosting Providers</th>
          <th class="text-left">External Links</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-left">
            <div v-if="queries[0].data.length > 0">
              <div>
                {{ queries[0].data[0].as_count }} registered
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#Autonomous-Systems'
                    })
                  "
                  >ASes</RouterLink
                >
              </div>
              <div>
                {{ queries[0].data[0].preg_count }} registered
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#IP-Prefixes'
                    })
                  "
                  >prefixes</RouterLink
                >
              </div>
              <div>
                {{ queries[0].data[0].pgeo_count }} geolocated
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#IP-Prefixes'
                    })
                  "
                  >prefixes</RouterLink
                >
              </div>
              <div>
                {{ queries[0].data[0].ixp_count }}
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#Internet-Exchange-Points'
                    })
                  "
                  >Internet Exchange Points</RouterLink
                >
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[1].data.length > 0">
              <div v-for="item in queries[1].data" :key="Number(item.asn)">
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${item.asn}` } })"
                >
                  AS{{ item.asn }} - {{ item.as_name }}
                </RouterLink>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[2].data.length > 0">
              <div v-for="item in queries[2].data" :key="Number(item.asn)">
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${item.asn}` } })"
                >
                  AS{{ item.asn }} - {{ item.as_name }}
                </RouterLink>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[0].data.length > 0">
              <div v-for="(value, key) in references" :key="key">
                <a :href="handleReference(key)" target="_blank" rel="noreferrer">
                  {{ key }}
                </a>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </QMarkupTable>
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
