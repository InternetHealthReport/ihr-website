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
  show: true,
  loading: true,
  query: 'MATCH (:AS {asn: $asn})-[r:RANK]->(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank',
  columns: [
    { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  rankings.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{statement: rankings.value.query, parameters: query_params}]).then(
    results => {
      rankings.value.data = results[0]
      rankings.value.loading = false
      results[0].sort((a, b) => a.rank - b.rank)
      if (results[0].length == 1) {
        if (results[0][0].rank > 100) {
          rankings.value.show = false
        }
      } else if (results[0].length == 2) {
        if (results[0][0].rank > 100 && results[0][1].rank > 100) {
          rankings.value.show = false
        }
      } else {
        if (results[0][0].rank > 100 && results[0][1].rank > 100 && results[0][2].rank > 100) {
          rankings.value.show = false
        }
      }
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
    :cypher-query="rankings.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="rankings.show ? 1 : 0"
  >
    <IypGenericIndicatorsChart
      v-if="rankings.data.length > 0 && rankings.show" :chart-data="rankings.data"
    />
  </IypGenericTable>
</template>