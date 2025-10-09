<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'

const iyp_api = inject('iyp_api')

const props = defineProps(['tag'])

const route = useRoute()
const router = useRouter()

const ases = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(a:AS)
    OPTIONAL MATCH (a)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
    OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(n:Name)
    OPTIONAL MATCH (a)-[creg:COUNTRY {reference_name:'nro.delegated_stats'}]->(creg_country:Country)
    WHERE creg_country.country_code <> ''
    RETURN a.asn as asn, n.name as name, collect(DISTINCT to.label) as other_tags, toUpper(COALESCE(creg.registry,  '-')) AS rir, creg_country.country_code AS cc, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name`,
  columns: [
    {
      name: 'Classified by',
      label: 'Classified by',
      align: 'left',
      field: (row) => [row.classifier_org, row.classifier_name],
      format: (val) => `${val[0]} (${val[1]})`,
      sortable: true
    },
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
      field: (row) => row.cc,
      format: (val) => `${String(val).toUpperCase()}`,
      sortable: true
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
    },
    {
      name: 'Tags',
      label: 'Other Tags',
      align: 'left',
      field: (row) => row.other_tags,
      format: (val) => `${val.join(', ')}`,
      sortable: true
    }
  ]
})
const asesViz = ref([])

const load = () => {
  ases.value.loading = true
  // Run the cypher query
  let query_params = { tag: props.tag }
  iyp_api.run([{ statement: ases.value.query, parameters: query_params }]).then((results) => {
    ases.value.data = results[0]
    const as = new Set()
    results[0].forEach((el) => {
      if (!as.has(el.asn)) {
        as.add(el.asn)
        asesViz.value.push(el)
      }
    })
    ases.value.loading = false
  })
}

watch(
  () => props.tag,
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
    :data="ases.data"
    :columns="ases.columns"
    :loading-status="ases.loading"
    :cypher-query="ases.query.replace(/\$(.*?)}/, `'${tag}'}`)"
    :slot-length="1"
  >
    <IypGenericTreemapChart
      v-if="(ases.data.length > 0) & (asesViz.length > 0)"
      :chart-data="asesViz"
      :chart-layout="{ title: 'Breakdown per RIR and registered country' }"
      :config="{
        keys: ['rir', 'cc', 'asn'],
        root: tag,
        show_percent: true,
        hovertemplate:
          '<b>%{label}</b><br>%{customdata.name}<extra>%{customdata.percent:.1f}%</extra>'
      }"
      @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'asn' } })"
    />
  </IypController>
</template>
