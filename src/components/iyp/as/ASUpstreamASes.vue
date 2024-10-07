<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

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
    {
      name: 'IP version',
      label: 'IP version',
      align: 'left',
      field: (row) => row.af,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Country',
      label: 'Country',
      align: 'left',
      field: (row) => row.cc,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true
    },
    {
      name: 'Name',
      label: 'Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Hegemony Score',
      label: 'Hegemony Score',
      align: 'left',
      field: (row) => row.hegemony_score,
      format: (val) => `${Number(val).toFixed(2)}%`,
      sortable: true
    }
  ]
})

const load = () => {
  upstreams.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{ statement: upstreams.value.query, parameters: query_params }]).then((results) => {
    upstreams.value.data = results[0]
    upstreams.value.loading = false
  })
}

watch(
  () => props.asNumber,
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
    :data="upstreams.data"
    :columns="upstreams.columns"
    :loading-status="upstreams.loading"
    :cypher-query="upstreams.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="1"
  >
    <IypGenericBarChart
      v-if="upstreams.data.length > 0"
      :chart-data="upstreams.data"
      :chart-layout="{ yaxis: { title: { text: 'AS Hegemony (%)' }, range: [0, 100] } }"
      :config="{ key: 'asn', groupKey: 'af', value: 'hegemony_score', xlabel_prefix: 'AS' }"
    />
    <!--  <IypGenericTreemapChart
      v-if="dependings.length > 0"
      :chart-data="dependings"
      :chart-layout="{ title: 'Dependings' }"
      :config="{ keys: ['cc', 'asn'], keyValue: 'hegemony_score', root: this.asn, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
      /> -->
  </IypGenericTable>
</template>
