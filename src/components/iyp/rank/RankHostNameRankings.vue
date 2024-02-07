<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['rank', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const rankings = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (d:DomainName)-[r:RANK]-(:Ranking {name: $rank})
    RETURN r.rank AS rank, d.name AS name
    ORDER BY rank
    LIMIT 10000`,
  columns: [
    { name: 'Rank', label: 'Rank', align: 'left', field: row => Number(row.get('rank')), format: val => `${val}`, sortable: true, description: 'Position in the ranking.'   },
    { name: 'Host Name', label: 'Host Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true, description: 'Host Name.'    },
  ],
  pagination: {
    sortBy: 'Rank', //string column name
    ascending: true //boolean
  }
})

const load = () => {
  rankings.value.loading = true
  // Run the cypher query
  let query_params = { rank: props.rank }
  iyp_api.run(rankings.value.query, query_params).then(results => {
    rankings.value.data = results.records
    rankings.value.loading = false
  })
}

watch(() => props.rank, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="rankings.data"
    :columns="rankings.columns"
    :loading-status="rankings.loading"
    :cypher-query="rank ? rankings.query.replace(/\$(.*?)}/, `'${rank}'}`) : rankings.query"
    :pagination="rankings.pagination"
  />
</template>