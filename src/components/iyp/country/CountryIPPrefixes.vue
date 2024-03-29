<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import treemapClicked from '@/plugins/IypGenericTreemapChart.js'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const cc = ref(props.countryCode)
const aggPrefixes = ref([])
const prefixes = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(p:Prefix)
    OPTIONAL MATCH (p)<-[o:ORIGINATE {reference_org:'IHR'}]-(a:AS)
    OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
    OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
    OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
    OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
    OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
    RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix AS prefix, COLLECT(DISTINCT(t.label)) AS tags, COLLECT(DISTINCT o.descr) AS descr, COLLECT(DISTINCT o.visibility) AS visibility, COLLECT(DISTINCT a.asn) AS asn `,
  columns: [
    { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true, description: 'Regional Internet Registry where the prefix is allocated to (Delegated Stats).'  },
    { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.rir_country, format: val => `${String(val).toUpperCase()}`, sortable: true,  description: 'Registered country code of the organization to which the prefix is allocated. (Delegated Stats)'  },
    { name: 'Geoloc. Country', label: 'Geoloc. Country', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true,  description: 'Geo-location of the prefix according to Maxmind. (Maxmind)'  },
    { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.asn, format: val => `${val.join(', ')}`, sortable: true },
    { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad', description: 'Autonomous System originating the prefix in BGP. (RIPE RIS, Routeviews)' },
    { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true, description: 'Description of the prefix given in IRR. (IRR)' },
    { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true, description: 'Tags assigned by various projects. See the corresponding tag page for more details.' },
    { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.visibility, format: val => `${Number(val).toFixed(2)}%`, sortable: true, description: 'Percentage of RIPE RIS and Routeviews peers seeing this prefix/AS pair. (IHR)' },
  ]
})

const load = () => {
  prefixes.value.loading = true
  // Run the cypher query
  let query_params = { cc: props.countryCode }
  iyp_api.run([{statement: prefixes.value.query, parameters: query_params}]).then(
    results => {
      prefixes.value.data = results[0]
      aggPrefixes.value = aggregatePrefixes(prefixes.value.data)
      prefixes.value.loading = false
    }
  )
}

const aggregatePrefixes = (prefixData) => {
  const asCount = {}
  prefixData.forEach( item => {
    item.asn.forEach( asn => {
      if(!asCount[asn]){
        asCount[asn] = {
          nbPrefixes:1,
          asn: 'AS'+asn,
          get(key) {
            return this[key]
          }
        }
      }
      else{
        asCount[asn].nbPrefixes += 1
      }
    })
  })
  return Object.values(asCount)
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
    :data="prefixes.data"
    :columns="prefixes.columns"
    :loading-status="prefixes.loading"
    :cypher-query="prefixes.query.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :slot-length="2"
  >
    <div class="row justify-evenly">
      <div class="col-4">
        <IypGenericBarChart
          v-if="prefixes.data.length > 0"
          :chart-data="prefixes.data"
          :config="{key:'tag'}"
          :chart-layout="{ title: 'tag' }"
        />
      </div>
      <div class="col-8">
        <IypGenericTreemapChart
          v-if="aggPrefixes.length > 0"
          :chart-data="aggPrefixes"
          :chart-layout="{ title: 'Number of prefixes per Origin AS' }"
          :config="{ keys: ['asn'], keyValue: 'nbPrefixes', root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} prefixes<extra></extra>' }"
          @treemap-clicked="treemapClicked({...$event, ...{router: router}})"
        />
      </div>
    </div>
  </IypGenericTable>
</template>