<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const roas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[m:MANAGED_BY]-(p:Prefix)
    WHERE m.reference_org <> 'CAIDA'
    OPTIONAL MATCH (p)-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(a:AS)
    OPTIONAL MATCH (b:AS)-[:ORIGINATE]->(p)
    RETURN p.prefix AS prefix, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri, COLLECT(DISTINCT b.asn) AS bgp, a.asn AS asn`,
  columns: [
    {
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => (val ? `AS${val}` : '-'),
      sortable: true
    },
    {
      name: 'Prefix',
      label: 'Prefix',
      align: 'left',
      field: (row) => row.prefix,
      format: (val) => (val ? `${val}` : '-'),
      sortable: true
    },
    {
      name: 'Max. Prefix Length',
      label: 'Max. Prefix Length',
      align: 'left',
      field: (row) => row.maxLength,
      format: (val) => (val ? `${val}` : '-'),
      sortable: true
    },
    {
      name: 'NotBefore',
      label: 'NotBefore',
      align: 'left',
      field: (row) => row.notBefore,
      format: (val) => (val ? `${val}` : '-'),
      sortable: true
    },
    {
      name: 'NotAfter',
      label: 'NotAfter',
      align: 'left',
      field: (row) => row.notAfter,
      format: (val) => (val ? `${val}` : '-'),
      sortable: true
    },
    {
      name: 'URL',
      label: 'URL',
      align: 'left',
      field: (row) => row.uri,
      format: (val) => (val ? `${val}` : '-'),
      sortable: true
    },
    {
      name: 'Origin in BGP',
      label: 'Origin in BGP',
      align: 'left',
      field: (row) => row.bgp,
      format: (val) => (val.length ? `AS${val}` : '-'),
      sortable: true
    }
  ]
})

const load = () => {
  roas.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api.run([{ statement: roas.value.query, parameters: query_params }]).then((results) => {
    console.log(results[0])
    roas.value.data = results[0]
    roas.value.loading = false
  })
}

watch(
  () => props.asNumber,
  () => {
    load()
  }
)

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="roas.data"
    :columns="roas.columns"
    :loading-status="roas.loading"
    :cypher-query="roas.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="0"
  >
    <!--  <IypGenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
    range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/> -->
  </IypGenericTable>
</template>
