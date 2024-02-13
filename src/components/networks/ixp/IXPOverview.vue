<script setup>
import { QChip, QSpinner } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'

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
      RETURN i.name as name, o.name as organization, c.name AS country, u.url as website
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
  if (key === 'peeringDB') {
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
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <QSpinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <!-- <h2 class="q-mb-sm">Overview</h2> -->
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-10">
            <div class="row q-gutter-md">
              <div class="col-12 col-md-auto">
                <h3>IXP Info</h3>
                <div>
                  <p>IXP Name: {{ overview.name }}</p>
                  <p>Country of origin: {{ overview.country }}</p>
                  <p>organization: {{ overview.organization }}</p>
                  <p>
                    Website: <a :href="overview.website" target="_blank" rel="noopener noreferrer">{{ overview.website }}</a>
                  </p>
                </div>
              </div>
              <div class="col-12 col-md-2">
                <h3>Reference</h3>
                <div class="column">
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="key" target="_blank" rel="noreferrer">
                    {{ handleReference(key) }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
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