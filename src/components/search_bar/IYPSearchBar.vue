<template>
  <div>
    <div ref="searchInputContainer">
      <q-input v-model="search" @focus="handleFocus" @blur="handleBlur" filled type="search" placeholder="Search">
        <template v-slot:append>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <div>
      <q-list v-if="search.trim().length >= 2" bordered separator>
        <q-item v-for="(res, idx) in results" :key="idx" clickable v-ripple @click="routeToEntity(res)">
          <q-item-section>
            <q-item-label>{{ res.name }}</q-item-label>
            <q-item-label caption>{{ concatIdAndNode(res) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchInputContainer: null,
      isInputFocused: null,
      search: '',
      results: [],
    }
  },
  mounted() {
    this.searchInputContainer = this.$refs.searchInputContainer.querySelector('input')
    this.searchInputContainer.focus()
  },
  computed: {
    isSearchInputFocused() {
      return this.isInputFocused
    },
  },
  methods: {
    async performSearch(value) {
      if (value.length > 30) {
        return
      }

      // Validating if the value is an ASN, Country, IXP, or a Prefix
      const asnRegex = /^(as)?(\d+)$/i
      const asnMatch = asnRegex.exec(value)
      const prefixRegex = /^(?:(?:\d{1,3}\.){0,3}\d{0,3}(?:\/\d{1,2})?|(?:[0-9a-fA-F]{1,4}:){0,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?)$/
      const prefixMatch = prefixRegex.exec(value)

      if (asnMatch) {
        const res = await this.queryAS(asnMatch[2])
        this.results = res
      } else if (prefixMatch) {
        const res = await this.queryPrefixes(prefixMatch.input)
        this.results = res
      } else {
        // Mixed search of AS name, country, and ixp
        const res = await this.mixedEntitySearch(value)
        this.results = res
      }
    },
    async queryAS(asn) {
      const query =
        'MATCH (a:AS) WHERE toString(a.asn) STARTS WITH $asn MATCH (a)-[:NAME]-(n:Name) RETURN a.asn as asn, head(collect(DISTINCT(n.name))) as name, head(labels(a)) AS node LIMIT 10'
      const mapping = {
        id: 'asn',
        name: 'name',
        node: 'node',
      }
      const res = await this.$iyp_api.run(query, { asn: asn })
      const formattedRes = this.$iyp_api.formatResponse(res, mapping)
      return formattedRes
    },
    async queryPrefixes(value) {
      const query = 'MATCH (p:Prefix) WHERE p.prefix STARTS WITH $value RETURN p.prefix as prefix, head(labels(p)) AS node LIMIT 10'
      const mapping = {
        name: 'prefix',
        node: 'node',
      }
      const res = await this.$iyp_api.run(query, { value: value })
      const formattedRes = this.$iyp_api.formatResponse(res, mapping)
      return formattedRes
    },
    async mixedEntitySearch(value) {
      const searchTerm = value.toLowerCase()
      const queries = [this.queryASNames(searchTerm), this.queryIXPs(searchTerm)]
      let res = await this.$iyp_api.searchIYP(queries)
      return res
    },
    queryASNames(value) {
      const query =
        'MATCH (n:Name)-[:NAME]-(a:AS) WHERE toLower(n.name) STARTS WITH $value MATCH (n)-[:NAME]-(a:AS) RETURN head(collect(DISTINCT(n.name))) AS as, a.asn AS id, head(labels(a)) AS node LIMIT 10'
      const mapping = {
        name: 'as',
        id: 'id',
        node: 'node',
      }
      return { cypherQuery: query, params: { value: value }, mapping }
    },
    queryCountries(value) {
      const query = ''
    },
    queryIXPs(value) {
      const query =
        'MATCH (i:IXP)-[:EXTERNAL_ID]-(p:PeeringdbIXID) WHERE toLower(i.name) STARTS WITH $value RETURN i.name as ixp, p.id as id, head(labels(i)) AS node LIMIT 10'
      const mapping = {
        name: 'ixp',
        id: 'id',
        node: 'node',
      }
      return { cypherQuery: query, params: { value: value }, mapping }
    },
    routeToEntity(res) {
      if (res.node == 'AS') {
        this.routeToAS(res.id.low)
      } else if (res.node == 'IXP') {
        this.routeToIXP(res.id)
      } else if (res.node == 'Prefix') {
        console.log('Prefix')
        console.log(res)
        const [host, prefixLength] = res.name.split('/')
        this.routeToPrefix(host, prefixLength)
      } else if (res.node == 'CC') {
        console.log('CC')
      } else {
        console.log('none')
        return
      }
    },
    routeToAS(asn) {
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: asn },
      })
    },
    routeToCC(cc) {
      this.$router.push({
        name: 'iyp_country',
        params: { cc: cc },
      })
    },
    routeToIXP(ixp) {
      this.$router.push({
        name: 'iyp_ixp',
        params: { id: ixp },
      })
    },
    routeToPrefix(host, prefixLength) {
      this.$router.push({
        name: 'iyp_prefix',
        params: { host: host, prefix_length: prefixLength },
      })
    },
    handleFocus() {
      this.isInputFocused = true
    },
    handleBlur() {
      this.isInputFocused = false
    },
    concatIdAndNode(res) {
      if (res.node == 'Prefix') {
        return
      }
      return `${res.node} ${res.id}`
    },
  },
  watch: {
    search(newValue, oldValue) {
      // console.log(`old: ${oldValue}, new: ${newValue}`)
      if (newValue.length <= 2) {
        return
      }
      this.performSearch(newValue)
    },
  },
}
</script>

<style></style>
