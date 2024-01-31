<script setup>
import { useRoute } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['pageTitle', 'getPrefix'])

const route = useRoute()

const moreSpecifics = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF*]-(x:Prefix)
    WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0'
    OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
    OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
    OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
    OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
    OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
    OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
    RETURN c.country_code AS cc, x.prefix as prefix, collect(DISTINCT a.asn) as asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility`,
  columns: [
    { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
    { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true },
    { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
    { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
    { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
    { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
    { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.get('visibility'), format: val => `${Number(val).toFixed(2)}%`, sortable: true },
  ]
})

const load = () => {
  moreSpecifics.value.loading = true
  // Run the cypher query
  let query_params = { prefix: props.getPrefix }
  iyp_api.run(moreSpecifics.value.query, query_params).then(
    results => {
      moreSpecifics.value.data = results.records
      moreSpecifics.value.loading = false
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
    :data="moreSpecifics.data"
    :columns="moreSpecifics.columns"
    :loading-status="moreSpecifics.loading"
    :cypher-query="moreSpecifics.query.replace(/\$(.*?)}/, `'${getPrefix}'`)"
  >
  <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
  </IypGenericTable>
</template>