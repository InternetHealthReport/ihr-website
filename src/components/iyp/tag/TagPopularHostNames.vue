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

const domains = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(d:DomainName)
    OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
    OPTIONAL MATCH (d)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
    RETURN d.name AS domain, collect(DISTINCT to.label) AS other_tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, rn.name AS rankingName, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
  columns: [
    { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.get('classifier_org'), row.get('classifier_name')], format: val => `${val[0]} (${val[1]})`, sortable: true },
    { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.get('rank')?Number(row.get('rank')): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
    { name: 'TLD', label: 'TLD', align: 'left', field: row => row.get('tld'), format: val => `${val}`, sortable: true },
    { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.get('domainName'), format: val => `${val}`, sortable: true },
    { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.get('other_tags'), format: val => `${val.join(', ')}`, sortable: true },
  ]
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { tag: props.tag }
  iyp_api.run(domains.value.query, query_params).then(
    results => {
      domains.value.data = results.records
      domains.value.loading = false
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
    :data="domains.data"
    :columns="domains.columns"
    :loading-status="domains.loading"
    :cypher-query="domains.query.replace(/\$(.*?)}/, `'${tag}'}`)"
    :slot-length="0"
  >
  </IypGenericTable>
</template>