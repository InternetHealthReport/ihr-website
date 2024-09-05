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

const cc = ref(props.countryCode)
const atlas = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(atlas:AtlasProbe)-[loc:LOCATED_IN]-(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    RETURN atlas.id AS id, atlas.status_name AS status, 'IPv'+loc.af AS af, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname`,
  columns: [
    {
      name: 'Probe ID',
      label: 'ID',
      align: 'left',
      field: (row) => row.id,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Atlas identifier for this probe. (RIPE Atlas)'
    },
    {
      name: 'IP version',
      label: 'IP version',
      align: 'left',
      field: (row) => row.af,
      format: (val) => `${val}`,
      sortable: true,
      description: 'IP version used by the probe. (RIPE Atlas)'
    },
    {
      name: 'ASN',
      label: 'AS',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true,
      description: 'Autonomous System hosting the probe. (RIPE Atlas)'
    },
    {
      name: 'AS Name',
      label: 'AS Name',
      align: 'left',
      field: (row) => row.asname,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Name of the Autonomous System. (PeeringDB, BGP.Tools, RIPE NCC)'
    },
    {
      name: 'Status',
      label: 'Status',
      align: 'left',
      field: (row) => row.status,
      format: (val) => `${val}`,
      sortable: true,
      description: 'Status of the probe: Connected/Disconnected/Abandonned. (RIPE Atlas)'
    }
  ]
})

const load = () => {
  atlas.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  iyp_api.run([{ statement: atlas.value.query, parameters: query_params }]).then((results) => {
    atlas.value.data = results[0]
    atlas.value.loading = false
  })
}

watch(
  () => props.countryCode,
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
    :data="atlas.data"
    :columns="atlas.columns"
    :loading-status="atlas.loading"
    :cypher-query="atlas.query.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="atlas.data.length > 0"
      :chart-data="atlas.data"
      :chart-layout="{ title: 'RIPE Atlas probes per AS' }"
      :config="{
        keys: ['af', 'asn', 'status', 'id'],
        root: pageTitle,
        hovertemplate: '<b>%{label}</b><br>%{value} probes<extra></extra>'
      }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'atlasId' } })"
    />
  </IypGenericTable>
</template>
