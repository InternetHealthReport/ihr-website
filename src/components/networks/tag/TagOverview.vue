<script setup>
import { QSpinner } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'

const iyp_api = inject('iyp_api')

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad'
}

const props = defineProps({
  tag: {
    type: String,
    required: true
  }
})

const references = ref(REFERENCES)
const loading = ref(1)
const queries = ref([
  {
    data: [],
    query: `MATCH (t:Tag {label: $tag})
      OPTIONAL MATCH (t)<-[cat_a:CATEGORIZED]-(a:AS) WITH t, count(DISTINCT a) as nb_ases, COLLECT(DISTINCT cat_a.reference_org) as data_source_ases
      OPTIONAL MATCH (t)<-[cat_p:CATEGORIZED]-(p:Prefix) WITH t, nb_ases, data_source_ases, count(DISTINCT p) as nb_prefixes, COLLECT(DISTINCT cat_p.reference_org) as data_source_prefixes
      OPTIONAL MATCH (t)<-[cat_d:CATEGORIZED]-(:URL)-[:PART_OF]-(d:HostName) WITH t, nb_ases, data_source_ases, nb_prefixes, data_source_prefixes, count(DISTINCT d) as nb_hostnames, COLLECT(DISTINCT cat_d.reference_org) as data_source_domains
      RETURN  nb_hostnames, nb_ases, nb_prefixes, data_source_ases, data_source_domains, data_source_prefixes`
  }
])

const fetchData = async (tag) => {
  let params = { tag: tag }
  iyp_api.run([{ statement: queries.value[0].query, parameters: params }]).then((results) => {
    queries.value[0].data = results[0]
    loading.value -= 1
  })
}

const allSources = (res) => {
  return [
    ...new Set([...res.data_source_ases, ...res.data_source_domains, ...res.data_source_prefixes])
  ]
}

watch(
  () => props.tag,
  () => {
    loading.value = 1
    queries.value.forEach((query) => {
      query.data = []
    })
    fetchData(props.tag)
  }
)

onMounted(() => {
  fetchData(props.tag)
})
</script>

<template>
  <div class="IYP_chart">
    <div v-if="loading > 0" class="IYP_loading-spinner">
      <QSpinner color="secondary" size="3em" />
    </div>
    <div v-else class="row justify-center">
      <div class="col-4">
        <h3>Summary</h3>
        <p class="text-center">Data Sources: {{ allSources(queries[0].data[0]).join(', ') }}</p>
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
