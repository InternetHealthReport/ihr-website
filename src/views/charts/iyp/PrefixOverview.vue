<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <div class="q-pl-sm q-mt-lg q-mb-lg">
      <h2 class="q-mb-sm">Overview</h2>
      <div class="q-pl-md">
        <div>
          <p>Prefix: {{ overview.prefix }}</p>
          <p>Desc: {{ overview.description }}</p>
          <p>Originating ASN: {{ overview.asn }}</p>
          <p>Originating AS Name: {{ overview.name }}</p>
          <p>Country of origin: {{ overview.cc }}</p>
          <p>Categorized Tags: {{ overview.tags }}</p>
        </div>
      </div>
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
        `MATCH (p:Prefix {prefix: $prefix})<-[o:ORIGINATE]-(a:AS)
         OPTIONAL MATCH (a)-[:NAME]->(n:Name)
         OPTIONAL MATCH(p)-[:COUNTRY]->(c:Country)
         OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
         RETURN p.prefix AS prefix, head(collect(DISTINCT(o.descr))) AS descr, head(collect(DISTINCT(a.asn))) AS asn, head(collect(DISTINCT(n.name))) AS name, head(collect(DISTINCT(c.country_code))) AS cc, collect(DISTINCT(t.label)) AS tags
        `
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
