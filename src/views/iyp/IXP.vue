<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ pageTitle }}</h1>
    <div>
      <q-chip clickable @click="handleReference" color="blue" text-color="white"> PeeringDB </q-chip>
    </div>
    <div>
      <q-list>
        <q-expansion-item
          :label="$t('iyp.overview.ixp.title')"
          caption="Overview of an IXP"
          header-class="IHR_charts-title"
          v-model="show.overview"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <Overview :id="id" :title="setTitle" />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.ixp.members.title')" caption="Member Autonomous Systems (ASes)" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="members" :columns="membersColumns" :cypher-query="cypherQueries.members" />
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.ixp.facilities.title')" caption="Facilities" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="facilities" :columns="facilitiesColumns" :cypher-query="cypherQueries.facilities" />
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.ixp.peeringLANs.title')" caption="Peering LANs of an IXP" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable :data="peeringLANs" :columns="peeringLANsColumns" :cypher-query="cypherQueries.peeringLANs" />
            </q-card>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import { QChip } from 'quasar'
import Overview from '@/views/charts/iyp/IXPOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
const references = {
  peeringDB: 'https://www.peeringdb.com/ix',
}
export default {
  components: {
    Overview,
    GenericTable,
    QChip,
  },
  data() {
    return {
      id: null,
      pageTitle: 'IXP',
      prefixesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}` },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}` },
      ],
      membersColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS ${val}` },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      facilitiesColumns: [{ name: 'Facility', label: 'Facility', align: 'left', field: row => row.name, format: val => `${val}` }],
      peeringLANsColumns: [{ name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}` }],
      prefixes: [],
      members: [],
      facilities: [],
      peeringLANs: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
      },
    }
  },
  created() {
    this.id = parseInt(this.$route.params.id)
  },
  async mounted() {
    const queries = [this.getMembers(), this.getFacilities(), this.getPeeringLANs()]
    let res = await this.$iyp_api.runManyAndGetFormattedResponse(queries)
    console.log(res)
    this.members = res.members
    this.facilities = res.facilities
    this.peeringLANs = res.peeringLANs
    let queriesObj = {}
    queries.forEach(query => {
      queriesObj[query.data] = query.cypherQuery
    })
    this.cypherQueries = queriesObj
  },
  methods: {
    // ases stands for autonomous systems
    getPrefixes() {
      const query =
        'MATCH (c:Country {country_code: $cc})-[r]-(a:AS)-[:NAME]-(n:Name) WITH c.country_code AS cc, a.asn AS asn, collect(DISTINCT(n.name)) AS name RETURN cc, asn, name LIMIT 100'
      const mapping = {
        cc: 'cc',
        prefix: 'prefix',
        tags: 'tags',
      }
      return { cypherQuery: query, params: { id: this.id }, mapping, data: 'prefixes' }
    },
    getMembers() {
      const query =
        'MATCH (p:PeeringdbIXID {id: $id})-[:EXTERNAL_ID]-(i:IXP)-[:MEMBER_OF]-(a:AS)-[:NAME]-(n:Name) MATCH (a)-[:COUNTRY]-(c:Country) RETURN collect(DISTINCT(c.country_code)) AS cc, a.asn AS asn, head(collect(DISTINCT(n.name))) AS name'
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { id: this.id }, mapping, data: 'members' }
    },
    getFacilities() {
      const query = 'MATCH (p:PeeringdbIXID {id: $id})-[:EXTERNAL_ID]-(i:IXP)-[:LOCATED_IN]-(f:Facility) RETURN f.name as name'
      const mapping = {
        name: 'name',
      }
      return { cypherQuery: query, params: { id: this.id }, mapping, data: 'facilities' }
    },
    getPeeringLANs() {
      const query = 'MATCH (p:PeeringdbIXID {id: $id})-[:EXTERNAL_ID]-(i:IXP)<-[:MANAGED_BY]-(s:Prefix) RETURN s.prefix as prefix'
      const mapping = {
        prefix: 'prefix',
      }
      return { cypherQuery: query, params: { id: this.id }, mapping, data: 'peeringLANs' }
    },
    setTitle(title) {
      this.pageTitle = title
    },
    handleReference(e) {
      console.log('Redirect')
      console.log(e.srcElement.outerText)
      let reference = e.srcElement.outerText.trim()
      let externalLink = ''
      if (reference === 'PeeringDB') {
        externalLink = `${references.peeringDB}/${this.id}`
      }
      console.log(externalLink)
      window.open(externalLink, '_blank')
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
