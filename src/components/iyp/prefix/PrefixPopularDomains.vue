<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()
const router = useRouter()

const domains = ref({
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
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run(domains.value.query, query_params).then(
    results => {
      domains.value.data = results.records
      domains.value.loading = false
    }
  )
}

watch(() => props.getPrefix, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="domains.data"
    :columns="domains.columns"
    :loading-status="domains.loading"
    :cypher-query="domains.query.replace(/\$(.*?)}/, `'${getPrefix}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="domains.data.length > 0"
      :chart-data="domains.data"
      :config="{ keys: ['tld', 'domain', 'ip'], keyValue: 'inv_rank', root: getPrefix, hovertemplate: '<b>%{customdata.get(`domain`)}<br>%{label}</b> <br><br>%{customdata.rankingName}: %{customdata.rank}<br>%{customdata.tags}<extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>