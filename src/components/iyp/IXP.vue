<script setup>
import { QList, QExpansionItem, QSeparator, QCard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import IXPOverview from './IXPOverview.vue'
import IypGenericTable from '../tables/IypGenericTable.vue'
import IypGenericPieChart from '../charts/IypGenericPieChart.vue'

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const id = ref(Number(route.params.id.replace('IXP','')))
const pageTitle = ref('IXP')
const sections = ref({
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
  }
})

const setTitle = (title) => {
  pageTitle.value = title
}

const loadSection = (key) => {
  // Don't do anything if already loaded
  if(!sections.value[key].loading){
    return
  }

  // Run the cypher query
  let query_params = { id: id.value }
  iyp_api.run(sections.value[key].query, query_params).then(
    results => {
      sections.value[key].data = results.records
      sections.value[key].loading = false
    }
  )
}
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <QList>
        <IXPOverview :id="id" :title="setTitle" />

        <QExpansionItem
          @click="loadSection('members')"
          :label="$t('iyp.ixp.members.title')"
          caption="Member Autonomous Systems (ASes)"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.members.data"
              :columns="sections.members.columns"
              :loading-status="sections.members.loading"
              :cypher-query="sections.members.query"
              :slot-length="1"
            >
              <IypGenericPieChart v-if="sections.members.data.length > 0" :chart-data="sections.members.data" :chart-layout="{ title: 'Country' }" />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('facilities')"
          :label="$t('iyp.ixp.facilities.title')"
          caption="Facilities"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.facilities.data"
              :columns="sections.facilities.columns"
              :loading-status="sections.facilities.loading"
              :cypher-query="sections.facilities.query"
              :slot-length="1"
            >
              <IypGenericPieChart v-if="sections.facilities.data.length > 0" :chart-data="sections.facilities.data" :chart-layout="{ title: 'Country' }" />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('peeringLANs')"
          :label="$t('iyp.ixp.peeringLANs.title')"
          caption="Peering LANs of an IXP"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.peeringLANs.data"
              :columns="sections.peeringLANs.columns"
              :loading-status="sections.peeringLANs.loading"
              :cypher-query="sections.peeringLANs.query"
              :slot-length="1"
            >
              <IypGenericPieChart v-if="sections.peeringLANs.data.length > 0" :chart-data="sections.peeringLANs.data" :chart-layout="{ title: 'Country' }" />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>
      </QList>
    </div>
  </div>
</template>