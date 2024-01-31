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

const atlas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (atlas:AtlasProbe)-[loc:LOCATED_IN]->(a:AS {asn: $asn})
    OPTIONAL MATCH (atlas)-[:COUNTRY]-(cc:Country)
    CALL{
      WITH atlas, loc
      WITH atlas, loc
      WHERE loc.af = 4
      RETURN atlas.prefix_v4 AS prefix

      UNION
      WITH atlas, loc
      WITH atlas, loc
      WHERE loc.af = 6
      RETURN atlas.prefix_v6 AS prefix

    }
    RETURN atlas.id AS id, atlas.status_name AS status, 'IPv'+loc.af AS af, cc.country_code as cc, prefix`,
  columns: [
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'Probe ID', label: 'ID', align: 'left', field: row => row.get('id'), format: val => `${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
    { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
    { name: 'Status', label: 'Status', align: 'left', field: row => row.get('status'), format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  atlas.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run(atlas.value.query, query_params).then(
    results => {
      atlas.value.data = results.records
      atlas.value.loading = false
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
      :data="atlas.data"
      :columns="atlas.columns"
      :loading-status="atlas.loading"
      :cypher-query="atlas.query.replace(/\$(.*?)}/, `${asNumber}`)"
      :slot-length="1"
    >
      <IypGenericTreemapChart
        v-if="atlas.data.length > 0"
        :chart-data="atlas.data"
        :chart-layout="{ title: 'RIPE Atlas probes per prefix' }"
        :config="{ keys: ['af', 'prefix', 'id'],  root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} probes<extra></extra>' }"
        @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
        />
    </IypGenericTable>
</template>