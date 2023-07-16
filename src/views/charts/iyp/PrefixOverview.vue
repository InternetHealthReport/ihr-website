<template>
  <div>
    <div v-if="loadingStatus" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div>
      <p>Prefix: {{ overview.prefix }}</p>
      <p>Desc: {{ overview.description }}</p>
      <p>Originating ASN: {{ overview.asn }}</p>
      <p>Originating AS Name: {{ overview.name }}</p>
      <p>Country of origin: {{ overview.cc }}</p>
      <p>Categorized Tags: {{ overview.tags }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    host: {
      type: String,
      required: true,
    },
    prefixLength: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      overview: {},
      loadingStatus: false,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      const query =
        'MATCH (p:Prefix {prefix: $prefix})-[o:ORIGINATE]-(a:AS)-[:NAME]-(n:Name) MATCH(p)-[:COUNTRY]-(c:Country) MATCH (p)-[:CATEGORIZED]-(t:Tag) RETURN p.prefix AS prefix, o.descr AS descr, a.asn AS asn, head(collect(DISTINCT(n.name))) AS name, collect(DISTINCT(c.country_code)) AS cc, collect(DISTINCT(t.label)) AS tags'
      const mapping = {
        prefix: 'prefix',
        description: 'descr',
        asn: 'asn',
        name: 'name',
        cc: 'cc',
        tags: 'tags',
      }
      const prefix = this.getPrefix()
      console.log(prefix)
      const res = await this.$iyp_api.run(query, { prefix: prefix })
      const formattedRes = this.$iyp_api.formatResponse(res, mapping)
      console.log(formattedRes)
      const [data] = formattedRes
      this.overview = { ...data }
      this.loadingStatus = false
    },
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
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
