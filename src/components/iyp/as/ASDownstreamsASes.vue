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

const asn = ref(props.asNumber)
const downstreams = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})<-[d:DEPENDS_ON]-(b:AS)
    WHERE a.asn <> b.asn
    OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
    OPTIONAL MATCH (b)-[:CATEGORIZED]->(t:Tag)
    RETURN DISTINCT b.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS cc, 100*d.hege AS hegemony_score, collect(DISTINCT t.label) AS tags, 'IPv'+d.af AS af`,
  columns: [
    { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    { name: 'Hegemony Score', label: 'Hegemony Score', align: 'left', field: row => row.get('hegemony_score'), format: val => `${Number(val).toFixed(2)}%`, sortable: true, },
    { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
  ]
})

const load = () => {
  downstreams.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(downstreams.value.query, query_params).then(
    results => {
      downstreams.value.data = results.records
      downstreams.value.loading = false
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
    :data="downstreams.data"
    :columns="downstreams.columns"
    :loading-status="downstreams.loading"
    :cypher-query="downstreams.query.replace(/\$(.*?)}/, `${asn}`)"
    :slot-length="1"
  >
    <div class="col-6">
      <IypGenericTreemapChart
        v-if="downstreams.data.length > 0"
        :chart-data="downstreams.data"
        :chart-layout="{ title: '' }"
        :config="{ keys: ['af', 'cc', 'asn'], keyValue: 'hegemony_score', root: pageTitle, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
        @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
      />
    </div>
  </IypGenericTable>
</template>