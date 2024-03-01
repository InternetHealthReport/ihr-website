<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ases = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'nro.delegated_stats'}]-(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (a)-[r:RANK {reference_org:'CAIDA'}]->(:Ranking {name:'CAIDA ASRank'})
    RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, r['asnDegree:total'] AS degree`,
  columns: [
    { name: 'ASN', label: 'ASN', align: 'left', field: row => Number(row.asn), format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
    { name: 'Connected networks', label: 'Connected networks', align: 'left', field: row => Number(row.degree), format: val => `${val}`, sortable: true },
  ],
  pagination: {
    sortBy: 'Connected networks', //string column name
    descending: true //boolean
  }
})

const load = () => {
  ases.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  iyp_api.run([{statement: ases.value.query, parameters: query_params}]).then(
    results => {
      ases.value.data = results[0]
      ases.value.loading = false
    }
  )
}

watch(() => props.countryCode, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="ases.data"
    :columns="ases.columns"
    :loading-status="ases.loading"
    :cypher-query="ases.query.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :pagination="ases.pagination"
  />
</template>