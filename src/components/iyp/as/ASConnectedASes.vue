<script setup>
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericPieChart from '@/components/charts/IypGenericPieChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import IypGenericIndicatorsChart from '@/components/charts/IypGenericIndicatorsChart.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/ASIypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const asn = ref(props.asNumber)
const peers = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(peer:AS)
    OPTIONAL MATCH (peer)-[:NAME]->(n:Name)
    OPTIONAL MATCH (peer)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
    RETURN c.country_code AS cc, peer.asn AS asn, head(collect(DISTINCT(n.name))) AS name`,
  columns: [
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  peers.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(peers.value.query, query_params).then(
    results => {
      peers.value.data = results.records
      peers.value.loading = false
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
    :data="peers.data"
    :columns="peers.columns"
    :loading-status="peers.loading"
    :cypher-query="peers.query.replace(/\$(.*?)}/, `${asn}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="peers.data.length > 0"
      :chart-data="peers.data"
      :config="{ keys: ['cc', 'asn'], root: props.pageTitle, show_percent: true, hovertemplate: '<b>%{label} %{customdata.name}</b><extra>%{customdata.percent:.1f}%</extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>