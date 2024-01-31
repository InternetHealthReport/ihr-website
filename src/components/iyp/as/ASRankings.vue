<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericIndicatorsChart from '@/components/charts/IypGenericIndicatorsChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const rankings = ref({
  data: [],
  show: false,
  loading: true,
  query: 'MATCH (:AS {asn: $asn})-[r:RANK]->(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank',
  columns: [
    { name: 'Rank', label: 'Rank', align: 'left', field: row => row.get('rank'), format: val => `${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  rankings.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run(rankings.value.query, query_params).then(
    results => {
      rankings.value.data = results.records
      rankings.value.loading = false
    }
  )
}

watch(() => props.asNumber, () => {
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
    :cypher-query="rankings.query.replace(/\$(.*?)}/, `${asNumber}`)"
    :slot-length="1"
  >
    <IypGenericIndicatorsChart
      v-if="rankings.data.length > 0" :chart-data="rankings.data"
    />
  </IypGenericTable>
</template>