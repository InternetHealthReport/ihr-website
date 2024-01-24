<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import ASOverview from './ASOverview.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const timeRange = route.query.last ? route.query.last : 3

let { interval, utcString, fetch, reportDateFmt, minDate, maxDate, setReportDate, startTime, endTime } = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const loadingStatus = ref(false)
const asNumber = ref(Number(route.params.id.replace('AS','')))
const asName = ref(null)
const menu = ref('overview')
const peeringdbId = ref(null)

const getInfo = () => {
  const query = `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN COALESCE(pdbn.name, btn.name, ripen.name) AS name`
  const mapping = {
    name: 'name',
  }
  return [{ query: query, params: { asn: asNumber.value }, mapping, data: 'asName' }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.runManyInOneSessionAndReturnAnObject(queries)
    asName.value = res.asName[0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const setPeeringdbId = (id) => {
  peeringdbId.value = id
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">AS{{asNumber}} - {{asName}}</h1>
    <QCard>
      <QTabs
        v-model="menu"
        dense
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="overview">Overview</QTab>
        <QTab name="monitoring">Monitoring</QTab>
        <QTab name="routing">Routing</QTab>
        <QTab name="dns">DNS</QTab>
        <QTab name="peering">Peering</QTab>
        <QTab name="registration">Registration</QTab>
        <QTab name="all">All</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels
        v-model="menu"
      >
        <QTabPanel name="overview">
          <ASOverview :as-number="asNumber" :peeringdbId="setPeeringdbId" />
        </QTabPanel>
        <QTabPanel name="monitoring">
          123
        </QTabPanel>
        <QTabPanel name="routing">

        </QTabPanel>
        <QTabPanel name="dns">

        </QTabPanel>
        <QTabPanel name="peering">

        </QTabPanel>
        <QTabPanel name="registration">

        </QTabPanel>
        <QTabPanel name="all">

        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>