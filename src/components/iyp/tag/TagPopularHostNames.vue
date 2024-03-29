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
  query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(:URL)-[:PART_OF]-(h:HostName & !AuthoritativeNameServer)-[:PART_OF]-(d:DomainName)
    OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
    OPTIONAL MATCH (h)-[:PART_OF]-(:URL)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
    RETURN h.name AS hostname, collect(DISTINCT to.label) AS other_tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, rn.name AS rankingName, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`,
  columns: [
    { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.classifier_org, row.classifier_name], format: val => `${val[0]} (${val[1]})`, sortable: true },
    { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.rank?Number(row.rank): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
    { name: 'TLD', label: 'TLD', align: 'left', field: row => row.tld, format: val => `${val}`, sortable: true },
    { name: 'Host', label: 'Hostname', align: 'left', field: row => row.hostname, format: val => `${val}`, sortable: true },
    { name: 'tag', label: 'Other Tags', align: 'left', field: row => row.other_tags, format: val => `${val.join(', ')}`, sortable: true },
  ]
})

const load = () => {
  domains.value.loading = true
  // Run the cypher query
  let query_params = { tag: props.tag }
  iyp_api.run([{statement: domains.value.query, parameters: query_params}]).then(
    results => {
      domains.value.data = results[0]
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