<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <h2 class="q-mb-sm">Overview</h2>
      <div class="q-pl-md">
        <div>
          <p>IXP Name: {{ overview.name }}</p>
          <p>Country of origin: {{ overview.country }}</p>
          <p>organization: {{ overview.organization }}</p>
          <p>
            Website: <a :href="overview.website" target="_blank" rel="noopener noreferrer">{{ overview.website }}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      loadingStatus: true,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      const query =
        'MATCH (p:PeeringdbIXID {id: $id})-[:EXTERNAL_ID]-(i:IXP)-[:MANAGED_BY]-(o:Organization) MATCH (i)-[:COUNTRY]-(c:Country) MATCH (i)-[:WEBSITE]-(u:URL) RETURN i.name as name, o.name as organization, c.country_code AS cc, u.url as website'
      const mapping = {
        name: 'name',
        cc: 'cc',
        organization: 'organization',
        website: 'website',
      }
      const response = await this.$iyp_api.run(query, { id: this.id })
      const formattedResponse = this.$iyp_api.formatResponse(response, mapping)
      console.log(formattedResponse)
      // this.overview.name = formattedResponse[0].name
      // this.overview.cc = formattedResponse[0].cc
      // this.overview.organization = formattedResponse[0].organization
      // this.overview.website = formattedResponse[0].website
      const [data] = formattedResponse
      this.overview = { ...data }

      if (this.title !== undefined) {
        this.title(this.overview.name)
      }

      this.loadingStatus = false
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
