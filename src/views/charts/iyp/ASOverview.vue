<template>
  <div>
    <div v-if="loadingStatus" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div>
      <p>AS Name: {{ overview.name }}</p>
      <p>AS Number: {{ asNumber }}</p>
      <p>Country of origin: {{ overview.country }}</p>
      <p>
        Website: <a :href="overview.website" target="_blank" rel="noopener noreferrer">{{ overview.website }}</a>
      </p>
      <p>AS Prefix Count: AS{{ asNumber }} has {{ overview.prefixesCount }} prefixes</p>
      <p>AS Peers: AS{{ asNumber }} has {{ overview.peersCount }} peers</p>
      <p>AS Siblings: AS{{ asNumber }} has {{ overview.siblingsCount }} siblings</p>
    </div>
  </div>
</template>
<script>
import { ASOverviewQuery } from '../../../plugins/query/IypQuery'

export default {
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
    asName: {
      type: String,
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
      let query = new ASOverviewQuery(this.asNumber)
      try {
        let asOverview = await this.$iyp_api.getASOverview(query)
        this.overview = asOverview
        this.loadingStatus = false
      } catch (e) {
        console.error(e)
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
