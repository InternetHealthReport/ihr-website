<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ pageTitle }}</h1>
    <div>
      <q-chip clickable @click="handleReference" color="gray" text-color="black"> PeeringDB </q-chip>
    </div>
    <div>
      <q-list>
        <Overview :id="id" :title="setTitle" />

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.ixp.members.title')"
          caption="Member Autonomous Systems (ASes)"
          header-class="IHR_charts-title"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable
                :data="members"
                :columns="membersColumns"
                :loading-status="this.loadingStatus.members"
                :cypher-query="cypherQueries.members"
                :slot-length="1"
              >
                <GenericPieChart v-if="members.length > 0" :chart-data="members" :chart-layout="{ title: 'Country' }" />
              </GenericTable>
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.ixp.facilities.title')"
          caption="Facilities"
          header-class="IHR_charts-title"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable
                :data="facilities"
                :columns="facilitiesColumns"
                :loading-status="this.loadingStatus.facilities"
                :cypher-query="cypherQueries.facilities"
                :slot-length="1"
              >
                <GenericPieChart v-if="facilities.length > 0" :chart-data="facilities" :chart-layout="{ title: 'Country' }" />
              </GenericTable>
            </q-card>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="this.handleClick"
          :label="$t('iyp.ixp.peeringLANs.title')"
          caption="Peering LANs of an IXP"
          header-class="IHR_charts-title"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <GenericTable
                :data="peeringLANs"
                :columns="peeringLANsColumns"
                :loading-status="this.loadingStatus.peeringLANs"
                :cypher-query="cypherQueries.peeringLANs"
                :slot-length="1"
              >
                <GenericPieChart v-if="peeringLANs.length > 0" :chart-data="peeringLANs" :chart-layout="{ title: 'Country' }" />
              </GenericTable>
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
import GenericPieChart from '@/views/charts/iyp/GenericPieChart'

const references = {
  peeringDB: 'https://www.peeringdb.com/ix',
}

const expansionItems = {
  members: {
    title: 'Members',
    subTitle: 'Member Autonomous Systems (ASes)',
  },
  facilities: {
    title: 'Co-Location Facilities',
    subTitle: 'Facilities',
  },
  peeringLANs: {
    title: 'Peering LANs',
    subTitle: 'Peering LANs Of An IXP',
  },
}

export default {
  components: {
    Overview,
    GenericTable,
    QChip,
    GenericPieChart,
  },
  data() {
    return {
      id: null,
      pageTitle: 'IXP',
      prefixesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val}`, sortable: true },
      ],
      membersColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS ${val}`, sortable: true },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      facilitiesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Facility', label: 'Facility', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      peeringLANsColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true },
      ],
      prefixes: [],
      members: [],
      facilities: [],
      peeringLANs: [],
      cypherQueries: {},
      tableVisible: true,
      loadingStatus: {
        members: false,
        facilities: false,
        peeringLANs: false,
      },
      show: {
        overview: true,
        members: false,
        facilities: false,
        peeringLANs: false,
      },
      count: {
        members: 0,
        facilities: 0,
        peeringLANs: 0,
      },
    }
  },
  created() {
    this.id = parseInt(this.$route.params.id)
  },
  async mounted() {},
  methods: {
    // getData will run multiple queries in parallel
    // This method is not in use
    async getData() {
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
        `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MEMBER_OF]-(a:AS)
         OPTIONAL MATCH (a)-[:NAME]->(n:Name)
         OPTIONAL MATCH (a)-[:COUNTRY {reference_org: $org}]->(c:Country)
         RETURN c.country_code AS cc, a.asn AS asn, head(collect(n.name)) AS name
        `
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { id: this.id, org: 'NRO' }, mapping, data: 'members' }
    },
    getFacilities() {
      const query =
        `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)-[:LOCATED_IN]->(f:Facility)
         OPTIONAL MATCH (f)-[:COUNTRY]->(c:Country)
         RETURN f.name as name, c.country_code AS cc
        `
      const mapping = {
        name: 'name',
        cc: 'cc',
      }
      return { cypherQuery: query, params: { id: this.id }, mapping, data: 'facilities' }
    },
    getPeeringLANs() {
      const query =
        `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MANAGED_BY]-(s:Prefix)
         OPTIONAL MATCH (s)-[:COUNTRY]->(c:Country)
         RETURN s.prefix as prefix, c.country_code as cc
        `
      const mapping = {
        prefix: 'prefix',
        cc: 'cc',
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
    async handleClick(e) {
      console.log(e.srcElement.innerText)
      const clickedItem = e.srcElement.innerText

      let query = {}
      if (clickedItem === expansionItems.members.title || clickedItem === expansionItems.members.subTitle) {
        query = this.getMembers()
      } else if (clickedItem === expansionItems.facilities.title || clickedItem === expansionItems.facilities.subTitle) {
        query = this.getFacilities()
      } else if (clickedItem === expansionItems.peeringLANs.title || clickedItem === expansionItems.peeringLANs.subTitle) {
        query = this.getPeeringLANs()
      } else {
        return
      }

      this.count[query.data] += 1
      if (this.count[query.data] > 1) {
        return
      }
      console.log(`${this.count[query.data]} time`)
      this.loadingStatus[query.data] = true
      const results = await this.$iyp_api.run(query.cypherQuery, query.params)
      const formattedRes = this.$iyp_api.formatResponse(results, query.mapping)
      this[query.data] = formattedRes

      this.cypherQueries[query.data] = query.cypherQuery
      this.loadingStatus[query.data] = false
    },
  },
}
</script>

<style lang="stylus">
@import "~@/styles/quasar.variables.styl";
</style>
