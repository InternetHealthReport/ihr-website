<script setup>
import { QChip, QSpinner } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'

const iyp_api = inject('iyp_api')

const props  = defineProps({
  asNumber: {
    type: Number,
    required: true,
  },
  asName: {
    type: String,
    required: false,
  },
  peeringdbId: {
    type: Function,
    required: false,
  },
  external: {
    type: Boolean,
    required: false,
    default: false,
  }
})

const route = useRoute()

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net',
  'bgp.tools': 'https://bgp.tools/as',
  'peeringdb.com': 'https://www.peeringdb.com/net',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}

const queries = ref([
  {
    data: [],
    query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p4:Prefix {af:4})
      WITH COALESCE(COUNT(DISTINCT p4.prefix), 0) AS prefixes_v4, a
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p6:Prefix {af:6})
      WITH COALESCE(COUNT(DISTINCT p6.prefix), 0) AS prefixes_v6, prefixes_v4, a
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:NAME]->(n:Name)
      OPTIONAL MATCH (a)-[:WEBSITE]->(u:URL)
      OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:COUNTRY]-(ixp_country:Country)
      OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      OPTIONAL MATCH (a)-[:CATEGORIZED]->(t:Tag)
      RETURN u.url AS website, c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, collect(DISTINCT(t.label)) as tags, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country `
  },
  {
    data: [],
    query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:PEERS_WITH]-(b:AS)
      OPTIONAL MATCH (a)-[:EXTERNAL_ID]->(p:PeeringdbNetID)
      OPTIONAL MATCH (a)-[r:RANK]->(s:Ranking)
      WHERE r.rank < 10
      RETURN COUNT(DISTINCT b.asn) AS peers, p.id AS peeringdbNetId, r.rank AS rank, s.name AS ranking_name ORDER BY rank LIMIT 1`
  },
  {
    data: [],
    query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(h:HostName)-[:PART_OF]-(:DomainName)-[rr:RANK]->(rn:Ranking)
      WHERE rr.reference_name = "tranco.top1M"
      RETURN DISTINCT h.name AS hostname, rr.rank AS rank
      ORDER BY rank LIMIT 5`
  }
])
const loading = ref(3)
const references = ref(REFERENCES)
const pdbid = ref(null)

const fetchData = async (asn) => {
  let params = { asn: asn }
  let res = await iyp_api.run(queries.value.map(obj => ({statement: obj.query, parameters: params})))

  queries.value[0].data = res[0]
  loading.value -= 1
  queries.value[1].data = res[1]
  pdbid.value = queries.value[1].peeringdbNetId
  loading.value -= 1
  queries.value[2].data = res[2]
  loading.value -= 1
}

const formatRank = (rank, name) => {
  let arr = []
  arr.push({
    rank,
    name,
  })
  return arr
}

const handleReference = (key) => {
  let externalLink = ''
  let asn = props.asNumber

  if (key === 'bgp.he.net') {
    externalLink = `${references.value[key]}/AS${asn}`
  } else if (key === 'bgp.tools') {
    externalLink = `${references.value[key]}/${asn}`
  } else if (key === 'peeringdb.com') {
    externalLink = `${references.value[key]}/${pdbid.value}`
  } else if (key === 'radar.cloudflare.com') {
    externalLink = `${references.value[key]}/AS${asn}`
  } else if (key === 'stat.ripe.net') {
    externalLink = `${references.value[key]}/AS${asn}`
  } else {
    console.log('none')
    return
  }
  return externalLink
}

watch(() => props.asNumber, () => {
  loading.value = 3
  queries.value.forEach( query => {
    query.data = []
  })
  fetchData(props.asNumber)
})

onMounted(() => {
  fetchData(props.asNumber)
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
                  <p>Registered in <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: {cc: queries[0].data[0].cc } })"> {{ queries[0].data[0].country }} </RouterLink></p>
                  <p>Member of <RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([14])}), hash: '#ixps'})">{{ queries[0].data[0].nb_ixp }} IXPs in {{ queries[0].data[0].nb_country }} Countries</RouterLink></p>
                  <p><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([8])}), hash: '#originated-prefixes'})">{{ queries[0].data[0].prefixes_v4 }} IPv4 and {{ queries[0].data[0].prefixes_v6 }} IPv6 Originated Prefixes</RouterLink></p>
                  <p v-if="queries[1].data.length > 0"><RouterLink :to="Tr.i18nRoute({replace: true, query: Object.assign({}, route.query, {active: 'custom', display: JSON.stringify([9])}), hash: '#connected-ases'})">{{ queries[1].data[0].peers }} Connected ASes</RouterLink></p>
                  <p>
                    Website: <a :href="queries[0].data[0].website" target="_blank" rel="noopener noreferrer">{{ queries[0].data[0].website}}</a>
                  </p>
                </div>
              </div>
              <div v-if="queries[1].data.length > 0" class="col-12 col-md-auto">
                <h3>Ranking</h3>
                <div class="q-ml-sm">
                  <div>{{ queries[1].data[0].ranking_name }}</div>
                  <div class="text-h2 text-center">{{ queries[1].data[0].rank }}</div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>Popular Host Names</h3>
                <div class="column q-ml-sm">
                  <div v-if="queries[2].data.length > 0" class="column">
                    <RouterLink :to="Tr.i18nRoute({ name: 'hostnames', params: {hostName:item.hostname}})" v-for="item in queries[2].data" :key="item.hostname">
                      {{ item.hostname }}
                    </RouterLink>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div class="column q-ml-sm">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="key" target="_blank" rel="noreferrer">
                    {{ key }}
                  </a>
                </div>
              </div>
            </div>

            <div class="row">
              <div  v-if="queries[0].data.length > 0" class="q-mt-md">
                <h3>Tags</h3>
                <RouterLink v-for="tag in queries[0].data[0].tags" :key="tag" :to="Tr.i18nRoute({ name: 'tags', params: {tag: tag}})">
                  <QChip dense size="md" color="info" text-color="white">{{ tag }}</QChip>
                </RouterLink>
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