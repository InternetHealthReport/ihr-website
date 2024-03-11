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

const domains = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(p:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(h:HostName & !AuthoritativeNameServer)-[:PART_OF]->(d:DomainName)-[rr:RANK]->(rn:Ranking)
    WHERE rr.rank < 100000 and rr.reference_name = 'tranco.top1m'
    RETURN DISTINCT h.name AS hostName, rr.rank AS rank, rn.name AS rankingName, split(h.name, '.')[-1] AS tld, 1/toFloat(rr.rank) AS inv_rank, COLLECT(DISTINCT p.prefix) AS prefix
    ORDER BY rank`,
  columns: [
    { name: 'Rank', label: 'Rank', align: 'left', field: row => row.rank, format: val => `${val}`, sortable: true },
    { name: 'Hostname', label: 'Hostname', align: 'left', field: row => row.hostName, format: val => `${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val.join(', ')}`, sortable: true },
    { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.rankingName, format: val => `${val}`, sortable: true, },
  ]
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{statement: domains.value.query, parameters: query_params}]).then(
    results => {
      domains.value.data = results[0]
      domains.value.loading = false
    }
  )
}

watch(() => props.asNumber, () => {
  load()
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
    :cypher-query="domains.query.replace(/\$(.*?)}/, `${asNumber}}`)"
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
      :config="{ keys: ['tld', 'hostName'], keyValue: 'inv_rank', root: pageTitle, textinfo: 'label', hovertemplate: '<b>%{label}</b> <br><br>%{customdata.rankingName}: #%{customdata.rank}<extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>