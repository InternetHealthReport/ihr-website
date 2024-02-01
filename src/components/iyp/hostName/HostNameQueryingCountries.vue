<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'hostName'])

const route = useRoute()
const router = useRouter()

const country_query = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:DomainName {name: $domain})-[q:QUERIED_FROM]->(c:Country)
    RETURN  c.country_code AS cc, c.name AS name, q.value AS perc`,
  columns: [
    { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    { name: 'Percentage of DNS queries', label: 'Percentage of DNS queries', align: 'left', field: row => Number(row.get('perc')), format: val => `${val.toFixed(2)}`, sortable: true, description: 'Percentage of DNS queries received by Cloudflare\'s open resolver in the country. (Cloudflare Radar)' },
  ],
  pagination: {
    sortBy: 'Percentage of DNS queries', //string column name
    descending: true //boolean
  }
})

const load = () => {
  country_query.value.loading = true
  // Run the cypher query
  let query_params = { domain: props.hostName }
  iyp_api.run(country_query.value.query, query_params).then(
    results => {
      country_query.value.data = results.records
      country_query.value.loading = false
    }
  )
}

watch(() => props.hostName, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="country_query.data"
    :columns="country_query.columns"
    :loading-status="country_query.loading"
    :cypher-query="country_query.query.replace(/\$(.*?)}/, `'${hostName}'`)"
    :slot-length="1"
    :pagination="country_query.pagination"
  >
    <IypGenericTreemapChart
      v-if="country_query.data.length > 0"
      :chart-data="country_query.data"
      :config="{ keys: ['cc'], keyValue: 'perc', root: pageTitle, hovertemplate: '<b>%{label}<br>%{value}%</b> <br><br><extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>