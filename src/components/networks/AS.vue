<script setup>
import DashboardController from '@/components/controllers/DashboardController.vue'
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel, event } from 'quasar'
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

let reportDate = report(timeRange)

if (route.query.date && route.query.date != reportDate.endTime.toISOString().split('T')[0]) {
  reportDate = report(timeRange, new Date(route.query.date))
}

const navigation = ref([
  { label: 'Overview', icon: 'article', value: 'overview' },
  { label: 'Monitoring', icon: 'monitor_heart', value: 'monitoring' },
  { label: 'Routing', icon: 'route', value: 'routing' },
  { label: 'DNS', icon: 'dns', value: 'dns' },
  { label: 'Peering', icon: 'diversity_2', value: 'peering' },
  { label: 'Registration', icon: 'app_registration', value: 'registration' },
  { label: 'Rankings', icon: 'leaderboard', value: 'rankings' },
  { label: 'Custom', icon: 'dashboard_customize', value: 'custom' }
])

const activeMenu = route.query.active ? route.query.active : 'overview'

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const asNumber = ref(Number(route.params.id.replace('AS', '')))
const asName = ref(null)
const asTags = ref([])
const menu = ref(activeMenu)
const peeringdbId = ref(null)
const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)
const peeringdbNetId = ref(null)

const references = ref([
  { label: 'bgp.he.net', value: `https://bgp.he.net/AS${asNumber.value}` },
  { label: 'bgp.tools', value: `https://bgp.tools/as/${asNumber.value}` },
  { label: 'PeeringDB', value: `https://www.peeringdb.com/net/${peeringdbNetId.value}` },
  { label: 'Cloudflare Radar', value: `https://radar.cloudflare.com/AS${asNumber.value}` },
  { label: 'RIPEstat', value: `https://stat.ripe.net/app/launchpad/AS${asNumber.value}` }
])

const getInfo = () => {
  const query = `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (a)-[:EXTERNAL_ID]->(p:PeeringdbNetID)
      RETURN COALESCE(pdbn.name, btn.name, ripen.name) AS name, collect(DISTINCT(t.label)) as tags, p.id AS peeringdbNetId`
  return [{ statement: query, parameters: { asn: asNumber.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    asName.value = res[0][0].name
    asTags.value = res[0][0].tags
    peeringdbNetId.value = res[0][0].peeringdbNetId
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
        last: reportDate.interval.dayDiff(),
        date: reportDate.endTime.toISOString().split('T')[0],
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
    return { title: `AS${asNumber.value}`, subtitle: '' }
  }
  return { title: `AS${asNumber.value}`, subtitle: asName.value }
})

const toggleIpFamily = () => {
  addressFamily.value = addressFamily.value == AS_FAMILY.v4 ? AS_FAMILY.v6 : AS_FAMILY.v4
}

const changeSlot = (event) => {
  menu.value = event
}

const changeEndTime = (event) => {
  reportDate = report(event.diffDays, event.to)
  pushRoute()
}

const changeAf = (event) => {
  addressFamily.value = event
  pushRoute()
}

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

watch(peeringdbNetId, () => {
  references.value.forEach((obj) => {
    if (obj.value.includes('peeringdb.com')) {
      obj.value = `https://www.peeringdb.com/net/${peeringdbNetId.value}`
    }
  })
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
  <DashboardController
    :navigation="navigation"
    :title="pageTitle.title"
    :subtitle="pageTitle.subtitle"
    :tags="asTags"
    :start-time="reportDate.startTime"
    :end-time="reportDate.endTime"
    :active-slot="menu"
    :address-family="Number(addressFamily)"
    :external="references"
    @change-slot="changeSlot"
    @change-end-time="changeEndTime"
    @change-af="changeAf"
  >
    <q-tab-panels v-model="menu">
      <q-tab-panel name="overview">
        <ASOverview :as-number="asNumber" :peeringdb-id="setPeeringdbId" />
      </q-tab-panel>
      <q-tab-panel name="monitoring"> test456 </q-tab-panel>
      <q-tab-panel name="routing"> test789 </q-tab-panel>
      <q-tab-panel name="dns"> test123123 </q-tab-panel>
      <q-tab-panel name="peering"> test123456 </q-tab-panel>
      <q-tab-panel name="registration"> test123789 </q-tab-panel>
      <q-tab-panel name="rankings"> test123123123 </q-tab-panel>
      <q-tab-panel name="custom"> test123123456 </q-tab-panel>
    </q-tab-panels>
  </DashboardController>
  <!-- <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer">
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
  </div> -->
</template>

<style>
.cards {
  display: inline-block;
}
</style>
