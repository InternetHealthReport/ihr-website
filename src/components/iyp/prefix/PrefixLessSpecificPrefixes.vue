<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()

const lessSpecifics = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:BGPPrefix {prefix: $prefix})-[:PART_OF*1..10]->(x:BGPPrefix)
    WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0' AND p <> x
    WITH DISTINCT x
    OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
    OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
    OPTIONAL MATCH (x)-[:PART_OF]->(:RIRPrefix)-[cover_creg:COUNTRY {reference_org:'NRO'}]->(cover_creg_country:Country)
    RETURN x.prefix as prefix, collect(DISTINCT a.asn) as asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(cover_creg.registry, '-')) AS rir, toUpper(COALESCE(cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility, x.prefixlen as len ORDER BY len`,
  columns: [
    {
      name: 'RIR',
      label: 'RIR',
      align: 'left',
      field: (row) => (row.rir ? row.rir : ''),
      format: (val) => `${String(val).toUpperCase()}`,
      sortable: true
    },
    {
      name: 'Reg. Country',
      label: 'Reg. Country ',
      align: 'left',
      field: (row) => row.rir_country,
      format: (val) => `${String(val).toUpperCase()}`,
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
      name: 'Prefix',
      label: 'Prefix',
      align: 'left',
      field: (row) => row.prefix,
      format: (val) => `${val}`,
      sortable: true,
      sortOrder: 'ad'
    },
    {
      name: 'Description',
      label: 'Description',
      align: 'left',
      field: (row) => row.descr,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Tags',
      label: 'Tags',
      align: 'left',
      field: (row) => row.tags,
      format: (val) => `${val.join(', ')}`,
      sortable: true
    },
    {
      name: 'Visibility',
      label: 'Visibility',
      align: 'left',
      field: (row) => row.visibility,
      format: (val) => `${Number(val).toFixed(2)}%`,
      sortable: true
    }
  ]
})

const load = () => {
  lessSpecifics.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api
    .run([{ statement: lessSpecifics.value.query, parameters: query_params }])
    .then((results) => {
      lessSpecifics.value.data = results[0]
      lessSpecifics.value.loading = false
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
  <IypController
    :data="lessSpecifics.data"
    :columns="lessSpecifics.columns"
    :loading-status="lessSpecifics.loading"
    :cypher-query="lessSpecifics.query.replace(/\$(.*?)}/, `'${getPrefix}'}`)"
  >
    <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
  </IypController>
</template>
