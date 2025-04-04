<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['asNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ixps = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (a:AS {asn: $asn})-[:MEMBER_OF]->(i:IXP)-[:EXTERNAL_ID]->(p:PeeringdbIXID)
    OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
    RETURN DISTINCT c.country_code as cc, i.name as name, p.id as id`,
  columns: [
    {
      name: 'Country',
      label: 'Country',
      align: 'left',
      field: (row) => row.cc,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IXP',
      label: 'IXP Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`
    },
    {
      name: 'PeeringDB ID',
      label: 'PeeringDB ID',
      align: 'left',
      field: (row) => row.id,
      format: (val) => `${val}`
    }
  ]
})

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{ statement: ixps.value.query, parameters: query_params }]).then((results) => {
    ixps.value.data = results[0]
    ixps.value.loading = false
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
    :data="ixps.data"
    :columns="ixps.columns"
    :loading-status="ixps.loading"
    :cypher-query="ixps.query.replace(/\$(.*?)}/, `${asNumber}}`)"
    :slot-length="2"
  >
    <IypGenericTreemapChart
      v-if="ixps.data.length > 0"
      :chart-data="ixps.data"
      :config="{ keys: ['cc', 'name'], keyValue: '', root: pageTitle, show_percent: true }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'ixpName' } })"
    />
  </IypController>
</template>
