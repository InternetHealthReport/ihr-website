<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()

const roas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:Prefix {prefix: $prefix})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(a:AS)
    RETURN a.asn AS asn, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri`,
  columns: [
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Prefix Length', label: 'Prefix Length', align: 'left', field: row => row.get('maxLength'), format: val => `${val}`, sortable: true },
    { name: 'NotBefore', label: 'NotBefore', align: 'left', field: row => row.get('notBefore'), format: val => `${val}`, sortable: true },
    { name: 'NotAfter', label: 'NotAfter', align: 'left', field: row => row.get('notAfter'), format: val => `${val}`, sortable: true },
    { name: 'URL', label: 'URL', align: 'right', field: row => row.get('uri'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  roas.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run(roas.value.query, query_params).then(
    results => {
      roas.value.data = results.records
      roas.value.loading = false
    }
  )
}

watch(() => props.getPrefix, () => {
  load()
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
    :cypher-query="roas.query.replace(/\$(.*?)}/, `'${getPrefix}'`)"
    :slot-length="0"
  >
  <!--  <IypGenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
    range: [0,100],}}' :config="{key:'asn', value:'hege' , xlabel_prefix:'AS'}"/> -->
  </IypGenericTable>
</template>