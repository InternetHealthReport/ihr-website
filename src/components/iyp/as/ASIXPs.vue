<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/ASIypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const asn = ref(props.asNumber)
const ixps = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[:MEMBER_OF]->(i:IXP)-[:EXTERNAL_ID]->(p:PeeringdbIXID)
    OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
    RETURN c.country_code as cc, i.name as name, p.id as id`,
  columns: [
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'IXP', label: 'IXP Name', align: 'left', field: row => row.get('name'), format: val => `${val}` },
    { name: 'PeeringDB ID', label: 'PeeringDB ID', align: 'left', field: row => row.get('id'), format: val => `${val}` },
  ]
})

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(ixps.value.query, query_params).then(
    results => {
      ixps.value.data = results.records
      ixps.value.loading = false
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
    :data="ixps.data"
    :columns="ixps.columns"
    :loading-status="ixps.loading"
    :cypher-query="ixps.query.replace(/\$(.*?)}/, `${asn}`)"
    :slot-length="2"
  >
    <IypGenericTreemapChart v-if="ixps.data.length > 0"
      :chart-data="ixps.data"
      :config="{ keys: ['cc', 'name'],  keyValue: '', root: pageTitle, show_percent: true }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>