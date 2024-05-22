<script setup>
import { QChip, QSpinner, QMarkupTable } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import '@/styles/chart.sass'

const iyp_api = inject('iyp_api')

const props  = defineProps({
  ixpNumber: {
    type: Number,
    required: true,
  },
})

const route = useRoute()

const REFERENCES = {
  peeringDB: 'https://www.peeringdb.com/ix',
}

const getOverview = () => {
  const query = `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(i:IXP)
      OPTIONAL MATCH (i)-[:MANAGED_BY]->(o:Organization)
      OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
      OPTIONAL MATCH (i)-[:WEBSITE]->(u:URL)
      OPTIONAL MATCH (i)<-[:MEMBER_OF]-(a:AS)
      OPTIONAL MATCH (i)-[:LOCATED_IN]->(f:Facility)
      RETURN i.name as name, o.name as organization, c.name AS country, c.country_code AS cc, u.url as website, count(distinct a) as nb_as, count(distinct f) as nb_fac
    `
  return [{ statement: query, parameters: { id: props.ixpNumber } }]
}
const overview = ref({})
const loadingStatus = ref(false)
const references = ref(REFERENCES)

const fetchData = async () => {
  let queries = getOverview()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    overview.value = res[0][0]
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }

  if (props.title !== undefined) {
    props.title(overview.value.name)
  }
}

const handleReference = (key) => {
  let externalLink = ''
  if (key === 'peeringDB' && props.ixpNumber) {
  externalLink = `${references.value.peeringDB}/${props.ixpNumber}`
  }
  return externalLink
}

watch(() => props.ixpNumber, () => {
  fetchData()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div>
    <QMarkupTable separator="horizontal">
      <div v-if="loadingStatus" class="IHR_loading-spinner">
        <QSpinner color="secondary" size="15em"/>
      </div>
      <thead>
        <tr>
          <th class="text-left">Summary</th>
          <th class="text-left">Stats</th>
          <th class="text-left">External Links</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-left">
            <div v-if="overview.name">
              <div>Country: <RouterLink :to="Tr.i18nRoute({ name: 'country', params: { cc: overview.cc } })">{{ overview.country }}</RouterLink></div>
              <div>Organization: {{ overview.organization }}</div>
              <div>
                Website: <a :href="overview.website" target="_blank" rel="noopener noreferrer">{{ overview.website }}</a>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="overview.name">
              <div>Nb. ASes: {{ overview.nb_as }}</div>
              <div>Nb. Co-location: {{ overview.nb_fac }}</div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="overview.name">
              <div v-for="(value, key) in references" :key="key">
                <a v-if="handleReference(key)" :href="handleReference(key)" target="_blank" rel="noreferrer">
                  {{ key }}
                </a>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </QMarkupTable>
  </div>
</template>

<style lang="stylus">
p {
  font-size: 1rem;
  margin-bottom: 0;
}
h3 {
  font-size: 1rem;
  line-height: 1.5
}
.overview-footer {
  text-decoration: underline;
  cursor: pointer;
  width: 100%;
  text-align: right;
}
</style>
