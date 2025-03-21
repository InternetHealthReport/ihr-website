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
  query: `MATCH (member:AS)-[mem:MEMBER_OF]-(ix:IXP)-[:COUNTRY]-(ix_country:Country {country_code:$country_code})
    MATCH (member:AS)-[:COUNTRY {reference_org:'NRO'}]-(as_country:Country)
    WHERE  as_country.country_code <> $country_code AND (member)-[:ORIGINATE]-(:Prefix)
    OPTIONAL MATCH (member)-[:CATEGORIZED {reference_name:'bgptools.as_names'}]-(tag:Tag)
    OPTIONAL MATCH (ix:IXP)-[:MANAGED_BY {reference_org:'PeeringDB'}]-(org:Organization)
    RETURN  member.asn AS asn, tag.label AS label, ix.name AS ix_name, ix_country.country_code AS ix_country, as_country.country_code AS as_country, mem.reference_org AS mem_reference_org, org.name AS org_name`,
  columns: [
  {
      name: 'ASN',
      label: 'ASN',
      align: 'left',
      field: (row) => row.asn,
      format: (val) => `AS${val}`,
      sortable: true,
    },
    {
      name: 'Organization',
      label: 'Organization',
      align: 'left',
      field: (row) => row.org_name,
      format: (val) => `${val}`,
      sortable: true,
    },
    {
      name: 'IXP Name',
      label: 'IXP Name',
      align: 'left',
      field: (row) => row.ix_name,
      format: (val) => `${val}`,
      sortable: true,
    },
    {
      name: 'ASN Country',
      label: 'ASN Country',
      align: 'left',
      field: (row) => row.as_country,
      format: (val) => `${val}`,
      sortable: true,
    },
    {
      name: 'IXP Country',
      label: 'IXP Country',
      align: 'left',
      field: (row) => row.ix_country,
      format: (val) => `${val}`,
      sortable: true,
    },
    {
      name: 'IXP Label',
      label: 'IXP Label',
      align: 'left',
      field: (row) => row.label,
      format: (val) => `${val}`,
      sortable: true,
    },
    {
      name: 'Reference Organization',
      label: 'Reference Organization',
      align: 'left',
      field: (row) => row.mem_reference_org,
      format: (val) => `${val}`,
      sortable: true,
    }
  ],
  pagination: {
    sortBy: 'Number of members', //string column name
    descending: true //boolean
  }
})

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { country_code: props.countryCode }
  iyp_api.run([{ statement: ixps.value.query, parameters: query_params }]).then((results) => {
    ixps.value.data = results[0]
    ixps.value.loading = false
  })
}

watch(
  () => props.countryCode,
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
    :data="ixps.data"
    :columns="ixps.columns"
    :loading-status="ixps.loading"
    :cypher-query="ixps.query.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :pagination="ixps.pagination"
    :slot-length="1"
  >
    <div class="col-6">
      <!-- <IypGenericTreemapChart
        v-if="ixps.data.length > 0"
        :chart-data="ixps.data"
        :chart-layout="{ title: 'IXPs in ' + pageTitle + ' weighted by their number of members' }"
        :config="{
          keys: ['org', 'ixp'],
          keyValue: 'nb_members',
          root: pageTitle,
          hovertemplate: '<b>%{label}</b><br>%{value} members<extra></extra>'
        }"
        @treemap-clicked="treemapClicked({ ...$event, ...{ router: router, leafKey: 'ixpName' } })"
      /> -->
    </div>
  </IypGenericTable>
</template>
