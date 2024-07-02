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

const rankings = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(r:Ranking)-[rr:RANK]-(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    RETURN r.name AS rank_name, rr.rank AS rank, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, 1/(1+toFloat(rr.rank)) AS inv_rank`,
  columns: [
    { name: 'Ranking Name', label: 'ID', align: 'left', field: row => row.rank_name, format: val => `${val}`, sortable: true, description: 'Name of the ranking. Different rankings have different meanings, please see the page corresponding to each ranking for more details.'  },
    { name: 'Rank', label: 'Rank', align: 'left', field: row => Number(row.rank), format: val => `${val}`, sortable: true, description: 'Position in the ranking.'   },
    { name: 'ASN', label: 'AS', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true, description: 'Autonomous System.'    },
    { name: 'AS Name', label: 'Status', align: 'left', field: row => row.asname, format: val => `${val}`, sortable: true, description: 'Name of the Autonomous System. (PeeringDB, BGP.Tools, RIPE NCC)'  },
  ],
  pagination: {
    sortBy: 'Rank', //string column name
    ascending: true //boolean
  }
})

const load = () => {
  rankings.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  iyp_api.run([{statement: rankings.value.query, parameters: query_params}]).then(
    results => {
      rankings.value.data = results[0]
      rankings.value.loading = false
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
    :data="rankings.data"
    :columns="rankings.columns"
    :loading-status="rankings.loading"
    :cypher-query="countryCode ? rankings.query.replace(/\$(.*?)}/, `'${countryCode}'}`) : rankings.query"
    :pagination="rankings.pagination"
    :slot-length=1
  >
    <IypGenericTreemapChart
      v-if="rankings.data.length > 0"
      :chart-data="rankings.data"
      :config="{ keys: ['asn', 'rank_name'], keyValue: 'inv_rank', root: pageTitle, hovertemplate: '<b>%{customdata.asn} %{customdata.asname}</b> <br><br>%{customdata.rank_name}: #%{customdata.rank}<extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router, 'leafKey': 'rankName'}})"
    />
  </IypGenericTable>
</template>