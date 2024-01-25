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
const upstreams = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[d:DEPENDS_ON]->(b:AS)
    WHERE a.asn <> b.asn
    OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
    RETURN DISTINCT b.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS cc, 100*d.hege AS hegemony_score, 'IPv'+d.af AS af`,
  columns: [
    { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
    { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    { name: 'Hegemony Score', label: 'Hegemony Score', align: 'left', field: row => row.get('hegemony_score'), format: val => `${Number(val).toFixed(2)}%`, sortable: true, },
  ]
})

const load = () => {
  upstreams.value.loading = true
  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(upstreams.value.query, query_params).then(
    results => {
      upstreams.value.data = results.records
      upstreams.value.loading = false
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
    :data="upstreams.data"
    :columns="upstreams.columns"
    :loading-status="upstreams.loading"
    :cypher-query="upstreams.query.replace(/\$(.*?)}/, `'${asn}'`)"
    :slot-length="1"
  >
    <IypGenericBarChart
      v-if="upstreams.data.length > 0"
      :chart-data="upstreams.data"
      :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"}, range: [0,100],}}'
      :config="{key:'asn', groupKey:'af', value:'hegemony_score' , xlabel_prefix:'AS'}"
    />
    <!--  <IypGenericTreemapChart
      v-if="dependings.length > 0"
      :chart-data="dependings"
      :chart-layout="{ title: 'Dependings' }"
      :config="{ keys: ['cc', 'asn'], keyValue: 'hegemony_score', root: this.asn, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
      /> -->
  </IypGenericTable>
</template>