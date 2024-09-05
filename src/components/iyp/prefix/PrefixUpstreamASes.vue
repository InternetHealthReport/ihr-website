<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()

const upstreams = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:Prefix {prefix: $prefix})-[dep:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name)
    OPTIONAL MATCH (a)-[:COUNTRY {reference_org:'NRO'}]-(c:Country)
    RETURN DISTINCT a.asn AS asn, head(collect(c.country_code)) AS cc, head(collect(DISTINCT(n.name))) AS name, 100*dep.hege AS hege `,
  columns: [
    {
      name: 'Reg. Country',
      label: 'Reg. Country',
      align: 'left',
      field: (row) => row.cc,
      format: (val) => `${val}`,
      sortable: true,
      description:
        'Country code of the organization for which the ASN is registered for. (Delegated Stat.)'
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
  upstreams.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run([{ statement: upstreams.value.query, parameters: query_params }]).then((results) => {
    upstreams.value.data = results[0]
    upstreams.value.loading = false
  })
}

watch(
  () => props.getPrefix,
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
    :data="upstreams.data"
    :columns="upstreams.columns"
    :loading-status="upstreams.loading"
    :cypher-query="upstreams.query.replace(/\$(.*?)}/, `'${getPrefix}'}`)"
    :slot-length="1"
  >
    <IypGenericBarChart
      v-if="upstreams.data.length > 0"
      :chart-data="upstreams.data"
      :chart-layout="{ yaxis: { title: { text: 'AS Hegemony (%)' }, range: [0, 100] } }"
      :config="{ key: 'asn', groupKey: 'cc', value: 'hege', xlabel_prefix: 'AS' }"
    />
  </IypGenericTable>
</template>
