<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['ixpNumber', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const members = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[m:MEMBER_OF]-(a:AS)
    WHERE m.reference_org <> 'CAIDA'
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (a)-[:COUNTRY {reference_org: 'NRO'}]->(c:Country)
    RETURN distinct a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code as cc`,
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
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true
    },
    {
      name: 'Name',
      label: 'AS Name',
      align: 'left',
      field: (row) => row.name,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const load = () => {
  members.value.loading = true
  // Run the cypher query
  let query_params = { id: props.ixpNumber }
  iyp_api.run([{ statement: members.value.query, parameters: query_params }]).then((results) => {
    members.value.data = results[0]
    members.value.loading = false
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
    :data="members.data"
    :columns="members.columns"
    :loading-status="members.loading"
    :cypher-query="members.query.replace(/\$(.*?)}/, `${ixpNumber}}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="members.data.length > 0"
      :chart-data="members.data"
      :chart-layout="{ title: '' }"
      :config="{
        keys: ['cc', 'asn'],
        root: pageTitle,
        show_percent: true,
        hovertemplate: '<b>%{label}</b><br>%{customdata.name}<extra></extra>'
      }"
    />
  </IypController>
</template>
