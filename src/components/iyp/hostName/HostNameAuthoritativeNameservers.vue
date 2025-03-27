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

const nameservers = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:HostName {name: $hostname})-[:PART_OF]-(:DomainName)-[:MANAGED_BY]-(n:AuthoritativeNameServer)
    OPTIONAL MATCH (n)-[:RESOLVES_TO]->(i:IP)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
    OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
    RETURN  DISTINCT i.ip AS ip, n.name as nameserver, a.asn AS asn, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
  columns: [
    {
      name: 'Nameserver',
      label: 'Authoritative Nameserver',
      align: 'left',
      field: (row) => row.nameserver,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IP',
      label: 'IP',
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
    }
  ]
})

const load = () => {
  nameservers.value.loading = true
  // Run the cypher query
  let query_params = { hostname: props.hostName }
  iyp_api
    .run([{ statement: nameservers.value.query, parameters: query_params }])
    .then((results) => {
      nameservers.value.data = results[0]
      nameservers.value.loading = false
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
    :data="nameservers.data"
    :columns="nameservers.columns"
    :loading-status="nameservers.loading"
    :cypher-query="nameservers.query.replace(/\$(.*?)}/, `'${hostName}'}`)"
    :slot-length="1"
  >
    <div class="row justify-evenly">
      <div class="col-4">
        <IypGenericBarChart
          v-if="nameservers.data.length > 0"
          :chart-data="nameservers.data"
          :config="{ key: 'tags' }"
          :chart-layout="{ title: 'Prefix Tags' }"
        />
      </div>
      <div class="col-8">
        <IypGenericTreemapChart
          v-if="nameservers.data.length > 0"
          :chart-data="nameservers.data"
          :config="{
            keys: ['asn', 'prefix', 'ip', 'nameserver'],
            root: pageTitle,
            hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br><extra></extra>'
          }"
          @treemap-clicked="
            treemapClicked({ ...$event, ...{ router: router, leafKey: 'nameserver' } })
          "
        />
      </div>
    </div>
  </IypController>
</template>
