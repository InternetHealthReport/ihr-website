<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['tag'])

const route = useRoute()
const router = useRouter()

const prefixes = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(p:Prefix)
    OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
    OPTIONAL MATCH (a)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
    OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
    OPTIONAL MATCH (p)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
    RETURN p.prefix as prefix, collect(DISTINCT to.label) as other_tags, c.country_code AS cc, creg_country.country_code as as_cc, collect(DISTINCT a.asn) as asn, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
  columns: [
    { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.classifier_org, row.classifier_name], format: val => `${val[0]} (${val[1]})`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
    { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.asn, format: val => `AS${val.join(', AS')}`, sortable: true },
    { name: 'Reg. Country', label: 'AS Reg. Country ', align: 'left', field: row => row.as_cc, format: val => `${String(val).toUpperCase()}`, sortable: true },
    { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
    { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
    { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.other_tags, format: val => `${val.join(', ')}`, sortable: true },
  ]
})
const prefixesViz = ref([])

const load = () => {
  prefixes.value.loading = true
  // Run the cypher query
  let query_params = { tag: props.tag }
  iyp_api.run([{statement: prefixes.value.query, parameters: query_params}]).then(
    results => {
      prefixes.value.data = results[0]
      const prefix = new Set()
      results[0].forEach(el => {
        if (!prefix.has(el.asn)) {
          prefix.add(el.asn)
          prefixesViz.value.push(el)
        }
      })
      prefixes.value.loading = false
    }
  )
}

watch(() => props.tag, () => {
  load()
})

onMounted(() => {
  load()
})
</script>

<template>
  <IypGenericTable
    :data="prefixes.data"
    :columns="prefixes.columns"
    :loading-status="prefixes.loading"
    :cypher-query="prefixes.query.replace(/\$(.*?)}/, `'${tag}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="prefixes.data.length > 0 & prefixesViz.length > 0"
      :chart-data="prefixesViz"
      :chart-layout="{ title: 'Breakdown per origin AS and registered country code' }"
      :config="{ keys: ['as_cc', 'asn', 'prefix'], root: tag, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.descr}<extra>%{customdata.percent:.1f}%</extra>' }"
      @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
      />
  </IypGenericTable>
</template>
