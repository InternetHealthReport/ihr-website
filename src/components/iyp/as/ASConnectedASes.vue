<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const peers = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(peer:AS)
    OPTIONAL MATCH (peer)-[:NAME]->(n:Name)
    OPTIONAL MATCH (peer)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
    RETURN c.country_code AS cc, peer.asn AS asn, head(collect(DISTINCT(n.name))) AS name`,
  columns: [
    {
      name: 'Country',
      label: 'Country',
      align: 'left',
      field: (row) => row.cc,
      format: (val) => `${val}`,
      sortable: true,
      sortOrder: 'ad'
    },
    {
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true
    },
    {
      name: 'Name',
      label: 'Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const load = () => {
  peers.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{ statement: peers.value.query, parameters: query_params }]).then((results) => {
    peers.value.data = results[0]
    peers.value.loading = false
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
    :data="peers.data"
    :columns="peers.columns"
    :loading-status="peers.loading"
    :cypher-query="peers.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="peers.data.length > 0"
      :chart-data="peers.data"
      :config="{
        keys: ['cc', 'asn'],
        root: props.pageTitle,
        show_percent: true,
        hovertemplate: '<b>%{label} %{customdata.name}</b><extra>%{customdata.percent:.1f}%</extra>'
      }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'asn' } })"
    />
  </IypGenericTable>
</template>
