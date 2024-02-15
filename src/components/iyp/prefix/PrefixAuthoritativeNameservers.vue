<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()
const router = useRouter()

const nameservers = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(n:AuthoritativeNameServer)
    OPTIONAL MATCH (n)<-[:MANAGED_BY]-(:DomainName)-[:PART_OF]-(d:HostName)
    RETURN COLLECT(DISTINCT i.ip) AS ip, n.name as nameserver, split(n.name, '.')[-1] AS tld, COUNT(DISTINCT d.name) AS nb_hostnames`,
  columns: [
    { name: 'TLD', label: 'TLD', align: 'left', field: row => row.tld, format: val => `${val}`, sortable: true },
    { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.nameserver, format: val => `${val}`, sortable: true },
    { name: 'Host Name', label: 'Nb. Popular Host Names', align: 'left', field: row => row.nb_hostnames, format: val => `${val}`, sortable: true },
    { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}`, sortable: true },
  ]
})

const load = () => {
  nameservers.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run([{statement: nameservers.value.query, parameters: query_params}]).then(
    results => {
      results[0].forEach(obj => obj.tld == '' ? obj.tld='.' : obj.tld=obj.tld)
      nameservers.value.data = results[0]
      nameservers.value.loading = false
    }
  )
}

watch(() => props.getPrefix, () => {
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
    :cypher-query="nameservers.query.replace(/\$(.*?)}/, `'${getPrefix}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="nameservers.data.length > 0"
      :chart-data="nameservers.data"
      :config="{ keys: ['tld', 'nameserver', 'ip'], root: getPrefix, hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br>Manage %{customdata.nb_hostnames} popular host names<extra></extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
    />
  </IypGenericTable>
</template>