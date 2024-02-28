<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'asNumber'])

const route = useRoute()
const router = useRouter()

const nameservers = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(p:Prefix)<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO {reference_name:'openintel.infra_ns'}]-(h:AuthoritativeNameServer)
    RETURN DISTINCT h.name AS nameserver, COLLECT(DISTINCT p.prefix) AS prefix, i.ip as ip`,
  columns: [
    { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.nameserver, format: val => `${val}`, sortable: true },
    { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  nameservers.value.loading = true
  // Run the cypher query
  let query_params = { asn: props.asNumber }
  iyp_api.run([{statement: nameservers.value.query, parameters: query_params}]).then(
    results => {
      nameservers.value.data = results[0]
      nameservers.value.loading = false
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
    :data="nameservers.data"
    :columns="nameservers.columns"
    :loading-status="nameservers.loading"
    :cypher-query="nameservers.query.replace(/\$(.*?)}/, asNumber)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="nameservers.data.length > 0"
      :chart-data="nameservers.data"
      :config="{ keys: ['prefix', 'ip', 'nameserver'], root: pageTitle, hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br><extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>