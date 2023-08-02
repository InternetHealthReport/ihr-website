<template>
  <div>
    <div v-if="loadingStatus" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div>
      <p>Country of origin: {{ overview.country }}</p>
      <p>Country Code: {{ countryCode }}</p>
      <p>Autonomus Systems: {{ overview.asCount }}</p>
      <p>Prefix count: {{ countryCode }} has {{ overview.prefixesCount }} prefixes</p>
      <p>Internet Exchange Points: {{ overview.ixpsCount }}</p>
    </div>
  </div>
</template>

<script>
import { CountryOverviewQuery } from '../../../plugins/query/IypQuery'

export default {
  props: {
    countryCode: {
      type: String,
      required: true,
    },
    title: {
      type: Function,
      required: true,
    },
  },
  data() {
    return {
      overview: {},
      loadingStatus: true,
    }
  },
  async mounted() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      let query = new CountryOverviewQuery(this.countryCode, 'peeringdb.ix')
      try {
        let countryOverview = await this.$iyp_api.getCountryOverview(query)
        this.overview = countryOverview
        this.title(this.overview.country)
        this.loadingStatus = false
      } catch (e) {
        console.error(e)
        this.loadingStatus = false
      }
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
