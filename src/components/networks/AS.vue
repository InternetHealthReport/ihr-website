<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import ASOverview from '@/components/networks/as/ASOverview.vue'
import ASMonitoring from '@/components/networks/as/ASMonitoring.vue'
import ASRouting from '@/components/networks/as/ASRouting.vue'
import ASDNS from '@/components/networks/as/ASDNS.vue'
import ASPeering from '@/components/networks/as/ASPeering.vue'
import ASRegistration from '@/components/networks/as/ASRegistration.vue'
import ASRankings from '@/components/networks/as/ASRankings.vue'
import ASCustom from '@/components/networks/as/ASCustom.vue'
import DateTimePicker from '@/components/DateTimePicker.vue'
import { AS_FAMILY } from '@/plugins/IhrApi'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const timeRange = route.query.last ? route.query.last : 3

let {
  interval,
  utcString,
  fetch,
  reportDateFmt,
  minDate,
  maxDate,
  setReportDate,
  startTime,
  endTime
} = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const activeMenu = route.query.active ? route.query.active : 'overview'

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const asNumber = ref(Number(route.params.id.replace('AS', '')))
const asName = ref(null)
const menu = ref(activeMenu)
const peeringdbId = ref(null)
const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)

const getInfo = () => {
  const query = `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN COALESCE(pdbn.name, btn.name, ripen.name) AS name`
  return [{ statement: query, parameters: { asn: asNumber.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    asName.value = res[0][0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const setPeeringdbId = (id) => {
  peeringdbId.value = id
}

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        af: family.value,
        last: interval.value.dayDiff(),
        date: utcString(interval.value.end).split('T')[0],
        active: menu.value ? menu.value : activeMenu
      })
    })
  )
}

const family = computed(() => {
  return addressFamily.value == 6 ? AS_FAMILY.v6 : AS_FAMILY.v4
})

const pageTitle = computed(() => {
  if (!asName.value) {
    return `AS${asNumber.value}`
  }
  return `AS${asNumber.value} - ${asName.value}`
})

const toggleIpFamily = () => {
  addressFamily.value = addressFamily.value == AS_FAMILY.v4 ? AS_FAMILY.v6 : AS_FAMILY.v4
}

watch(addressFamily, () => {
  pushRoute()
})
watch(
  () => route.params.id,
  (asn) => {
    const newAsn = Number(asn.replace('AS', ''))
    if (newAsn != asNumber.value) {
      asNumber.value = newAsn
      if (asNumber.value) {
        pushRoute()
        fetchData()
      }
    }
  }
)
watch(interval, () => {
  pushRoute()
})
watch(
  () => route.query.active,
  (active) => {
    if (active != menu.value) {
      menu.value = active
    }
  }
)
watch(menu, () => {
  if ('display' in route.query && !route.hash.includes('#')) {
    delete route.query.display
  }
  pushRoute()
})
onMounted(() => {
  if (asNumber.value) {
    pushRoute()
    fetchData()
  } else {
    router.push(
      Tr.i18nRoute({
        name: 'network'
      })
    )
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer">
    <h1 class="text-center">
      {{ pageTitle }}
    </h1>
    <h3 class="text-center">
      <div v-if="['monitoring', 'custom'].includes(menu)">
        {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
        <DateTimePicker
          :min="minDate"
          :max="maxDate"
          :value="endTime"
          hide-time
          @input="setReportDate"
        />
      </div>
      <div v-else>Weekly report</div>
    </h3>
    <QCard flat>
      <QTabs
        v-model="menu"
        dense
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="overview"> Overview </QTab>
        <QTab name="monitoring"> Monitoring </QTab>
        <QTab name="routing"> Routing </QTab>
        <QTab name="dns"> DNS </QTab>
        <QTab name="peering"> Peering </QTab>
        <QTab name="registration"> Registration </QTab>
        <QTab name="rankings"> Rankings </QTab>
        <QTab name="custom"> Custom </QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels v-if="pageTitle" v-model="menu">
        <QTabPanel name="overview">
          <ASOverview :as-number="asNumber" :peeringdb-id="setPeeringdbId" />
        </QTabPanel>
        <QTabPanel name="monitoring">
          <ASMonitoring
            :start-time="startTime"
            :end-time="endTime"
            :as-number="asNumber"
            :family="family"
            :page-title="pageTitle"
            :interval="interval"
            @toggle-ip-family="toggleIpFamily"
          />
        </QTabPanel>
        <QTabPanel name="routing">
          <ASRouting :as-number="asNumber" :page-title="pageTitle" />
        </QTabPanel>
        <QTabPanel name="dns">
          <ASDNS :as-number="asNumber" :page-title="pageTitle" />
        </QTabPanel>
        <QTabPanel name="peering">
          <ASPeering :as-number="asNumber" :page-title="pageTitle" />
        </QTabPanel>
        <QTabPanel name="registration">
          <ASRegistration :as-number="asNumber" :page-title="pageTitle" />
        </QTabPanel>
        <QTabPanel name="rankings">
          <ASRankings :as-number="asNumber" :page-title="pageTitle" />
        </QTabPanel>
        <QTabPanel name="custom">
          <ASCustom
            :start-time="startTime"
            :end-time="endTime"
            :as-number="asNumber"
            :family="family"
            :page-title="pageTitle"
            :peeringdb-id="setPeeringdbId"
            :interval="interval"
            :hash="routeHash"
            @toggle-ip-family="toggleIpFamily"
          />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style>
.cards {
  display: inline-block;
}
</style>
