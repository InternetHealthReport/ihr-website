<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['rank', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const rankings = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS)-[r:RANK]->(:Ranking {name: $rank})
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    RETURN r.rank AS rank, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname
    ORDER BY rank`,
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
      name: 'ASN',
      label: 'AS',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true,
      description: 'Autonomous System.'
    },
    {
      name: 'AS Name',
      label: 'Status',
      align: 'left',
      field: (row) => row.asname,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Name of the Autonomous System. (PeeringDB, BGP.Tools, RIPE NCC)'
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
