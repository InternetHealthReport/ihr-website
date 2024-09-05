<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const facilities = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)-[:LOCATED_IN]->(f:Facility) OPTIONAL MATCH (f)-[:COUNTRY]->(c:Country)
    RETURN f.name as name, c.country_code AS cc`,
  columns: [
    {
      name: 'CC',
      label: 'CC',
      align: 'left',
      field: (row) => row.cc,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Facility',
      label: 'Facility',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const load = () => {
  facilities.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api.run([{ statement: facilities.value.query, parameters: query_params }]).then((results) => {
    facilities.value.data = results[0]
    facilities.value.loading = false
  })
}

watch(
  () => props.ixpNumber,
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
    :data="facilities.data"
    :columns="facilities.columns"
    :loading-status="facilities.loading"
    :cypher-query="facilities.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="facilities.data.length > 0"
      :chart-data="facilities.data"
      :chart-layout="{ title: '' }"
      :config="{ keys: ['cc', 'name'], root: pageTitle }"
    />
  </IypGenericTable>
</template>
