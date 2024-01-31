<script setup>
import { QChip, QSpinner } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/net',
  'bgp.tools': 'https://bgp.tools/prefix',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}

const props = defineProps({
  host: {
    type: String,
    required: true,
  },
  prefixLength: {
    type: Number,
    required: true,
  },
  external: {
    type: Boolean,
    required: false,
    default: false,
  },
  title: {
    type: Function,
    required: false,
  }
})

const loading = ref(2)
const references = ref(REFERENCES)
const queries = ref([
  {
    data: [],
    query: `MATCH (p:Prefix {prefix: $prefix})
      OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH(p)-[deleg:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, collect(DISTINCT([toString(a.asn), COALESCE(pdbn.name, btn.name, ripen.name)])) AS asn, c.name AS country, collect(DISTINCT(t.label)) AS tags, deleg.registry AS rir, c.country_code AS cc`
  },
  {
    data: [],
    query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)
      OPTIONAL MATCH (d)-[ra:RANK]->(:Ranking {name: 'Tranco top 1M'})
      RETURN  DISTINCT d.name as domain, ra.rank AS rank ORDER BY rank LIMIT 5`
  }
])

const fetchData = () => {
  let params = { prefix: getPrefix() }
  let res = iyp_api.runManyInParallel(queries.value, params)

  res[0].then( results => {
    queries.value[0].data = results.records
    if (props.title !== undefined) {
      props.title('- '+queries.value[0].data[0].get('descr'))
    }
    loading.value -= 1
  })

  res[1].then( results => {
    queries.value[1].data = results.records
    loading.value -= 1
  })
}

const getPrefix = () => {
  return `${props.host}/${props.prefixLength}`
}

const handleReference = (key) => {
  let externalLink = ''
  if (key === 'bgp.he.net') {
    externalLink = `${references.value[key]}/${props.host}/${props.prefixLength}`
  } else if (key === 'bgp.tools') {
    externalLink = `${references.value[key]}/${props.host}/${props.prefixLength}`
  } else if (key === 'stat.ripe.net') {
    externalLink = `${references.value[key]}/${props.host}/${props.prefixLength}`
  } else {
    console.log('none')
    return
  }
  return externalLink
}

watch(() => props.host, () => {
  loading.value = 3
  queries.value.forEach( query => {
    query.data = []
  })
  fetchData()
})

watch(() => props.prefixLength, () => {
  loading.value = 3
  queries.value.forEach( query => {
    query.data = []
  })
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="IYP_chart">
    <div v-if="loading > 3" class="IYP_loading-spinner">
      <QSpinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <!-- <h2 class="q-mb-sm">Overview</h2> -->
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-10">
            <div class="row justify-evenly">
              <div class="col-12 col-md-auto">
                <h3>Summary</h3>
                <div v-if="queries[0].data.length > 0" class="q-ml-sm">
                  <p v-if="queries[0].data[0].get('country')">
                    Registered in
                    <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: {cc:queries[0].data[0].get('cc') } })">{{ queries[0].data[0].get('country') }}</RouterLink>
                    ({{ queries[0].data[0].get('rir').toUpperCase() }})
                  </p>
                  <div v-if="queries[0].data[0].get('asn')[0][0]">
                    <p>Originated by:</p>
                      <div v-for="item in queries[0].data[0].get('asn')" :key='item[0]' target="_blank">
                        <RouterLink :to="Tr.i18nRoute({ name:'networks', params:{ id:`AS${item[0]}` } })">
                        AS{{ item[0] }} {{ item[1] }}
                        </RouterLink>
                      </div>
                  </div>
                  <div v-else>
                    <p>Prefix Not Announced on BGP</p>
                  </div>
                </div>
              </div>
              <div class="col-12 col-md-auto">
                <h3>Popular Domains</h3>
                <div  v-if="queries[1].data.length > 0" class="q-ml-sm column">
                  <RouterLink :to="Tr.i18nRoute({ name: 'domains', params: {domain:item.get('domain')}})" v-for="item in queries[1].data" :key="item.get('domain')">
                    {{ item.get('domain') }}
                  </RouterLink>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>External Links</h3>
                <div  class="q-ml-sm column">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="value" target="_blank" rel="noreferrer">
                    {{ key }}
                  </a>
                </div>
              </div>
            </div>
            <div class="row">
              <div v-if="queries[0].data.length > 0" class="q-mt-md">
                <h3>Tags</h3>
                <RouterLink v-for="tag in queries[0].data[0].get('tags')" :key="tag" :to="Tr.i18nRoute({ name: 'tags', params: {tag: tag}})">
                  <QChip dense size="md" color="info" text-color="white">{{ tag }}</QChip>
                </RouterLink>
              </div>
            </div>

            <div class="row">
              <RouterLink v-if="external" :to="Tr.i18nRoute( {name: 'networks', params: { id: props.host, length: props.prefixLength } })" class="q-mt-lg overview-footer">
                View more details on IYP for Prefix {{ getPrefix() }}
              </RouterLink>
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
</style>