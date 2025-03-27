<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'hostName'])

const route = useRoute()
const router = useRouter()

const as_query = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:HostName {name: $hostname})-[:PART_OF]-(:DomainName)-[q:QUERIED_FROM]->(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    RETURN DISTINCT a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, q.value AS perc`,
  columns: [
    {
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'AS Name',
      label: 'AS Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Percentage of DNS queries',
      label: 'Percentage of DNS queries',
      align: 'left',
      field: (row) => Number(row.perc),
      format: (val) => `${val.toFixed(2)}`,
      sortable: true,
      description:
        "Percentage of DNS queries received by Cloudflare's open resolver in the country. (Cloudflare Radar)"
    }
  ],
  pagination: {
    sortBy: 'Percentage of DNS queries', //string column name
    descending: true //boolean
  }
})

const load = () => {
  as_query.value.loading = true
  // Run the cypher query
  let query_params = { hostname: props.hostName }
  iyp_api.run([{ statement: as_query.value.query, parameters: query_params }]).then((results) => {
    as_query.value.data = results[0]
    as_query.value.loading = false
  })
}

watch(
  () => props.hostName,
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
    :data="as_query.data"
    :columns="as_query.columns"
    :loading-status="as_query.loading"
    :cypher-query="as_query.query.replace(/\$(.*?)}/, `'${hostName}'}`)"
    :slot-length="1"
    :pagination="as_query.pagination"
  >
    <IypGenericTreemapChart
      v-if="as_query.data.length > 0"
      :chart-data="as_query.data"
      :config="{
        keys: ['asn'],
        keyValue: 'perc',
        root: pageTitle,
        hovertemplate: '<b>%{customdata.name}<br>%{value}%</b> <br><br><extra></extra>'
      }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'asn' } })"
    />
  </IypController>
</template>
