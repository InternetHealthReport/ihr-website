<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const roas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(p:RPKIPrefix)
    OPTIONAL MATCH (b:AS)-[:ORIGINATE]->(p)
    RETURN p.prefix AS prefix, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri, COLLECT(DISTINCT b.asn) AS bgp`,
  columns: [
    {
      name: 'Prefix',
      label: 'Prefix',
      align: 'left',
      field: (row) => row.prefix,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Max. Prefix Length',
      label: 'Max. Prefix Length',
      align: 'left',
      field: (row) => row.maxLength,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'NotBefore',
      label: 'NotBefore',
      align: 'left',
      field: (row) => row.notBefore,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'NotAfter',
      label: 'NotAfter',
      align: 'left',
      field: (row) => row.notAfter,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'URL',
      label: 'URL',
      align: 'left',
      field: (row) => row.uri,
      format: (val) => `${val}`,
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
  let query_params = { asn: props.asNumber }
  iyp_api.run([{ statement: roas.value.query, parameters: query_params }]).then((results) => {
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
  <IypController
    :data="roas.data"
    :columns="roas.columns"
    :loading-status="roas.loading"
    :cypher-query="roas.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="0"
  >
    <!--  <IypGenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
    range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/> -->
  </IypController>
</template>
