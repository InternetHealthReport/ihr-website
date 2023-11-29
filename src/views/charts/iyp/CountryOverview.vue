<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <div>
      <div class="q-pl-sm q-mt-lg q-mb-lg">
        <h2 class="q-mb-sm">Overview</h2>
        <div class="q-pl-md">
          <div>
            <p>{{ overview.asCount }} Registered ASes</p>
            <p>{{ overview.prefixesCount }} prefixes geolocated in {{ countryCode }}</p>
            <p>Internet Exchange Points: {{ overview.ixpsCount }}</p>
            <p>Country Code: {{ countryCode }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

const references = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad',
}


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
    await this.fetchData(this.countryCode)
  },
  methods: {
    async fetchData(cc) {
      const queries = this.getOverview(cc)
      this.loadingStatus = true

      let res = await this.$iyp_api.runManyInOneSessionAndReturnAnObject(queries)
      this.firstPart = res.firstPart[0]
      if (this.title !== undefined) {
        this.title(this.firstPart.country_name)
      }

      this.loadingStatus = false
    },
    getOverview(country_code) {
      const queryOne = `MATCH (c:Country {country_code: $cc})
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(a:AS) WITH c, COUNT(DISTINCT a) as as_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "peeringdb.ix"}]-(i:IXP) WITH c, COUNT(DISTINCT a) as as_count, COUNT(DISTINCT i) as ixp_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(pd:Prefix) WITH c, COUNT(DISTINCT a) as as_count, COUNT(DISTINCT i) as ixp_count, COUNT(DISTINCT pd) as preg_count, COUNT(DISTINCT pg) as pgeo_count
         OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "ihr.rov"}]-(pg:Prefix) WITH c, COUNT(DISTINCT a) as as_count, COUNT(DISTINCT i) as ixp_count, COUNT(DISTINCT pd) as preg_count, COUNT(DISTINCT pg) as pgeo_count
         RETURN c.name AS country_name, as_count, ixp_count, preg_count, pgeo_count
        `
      const mappingOne = {
        country_name: 'country_name',
        as_count: 'as_count',
        ixp_count: 'ixp_count',
        preg_count: 'preg_count',
        pgeo_count: 'pgeo_count',
      }
      let cc = country_code.toUpperCase()
      return  [{ cypherQuery: queryOne, params: { cc }, mapping: mappingOne, data: 'firstPart' }]
    },

    handleReference(key) {
      let externalLink = ''
      let cc = this.countryCode

      if (key === 'bgp.he.net') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'radar.cloudflare.com') {
        externalLink = `${references[key]}/${cc}`
      } else if (key === 'stat.ripe.net') {
        externalLink = `${references[key]}/${cc}`
      } else {
        console.log('none')
        return
      }
      return externalLink
    },
  },
  watch: {
    async countryCode(newCC, oldCC) {
      this.loadingStatus = true
      await this.fetchData(newCC)
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
