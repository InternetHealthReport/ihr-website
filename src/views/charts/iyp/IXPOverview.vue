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
                  <a :href="handleReference(key)" v-for="(value, key) in references" :key="key" target="_blank" rel="noreferrer">{{
                    handleReference(key)
                  }}</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const references = {
  peeringDB: 'https://www.peeringdb.com/ix',
}

export default {
  props: {
    id: {
      type: Number,
      required: true,
    },
    title: {
      type: Function,
      required: false,
    },
  },
  data() {
    return {
      overview: {},
      loadingStatus: false,
      references: references,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      let queries = this.getOverview()

      this.loadingStatus = true

      try {
        let res = await this.$iyp_api.runManyInOneSessionAndReturnAnObject(queries)
        this.overview = res.overview[0]
        this.loadingStatus = false
      } catch (e) {
        this.loadingStatus = false
        return
      }

      if (this.title !== undefined) {
        this.title(this.overview.name)
      }
    },
    getOverview() {
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
      return [{ cypherQuery: query, params: { id: this.id }, mapping, data: 'overview' }]
    },
    handleReference(key) {
      let externalLink = ''
      if (key === 'peeringDB') {
        externalLink = `${references.peeringDB}/${this.id}`
      }
      return externalLink
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
