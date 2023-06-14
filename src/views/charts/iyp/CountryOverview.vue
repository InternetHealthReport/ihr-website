<template>
  <div>
    <p>Country of origin: {{ countryCode }}</p>
    <p>Autonomus Systems: {{ overview.asCount }}</p>
    <p>Prefix count: {{ countryCode }} has {{ overview.prefixesCount }} prefix</p>
    <p>Internet Exchange Points: {{ asNumber }}</p>
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
  },
  data() {
    return {
      overview: {},
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      let query = new CountryOverviewQuery(this.countryCode)
      let countryOverview = await this.$iyp_api.getCountryOverview(query)
      this.overview = countryOverview
    },
  },
}
</script>
<style>
p {
  font-size: 1rem;
  margin-bottom: 0;
}
</style>
