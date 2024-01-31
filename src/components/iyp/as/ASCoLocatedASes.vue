<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import { lo } from 'plotly.js-dist';

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const cofacilities = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (n:AS {asn: $asn})-[:LOCATED_IN]->(f:Facility)<-[:LOCATED_IN]-(p:AS)
    MATCH (n)-[:PEERS_WITH]-(p)
    RETURN p.asn as asn, collect(DISTINCT f.name) as name`,
  columns: [
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Facilities', label: 'Facilities', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  cofacilities.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run(cofacilities.value.query, query_params).then(
    results => {
      cofacilities.value.data = results.records
      cofacilities.value.loading = false
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
    :data="cofacilities.data"
    :columns="cofacilities.columns"
    :loading-status="cofacilities.loading"
    :cypher-query="cofacilities.query.replace(/\$(.*?)}/, `${asNumber}`)"
  />
</template>