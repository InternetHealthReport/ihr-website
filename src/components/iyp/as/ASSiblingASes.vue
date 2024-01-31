<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const siblings = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[:SIBLING_OF]-(sibling:AS)
    OPTIONAL MATCH (sibling)-[:COUNTRY {reference_org:'NRO'}]->(c)
    OPTIONAL MATCH (sibling)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (sibling)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (sibling)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    RETURN DISTINCT sibling.asn AS asn, c.country_code AS cc, COALESCE(pdbn.name, btn.name, ripen.name) AS name`,
  columns: [
    { name: 'Country', label: 'Reg. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  siblings.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run(siblings.value.query, query_params).then(
    results => {
      siblings.value.data = results.records
      siblings.value.loading = false
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
    :data="siblings.data"
    :columns="siblings.columns"
    :loading-status="siblings.loading"
    :cypher-query="siblings.query.replace(/\$(.*?)}/, `${asNumber}`)"
  />
</template>