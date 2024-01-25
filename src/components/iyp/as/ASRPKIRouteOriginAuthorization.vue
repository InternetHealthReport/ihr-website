<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const asn = ref(props.asNumber)
const roas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(p:Prefix)
    OPTIONAL MATCH (b:AS)-[:ORIGINATE]->(p)
    RETURN p.prefix AS prefix, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri, COLLECT(DISTINCT b.asn) AS bgp`,
  columns: [
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
    { name: 'Max. Prefix Length', label: 'Max. Prefix Length', align: 'left', field: row => row.get('maxLength'), format: val => `${val}`, sortable: true },
    { name: 'NotBefore', label: 'NotBefore', align: 'left', field: row => row.get('notBefore'), format: val => `${val}`, sortable: true },
    { name: 'NotAfter', label: 'NotAfter', align: 'left', field: row => row.get('notAfter'), format: val => `${val}`, sortable: true },
    { name: 'URL', label: 'URL', align: 'left', field: row => row.get('uri'), format: val => `${val}`, sortable: true },
    { name: 'Origin in BGP', label: 'Origin in BGP', align: 'left', field: row => row.get('bgp'), format: val => val.length?`AS${val}`:'-', sortable: true },
  ]
})

const load = () => {
  roas.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(roas.value.query, query_params).then(
    results => {
      roas.value.data = results.records
      roas.value.loading = false
    }
  )
}

watch(() => route.params.id, () => {
  const newAsn = Number(route.params.id.replace('AS',''))
  if (newAsn != asn.value) {
    asn.value = newAsn
    load()
  }
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="roas.data"
    :columns="roas.columns"
    :loading-status="roas.loading"
    :cypher-query="roas.query.replace(/\$(.*?)}/, `${asn}`)"
    :slot-length="0"
  >
    <!--  <IypGenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
    range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/> -->
  </IypGenericTable>
</template>