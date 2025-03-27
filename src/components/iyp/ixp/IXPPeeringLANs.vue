<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const peeringLANs = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MANAGED_BY {reference_org: 'PeeringDB'}]-(s:Prefix)
    OPTIONAL MATCH (s)-[:ORIGINATE]-(a:AS)
    RETURN s.prefix as prefix, s.af as af, COLLECT(DISTINCT a.asn) as orig`,
  columns: [
    {
      name: 'Prefix',
      label: 'Prefix',
      align: 'left',
      field: (row) => row.prefix,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Origin AS',
      label: 'Origin AS in BGP',
      align: 'left',
      field: (row) => row.orig,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const load = () => {
  peeringLANs.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api
    .run([{ statement: peeringLANs.value.query, parameters: query_params }])
    .then((results) => {
      peeringLANs.value.data = results[0]
      peeringLANs.value.loading = false
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
  <IypController
    :data="peeringLANs.data"
    :columns="peeringLANs.columns"
    :loading-status="peeringLANs.loading"
    :cypher-query="peeringLANs.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="peeringLANs.data.length > 0"
      :chart-data="peeringLANs.data"
      :chart-layout="{ title: '' }"
      :config="{ keys: ['af', 'prefix'], root: pageTitle }"
    />
  </IypController>
</template>
