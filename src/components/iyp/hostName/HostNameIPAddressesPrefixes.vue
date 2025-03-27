<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'hostName'])

const route = useRoute()
const router = useRouter()

const ips = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:HostName {name: $hostname})-[:RESOLVES_TO]-(i:IP)
    OPTIONAL MATCH (i)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
    OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
    RETURN DISTINCT a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, i.ip as ip, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
  columns: [
    {
      name: 'IP address',
      label: 'IP address',
      align: 'left',
      field: (row) => row.ip,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Prefix',
      label: 'Prefix',
      align: 'left',
      field: (row) => row.prefix,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Prefix Tags',
      label: 'Prefix Tags',
      align: 'left',
      field: (row) => row.tags,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Origin AS',
      label: 'Origin AS',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true
    },
    {
      name: 'Name',
      label: 'AS Name',
      align: 'left',
      field: (row) => row.asname,
      format: (val) => `${val}`,
      sortable: true
    }
  ]
})

const load = () => {
  ips.value.loading = true
  // Run the cypher query
  let query_params = { hostname: props.hostName }
  iyp_api.run([{ statement: ips.value.query, parameters: query_params }]).then((results) => {
    ips.value.data = results[0]
    ips.value.loading = false
  })
}

watch(
  () => props.hostName,
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
    :data="ips.data"
    :columns="ips.columns"
    :loading-status="ips.loading"
    :cypher-query="ips.query.replace(/\$(.*?)}/, `'${hostName}'}`)"
    :slot-length="1"
  >
    <div class="row justify-evenly">
      <div class="col-4">
        <IypGenericBarChart
          v-if="ips.data.length > 0"
          :chart-data="ips.data"
          :config="{ key: 'tags' }"
          :chart-layout="{ title: 'Prefix Tags' }"
        />
      </div>
      <div class="col-8">
        <IypGenericTreemapChart
          v-if="ips.data.length > 0"
          :chart-data="ips.data"
          :config="{
            keys: ['asn', 'prefix', 'ip'],
            root: pageTitle,
            hovertemplate: '<b>%{label}<br>%{value}</b> <br><br><extra></extra>'
          }"
          @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'ip' } })"
        />
      </div>
    </div>
  </IypController>
</template>
