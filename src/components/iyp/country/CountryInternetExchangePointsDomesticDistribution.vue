<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericBoxPlotChart from '@/components/charts/IypGenericBoxPlotChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ixps = ref({
  data: [],
  show: false,
  loading: true,
  query: `MATCH (:Country {country_code:$country_code})-[:COUNTRY {reference_org:'NRO'}]-(member:AS)
    WHERE (member)-[:ORIGINATE]-(:Prefix)
    OPTIONAL MATCH (member)-[:CATEGORIZED {reference_name:'bgptools.as_names'}]-(tag:Tag)
    OPTIONAL MATCH (member)-[mem:MEMBER_OF]-(ix:IXP)-[:COUNTRY]-(ix_country:Country)
    OPTIONAL MATCH (ix)-[man:MANAGED_BY]-(org:Organization)
    RETURN  DISTINCT member.asn AS asn, coalesce(tag.label, 'Other') AS label, ix.name AS ix_name, ix_country.country_code AS ix_country, $country_code AS as_country, mem.reference_org AS mem_reference_org, org.name AS org_name`,
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

const boxPlotDataFormat = (data) => {
  const groupByLabel = data.filter(obj => obj.ix_country === props.countryCode || obj.ix_country === null).reduce((acc, current) => {
    if (!acc[current.label]) {
      acc[current.label] = {}
    }
    if (!acc[current.label][current.asn]) {
      acc[current.label][current.asn] = new Set()
    }
    if (current.ix_name) {
      acc[current.label][current.asn].add(current.ix_name.toLowerCase())
    }
    return acc
  }, {})

  return [groupByLabel]
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
      <IypGenericBoxPlotChart
        v-if="ixps.data.length > 0"
        :chart-data="boxPlotDataFormat(ixps.data)"
        :chart-layout="{ title: 'IXPs distribution', yaxis: { title: { text: 'Number of IXPs' } } }"
        :config="{}"
      />
      <IypGenericBarChart
        v-if="ixps.data.length > 0"
        :chart-data="ixps.data"
        :chart-layout="{ title: 'IXPs origin', yaxis: { title: { text: 'Number of IXPs' } } }"
        :config="{ key: 'ix_country' }"
      />
    </div>
  </IypGenericTable>
</template>
