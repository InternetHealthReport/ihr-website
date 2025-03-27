<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericRadarChart from '@/components/charts/IypGenericRadarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()

const rankings = ref({
  data: [],
  show: true,
  loading: true,
  query: `MATCH (:AS {asn: $asn})-[r:RANK]->(s:Ranking)
    RETURN r.rank AS rank, s.name AS name ORDER BY rank`,
  columns: [
    {
      name: 'Rank',
      label: 'Rank',
      align: 'left',
      field: (row) => row.rank,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Name',
      label: 'Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const layout = ref({
  polar: {
    radialaxis: {
      visible: true,
      range: [-100, 0],
      tickvals: [-100, -90, -80, -70, -60, -50, -40, -30, -20, -10, 0],
      ticktext: ['100', '90', '80', '70', '60', '50', '40', '30', '20', '10', '0']
    }
  }
})

const load = () => {
  rankings.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{ statement: rankings.value.query, parameters: query_params }]).then((results) => {
    rankings.value.data = results[0]
    rankings.value.loading = false
    let showRadar = false
    results[0].forEach((element) => {
      if (element.rank < 100) {
        showRadar = true
      }
    })
    if (!showRadar) {
      rankings.value.show = false
    }
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
  <IypController
    :data="rankings.data"
    :columns="rankings.columns"
    :loading-status="rankings.loading"
    :cypher-query="rankings.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="rankings.show ? 1 : 0"
  >
    <IypGenericRadarChart
      v-if="rankings.data.length > 0 && rankings.show"
      :chart-data="rankings.data.map((val) => ({ r: -val.rank, theta: val.name })).slice(1, 11)"
      :chart-layout="layout"
      :config="{
        name: 'Rankings',
        hovermode: 'closest',
        customdata: rankings.data.map((val) => ({ rank: String(val.rank) })).slice(1, 11),
        hovertemplate: '<b>Rank:</b> %{customdata.rank}<br><b>Name:</b> %{theta}<br><extra></extra>'
      }"
    />
  </IypController>
</template>
