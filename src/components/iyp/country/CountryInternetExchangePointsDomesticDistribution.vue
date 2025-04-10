<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, watch, onMounted } from 'vue'
import IypController from '@/components/controllers/IypController.vue'
import IypGenericBoxPlotChart from '@/components/charts/IypGenericBoxPlotChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'
import IypGenericHeatmapChart from '@/components/charts/IypGenericHeatmapChart.vue'
import { QSlider, QBadge, QSelect } from 'quasar'

const iyp_api = inject('iyp_api')

const props = defineProps(['countryCode', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const ixps = ref({
  data: [],
  group: {},
  show: false,
  loading: true,
  query: `
    MATCH (member:AS)-[:COUNTRY {reference_org:'NRO'}]-(:Country {country_code:$country_code})
    WHERE (member)-[:ORIGINATE]-(:Prefix)
    OPTIONAL MATCH (ix:IXP)-[:MEMBER_OF]-(member)
    WITH ix, COLLECT(member) AS members, COUNT(DISTINCT member) AS ixp_domestic_members
    UNWIND members as member
    OPTIONAL MATCH (member)-[:CATEGORIZED {reference_name:'bgptools.as_names'}]-(tag:Tag)
    OPTIONAL MATCH (member)-[mem:MEMBER_OF]-(ix:IXP)-[:COUNTRY]-(ix_country:Country)
    OPTIONAL MATCH (ix)-[man:MANAGED_BY]-(org:Organization)
    RETURN  DISTINCT member.asn AS asn, coalesce(tag.label, 'Other') AS label, ix.name AS ix_name, ix_country.country_code AS ix_country, $country_code AS as_country, mem.reference_org AS mem_reference_org, org.name AS org_name, ixp_domestic_members
    ORDER BY ixp_domestic_members`,
  metadata: `
    MATCH (member:AS)-[:COUNTRY {reference_org:'NRO'}]-(:Country {country_code:$country_code})
    WHERE (member)-[:ORIGINATE]-(:Prefix)
    OPTIONAL MATCH (member)-[:CATEGORIZED {reference_name:'bgptools.as_names'}]-(tag:Tag)
    OPTIONAL MATCH (member)-[mem:MEMBER_OF]-(ix:IXP)-[:COUNTRY]-(ix_country:Country)
    OPTIONAL MATCH (ix)-[man:MANAGED_BY]-(org:Organization)
    RETURN DISTINCT member.asn AS asn`,
  columns: [
    {
      name: 'AS Country',
      label: 'AS Country',
      align: 'left',
      field: (row) => row.as_country,
      format: (val) => `${val}`,
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
      name: 'AS Category',
      label: 'AS Category',
      align: 'left',
      field: (row) => row.label,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IXP Country',
      label: 'IXP Country',
      align: 'left',
      field: (row) => row.ix_country,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IXP Organization',
      label: 'IXP Organization',
      align: 'left',
      field: (row) => row.org_name,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'IXP Name',
      label: 'IXP Name',
      align: 'left',
      field: (row) => row.ix_name,
      format: (val) => `${val}`,
      sortable: true
    },
    {
      name: 'Data Source',
      label: 'Data Source',
      align: 'left',
      field: (row) => row.mem_reference_org,
      format: (val) => `${val}`,
      sortable: true
    }
  ],
  pagination: {
    sortBy: 'Number of members', //string column name
    descending: true //boolean
  }
})
const uniqueASperIXP = ref(6)
const uniqueASperIXPMax = ref(0)
const uniqueASperIXPMin = ref(0)
const optionsResource = ref([])
const selectResource = ref([])
const errorMessageResource = ref('')

const load = () => {
  ixps.value.loading = true
  // Run the cypher query
  let query_params = { country_code: props.countryCode }
  iyp_api
    .run([
      { statement: onReferenceOrganizationSelection(ixps.value.query), parameters: query_params }
    ])
    .then((results) => {
      ixps.value.data = results[0]
      ixps.value.group = results[0].reduce((acc, current) => {
        if (current.ix_name) {
          const key = `${current.ix_name.toLowerCase()} - ${current.ix_country}`
          if (!acc[key]) {
            acc[key] = new Set()
          }
          if (current.asn) {
            acc[key].add(current.asn)
          }
        }
        return acc
      }, {})
      const ixpsSize = Object.values(ixps.value.group)
        .map((obj) => obj.size)
        .sort((a, b) => b - a)
      uniqueASperIXPMax.value = ixpsSize[0]
      if (ixpsSize.length > 20) {
        if (ixpsSize[19] < 5) {
          uniqueASperIXP.value = 5
        } else {
          uniqueASperIXP.value = ixpsSize[19]
        }
      } else {
        uniqueASperIXP.value = ixpsSize[ixpsSize.length - 1]
      }
      if (!optionsResource.value.length) {
        const uniqueRefOrgs = new Set(ixps.value.data.map((obj) => obj.mem_reference_org))
        uniqueRefOrgs.delete(null)
        optionsResource.value = Array.from(uniqueRefOrgs)
        selectResource.value = optionsResource.value
      }
      ixps.value.loading = false
    })
}

const onReferenceOrganizationSelection = (query) => {
  if (selectResource.value.length < optionsResource.value.length) {
    const splitQuery = query.split('RETURN')
    const updateQuery = `WITH member, tag, ix, ix_country, org, mem, man, ixp_domestic_members
      WHERE mem IS null OR mem.reference_org IN ['${selectResource.value.join("','")}']`
    return `${splitQuery[0]} ${updateQuery}\nRETURN ${splitQuery[1].trim()}`
  }
  return query
}

const boxPlotDataFormat = (data) => {
  const filteredIXPs = new Set()
  Object.keys(ixps.value.group).forEach((ixp) => {
    filteredIXPs.add(ixp.split(' - ')[0])
  })

  const groupByLabelDomestic = data
    .filter((obj) => obj.ix_country === props.countryCode || obj.ix_country == null)
    .reduce((acc, current) => {
      const label = `${current.label}-Domestic`
      if (!acc[label]) {
        acc[label] = {}
      }
      if (!acc[label][current.asn]) {
        acc[label][current.asn] = new Set()
      }
      if (current.ix_name) {
        if (filteredIXPs.has(current.ix_name.toLowerCase())) {
          acc[label][current.asn].add(current.ix_name.toLowerCase())
        }
      }
      return acc
    }, {})

  const groupByLabelInternational = data
    .filter((obj) => obj.ix_country !== props.countryCode)
    .reduce((acc, current) => {
      const label = `${current.label}-International`
      if (!acc[label]) {
        acc[label] = {}
      }
      if (!acc[label][current.asn]) {
        acc[label][current.asn] = new Set()
      }
      if (current.ix_name) {
        if (filteredIXPs.has(current.ix_name.toLowerCase())) {
          acc[label][current.asn].add(current.ix_name.toLowerCase())
        }
      }
      return acc
    }, {})

  return [groupByLabelDomestic, groupByLabelInternational]
}

const barPlotDataFormat = (data) => {
  const ixpCountry = []
  const asnExist = new Set()
  Object.keys(data).forEach((ixp) => {
    if (data[ixp].size >= uniqueASperIXP.value) {
      const cc = ixp.split(' - ').reverse()[0]
      data[ixp].forEach((asn) => {
        if (!asnExist.has(`${asn}-${cc}`)) {
          ixpCountry.push({
            ix_country: cc
          })
          asnExist.add(`${asn}-${cc}`)
        }
      })
    }
  })
  return ixpCountry
}

const heatmapPlotDataFormat = (data) => {
  const ixpDistribution = {}
  Object.keys(data).forEach((ixp) => {
    if (data[ixp].size >= uniqueASperIXP.value) {
      ixpDistribution[ixp] = data[ixp]
    }
  })
  return [ixpDistribution]
}

watch(selectResource, () => {
  if (selectResource.value.length < 1) {
    errorMessageResource.value = 'Reference Organizations field is empty'
  } else {
    errorMessageResource.value = ''
  }
})

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
  <IypController
    :data="ixps.data"
    :columns="ixps.columns"
    :loading-status="ixps.loading"
    :cypher-query="
      onReferenceOrganizationSelection(ixps.query).replace(/\$(.*?)}/, `'${countryCode}'}`)
    "
    :metadata-cypher-query="ixps.metadata.replace(/\$(.*?)}/, `'${countryCode}'}`)"
    :pagination="ixps.pagination"
    :slot-length="1"
    :disable-chart-on-empty-data="false"
  >
    <div class="col-6">
      <IypGenericBoxPlotChart
        v-if="ixps.data.length > 0"
        :chart-data="boxPlotDataFormat(ixps.data)"
        :chart-layout="{
          title: 'IXP Membership per AS',
          yaxis: { title: { text: 'Number of IXPs per AS' }, zeroline: false },
          boxmode: 'group'
        }"
        :config="{}"
        :no-data="errorMessageResource"
      />
      <IypGenericBarChart
        v-if="ixps.data.length > 0"
        :chart-data="barPlotDataFormat(ixps.group)"
        :chart-layout="{
          title: 'IXPs Location',
          yaxis: { title: { text: 'Number of unique ASes' } }
        }"
        :config="{ key: 'ix_country' }"
        :group-top-n-and-except-as-others="8"
        :no-data="errorMessageResource"
      />
      <IypGenericHeatmapChart
        v-if="ixps.data.length > 0"
        :chart-data="heatmapPlotDataFormat(ixps.group)"
        :chart-layout="{
          title: `IXP Membership for ASes Registered in ${pageTitle}`,
          xaxis: { automargin: true, constrain: 'domain', scaleanchor: 'y' },
          yaxis: { automargin: true, constrain: 'domain' },
          height: 900
        }"
        :config="{}"
        :no-data="errorMessageResource"
      />
      <div>
        <h3>Filtering</h3>
        <div class="row">
          <div class="col q-mr-xl">
            <QBadge>Number of unique ASes per IXP: {{ uniqueASperIXP }}</QBadge>
            <QSlider v-model="uniqueASperIXP" :min="uniqueASperIXPMin" :max="uniqueASperIXPMax" />
          </div>
          <div class="col">
            <QSelect
              use-chips
              filled
              multiple
              v-model="selectResource"
              :options="optionsResource"
              @update:model-value="load()"
              :rules="[
                (val) => val.length > 0 || 'Please select at least one Reference Organization'
              ]"
              label="Reference Organizations"
            />
          </div>
        </div>
      </div>
    </div>
  </IypController>
</template>
