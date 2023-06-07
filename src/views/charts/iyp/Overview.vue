<template>
  <div>
    <p>AS Name:</p>
    <p>AS Number: {{ asNumber }}</p>
    <p>Country of origin:</p>
    <p>Website:</p>
    <p>AS Prefix Count:</p>
    <p>AS Neighbours:</p>
  </div>
</template>
<script>
export default {
  props: {
    asNumber: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      overview: null,
    }
  },
  mounted() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      let query = 'MATCH (a:AS {asn: $asn})-[r:NAME]-(b) RETURN a, b'
      let res = await this.$iyp_api.run(query, { asn: this.asNumber })
      this.overview = res
      console.log(res)
    },
  },
}
</script>
<style></style>
