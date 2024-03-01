<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericPieChart from '@/components/charts/IypGenericPieChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const peeringLANs = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MANAGED_BY]-(s:Prefix)OPTIONAL MATCH (s)-[:COUNTRY]->(c:Country)
    RETURN s.prefix as prefix, c.country_code as cc`,
  columns: [
    { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  peeringLANs.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api.run([{statement: peeringLANs.value.query, parameters: query_params}]).then(
    results => {
      peeringLANs.value.data = results[0]
      peeringLANs.value.loading = false
    }
  )
}

watch(() => props.ixpNumber, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="peeringLANs.data"
    :columns="peeringLANs.columns"
    :loading-status="peeringLANs.loading"
    :cypher-query="peeringLANs.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="1"
  >
    <IypGenericPieChart
      v-if="peeringLANs.data.length > 0"
      :chart-data="peeringLANs.data"
      :chart-layout="{ title: 'Country' }"
    />
  </IypGenericTable>
</template>