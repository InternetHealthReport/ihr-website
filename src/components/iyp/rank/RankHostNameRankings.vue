<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['rank', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const rankings = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (h:HostName)-[:PART_OF]-(:DomainName)-[r:RANK]-(:Ranking {name: $rank})
    RETURN DISTINCT r.rank AS rank, h.name AS name
    ORDER BY rank
    LIMIT 100000`,
  columns: [
    {
      name: 'Rank',
      label: 'Rank',
      align: 'left',
      field: (row) => Number(row.rank),
      format: (val) => `${val}`,
      sortable: true,
      description: 'Position in the ranking.'
    },
    {
      name: 'Hostname',
      label: 'Hostname',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Hostname.'
    }
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
  iyp_api.run([{ statement: rankings.value.query, parameters: query_params }]).then((results) => {
    rankings.value.data = results[0]
    rankings.value.loading = false
  })
}

watch(
  () => props.rank,
  () => {
    load()
  }
)

onMounted(() => {
  load()
})
</script>

<template>
  <IypController
    :data="rankings.data"
    :columns="rankings.columns"
    :loading-status="rankings.loading"
    :cypher-query="rank ? rankings.query.replace(/\$(.*?)}/, `'${rank}'}`) : rankings.query"
    :pagination="rankings.pagination"
  />
</template>
