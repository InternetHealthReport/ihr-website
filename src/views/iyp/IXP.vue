<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :id="id" :title="setTitle" />

        <q-expansion-item
          @click="loadSection('members')"
          :label="$t('iyp.ixp.members.title')"
          caption="Member Autonomous Systems (ASes)"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.members.data"
              :columns="sections.members.columns"
              :loading-status="sections.members.loading"
              :cypher-query="sections.members.query"
              :slot-length="1"
            >
              <GenericPieChart v-if="sections.members.data.length > 0" :chart-data="sections.members.data" :chart-layout="{ title: 'Country' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('facilities')"
          :label="$t('iyp.ixp.facilities.title')"
          caption="Facilities"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.facilities.data"
              :columns="sections.facilities.columns"
              :loading-status="sections.facilities.loading"
              :cypher-query="sections.facilities.query"
              :slot-length="1"
            >
              <GenericPieChart v-if="sections.facilities.data.length > 0" :chart-data="sections.facilities.data" :chart-layout="{ title: 'Country' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="loadSection('peeringLANs')"
          :label="$t('iyp.ixp.peeringLANs.title')"
          caption="Peering LANs of an IXP"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="sections.peeringLANs.data"
              :columns="sections.peeringLANs.columns"
              :loading-status="sections.peeringLANs.loading"
              :cypher-query="sections.peeringLANs.query"
              :slot-length="1"
            >
              <GenericPieChart v-if="sections.peeringLANs.data.length > 0" :chart-data="sections.peeringLANs.data" :chart-layout="{ title: 'Country' }" />
            </GenericTable>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/IXPOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericPieChart from '@/views/charts/iyp/GenericPieChart'

export default {
  components: {
    Overview,
    GenericTable,
    GenericPieChart,
  },
  data() {
    return {
      id: null,
      pageTitle: 'IXP',
      sections: {

        members: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MEMBER_OF]-(a:AS)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
            OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
            OPTIONAL MATCH (a)-[:COUNTRY {reference_org: 'NRO'}]->(c:Country)
            RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS ${val}`, sortable: true },
            { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
          ]
        },

        facilities: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)-[:LOCATED_IN]->(f:Facility)OPTIONAL MATCH (f)-[:COUNTRY]->(c:Country)
            RETURN f.name as name, c.country_code AS cc`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Facility', label: 'Facility', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
          ]
        },

        peeringLANs: {
          data: [],
          show: false,
          loading: true,
          query: `MATCH (:PeeringdbIXID {id: $id})<-[:EXTERNAL_ID]-(:IXP)<-[:MANAGED_BY]-(s:Prefix)OPTIONAL MATCH (s)-[:COUNTRY]->(c:Country)
            RETURN s.prefix as prefix, c.country_code as cc`,
          columns: [
            { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
            { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
          ]
        },

      }
    }
  },
  created() {
    this.id = parseInt(this.$route.params.id)
  },
  methods: {
    setTitle(title) {
      this.pageTitle = title
    },
    loadSection(key){

      // Don't do anything if already loaded
      if(!this.sections[key].loading){
        return
      }

      // Run the cypher query
      let query_params = { id: this.id }
      this.$iyp_api.run(this.sections[key].query, query_params).then(
        results => {
          this.sections[key].data = results.records
          this.sections[key].loading = false
        }
      )
    },
  },
  watch: {
    '$route.params.id': {
      handler: function (id) {
        if (parseInt(id) != this.id) {
          this.id = parseInt(id)

          // re-load opened sections
          let keys = Object.keys(this.sections)
          keys.forEach( key => {
            if( !this.sections[key].loading ){
              this.sections[key].loading = true
              this.loadSection(key)
            }
          })
        }
      },
      deep: true,
    },
  },
}
</script>

<style lang="stylus">
@import "~@/styles/quasar.variables.styl";
</style>
