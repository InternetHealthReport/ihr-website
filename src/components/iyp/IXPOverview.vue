<script setup>
import { ref, onMounted, inject } from 'vue'

const iyp_api = inject('iyp_api')

const REFERENCES = {
  peeringDB: 'https://www.peeringdb.com/ix',
}

const props = defineProps({
  id: {
    type: Number,
    required: true,
  },
  title: {
    type: Function,
    required: false,
  }
})

const overview = ref({})
const loadingStatus = ref(false)
const references = ref(REFERENCES)

const fetchData = async () => {
  let queries = getOverview()

  loadingStatus.value = true

  try {
    let res = await iyp_api.runManyInOneSessionAndReturnAnObject(queries)
    overview.value = res.overview[0]
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }

  if (props.title !== undefined) {
    props.title(overview.value.name)
  }
}

const getOverview = () => {
  const query = `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(i:IXP)
      OPTIONAL MATCH (i)-[:MANAGED_BY]->(o:Organization)
      OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
      OPTIONAL MATCH (i)-[:WEBSITE]->(u:URL)
      RETURN i.name as name, o.name as organization, c.name AS country, u.url as website
    `
  const mapping = {
    name: 'name',
    country: 'country',
    organization: 'organization',
    website: 'website',
  }
  return [{ query: query, params: { id: props.id }, mapping, data: 'overview' }]
}

const handleReference = (key) => {
  let externalLink = ''
  if (key === 'peeringDB') {
    externalLink = `${references.value.peeringDB}/${props.id}`
  }
  return externalLink
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <!-- <h2 class="q-mb-sm">Overview</h2> -->
      <div class="q-pl-md">
        <div class="row q-gutter-md q-mt-md justify-center">
          <div class="col-8">
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
</style>