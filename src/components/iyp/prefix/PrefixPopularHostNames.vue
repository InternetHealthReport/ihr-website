<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()
const router = useRouter()

const domains = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:BGPPrefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(h:HostName & !AuthoritativeNameServer)-[:PART_OF]-(d:DomainName)-[ra:RANK {reference_name:'tranco.top1m'}]->(rn:Ranking)
    OPTIONAL MATCH (h)<-[:PART_OF]-(p)-[:CATEGORIZED]->(t:Tag)
    RETURN h.name as hostName, COLLECT(DISTINCT i.ip) AS ip, collect(DISTINCT t.label) as tags, ra.rank AS rank, split(h.name, '.')[-1] AS tld, 1/toFloat(ra.rank) AS inv_rank, rn.name as rankingName
    ORDER BY rank`,
  columns: [
    {
      name: 'Tranco Rank',
      label: 'Tranco Rank',
      align: 'left',
      field: (row) => (row.rank ? Number(row.rank) : 1000001),
      format: (val) => (val != 1000001 ? val : '-'),
      sortable: true,
      sortOrder: 'ad'
    },
    {
      name: 'TLD',
      label: 'TLD',
      align: 'left',
      field: (row) => row.tld,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Hostname',
      label: 'Hostname',
      align: 'left',
      field: (row) => row.hostName,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IP',
      label: 'IP',
      align: 'left',
      field: (row) => row.ip,
      format: (val) => `${val.join(', ')}`,
      sortable: true
    }
  ]
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run([{ statement: domains.value.query, parameters: query_params }]).then((results) => {
    domains.value.data = results[0]
    domains.value.loading = false
  })
}

watch(
  () => props.getPrefix,
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
    :data="domains.data"
    :columns="domains.columns"
    :loading-status="domains.loading"
    :cypher-query="domains.query.replace(/\$(.*?)}/, `'${getPrefix}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="domains.data.length > 0"
      :chart-data="domains.data"
      :config="{
        keys: ['tld', 'hostName', 'ip'],
        keyValue: 'inv_rank',
        root: getPrefix,
        hovertemplate:
          '<b>%{customdata.domain}<br>%{label}</b> <br><br>%{customdata.rankingName}: %{customdata.rank}<br>%{customdata.tags}<extra></extra>'
      }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'ip' } })"
    />
  </IypController>
</template>
