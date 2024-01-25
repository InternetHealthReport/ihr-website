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
const domains = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(p:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
    WHERE rr.rank < 100000 and rn.name = 'Tranco top 1M'
    RETURN DISTINCT d.name AS domainName, rr.rank AS rank, rn.name AS rankingName, split(d.name, '.')[-1] AS tld, 1/toFloat(rr.rank) AS inv_rank, COLLECT(DISTINCT p.prefix) AS prefix
    ORDER BY rank`,
  columns: [
    { name: 'Rank', label: 'Rank', align: 'left', field: row => row.get('rank'), format: val => `${val}`, sortable: true },
    { name: 'Domain Name', label: 'Domain Name', align: 'left', field: row => row.get('domainName'), format: val => `${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val.join(', ')}`, sortable: true },
    { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.get('rankingName'), format: val => `${val}`, sortable: true, },
  ]
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(domains.value.query, query_params).then(
    results => {
      domains.value.data = results.records
      domains.value.loading = false
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
    :data="domains.data"
    :columns="domains.columns"
    :loading-status="domains.loading"
    :cypher-query="domains.query.replace(/\$(.*?)}/, `${asn}`)"
    :slot-length="1"
  >
<!--      <GenericHoverEventsChart
      v-if="popularDomains.length > 0"
      :chart-data="popularDomains"
      :chart-layout="{ title: 'Popular Domains' }"
      /> -->
    <IypGenericTreemapChart
      v-if="domains.data.length > 0"
      :chart-data="domains.data"
      :config="{ keys: ['tld', 'domainName'], keyValue: 'inv_rank', root: pageTitle, textinfo: 'label', hovertemplate: '<b>%{label}</b> <br><br>%{customdata.rankingName}: #%{customdata.rank}<extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>