<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericPieChart from '@/components/charts/IypGenericPieChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const members = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MEMBER_OF]-(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (a)-[:COUNTRY {reference_org: 'NRO'}]->(c:Country)
    RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name`,
  columns: [
    { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  members.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api.run([{statement: members.value.query, parameters: query_params}]).then(
    results => {
      members.value.data = results[0]
      members.value.loading = false
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
    :data="members.data"
    :columns="members.columns"
    :loading-status="members.loading"
    :cypher-query="members.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="1"
  >
    <IypGenericPieChart
      v-if="members.data.length > 0"
      :chart-data="members.data"
      :chart-layout="{ title: 'Country' }"
    />
  </IypGenericTable>
</template>