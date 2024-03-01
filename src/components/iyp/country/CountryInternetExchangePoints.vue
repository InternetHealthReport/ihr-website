<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ixps = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'peeringdb.ix'}]-(i:IXP)
    MATCH (i)-[:EXTERNAL_ID]-(p:PeeringdbIXID)
    OPTIONAL MATCH (i)-[:MANAGED_BY]-(o:Organization)
    OPTIONAL MATCH (i)-[:MEMBER_OF]-(a:AS)
    RETURN c.country_code AS cc, i.name AS ixp, p.id AS id, o.name AS org, COUNT(DISTINCT a) AS nb_members`,
  columns: [
    { name: 'IXP', label: 'PeeringDB ID', align: 'left', field: row => row.id, format: val => `IXP${val}`, sortable: true, description: 'Identifier used in the PeeringDB database and website.' },
    { name: 'Name', label: 'Name', align: 'left', field: row => row.ixp, format: val => `${val}`, sortable: true, description: 'Name of the IXP as given by PeeringDB.'  },
    { name: 'Number of members', label: 'Number of members', align: 'left', field: row => row.nb_members, format: val => `${val}`, sortable: true, description: 'Number of members according to PeeringDB.' },
  ],
  pagination: {
    sortBy: 'Number of members', //string column name
    descending: true //boolean
  }
})

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  iyp_api.run([{statement: ixps.value.query, parameters: query_params}]).then(
    results => {
      ixps.value.data = results[0]
      ixps.value.loading = false
    }
  )
}

watch(() => props.countryCode, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="ixps.data"
    :columns="ixps.columns"
    :loading-status="ixps.loading"
    :cypher-query="ixps.query.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :pagination="ixps.pagination"
    :slot-length=1
  >
    <div class="col-6">
      <IypGenericTreemapChart
        v-if="ixps.data.length > 0"
        :chart-data="ixps.data"
        :chart-layout="{ title: 'IXPs in '+pageTitle+' weighted by their number of members' }"
        :config="{ keys: ['org', 'ixp'], keyValue: 'nb_members', root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} members<extra></extra>' }"
        @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
      />
    </div>
  </IypGenericTable>
</template>