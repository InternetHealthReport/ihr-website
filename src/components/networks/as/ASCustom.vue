<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import ASOverview from '@/components/networks/as/ASOverview.vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import AsInterdependenciesChart from '@/components/charts/AsInterdependenciesChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import DelayAndForwardingChart from '@/components/charts/DelayAndForwardingChart.vue'
import DiscoChart from '@/components/charts/DiscoChart.vue'
import IodaChart from '@/components/charts/IodaChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import ASConnectedASes from '@/components/iyp/as/ASConnectedASes.vue'
import ASOriginatedPrefixes from '@/components/iyp/as/ASOriginatedPrefixes.vue'
import ASRPKIRouteOriginAuthorization from '@/components/iyp/as/ASRPKIRouteOriginAuthorization.vue'
import ASDownstreamsASes from '@/components/iyp/as/ASDownstreamsASes.vue'
import ASUpstreamASes from '@/components/iyp/as/ASUpstreamASes.vue'
import ASRipeAtlas from '@/components/iyp/as/ASRipeAtlas.vue'
import ASPopularDomains from '@/components/iyp/as/ASPopularDomains.vue'
import ASPopularHostNames from '@/components/iyp/as/ASPopularHostNames.vue'
import ASIXPs from '@/components/iyp/as/ASIXPs.vue'
import ASCoLocatedASes from '@/components/iyp/as/ASCoLocatedASes.vue'
import ASSiblingASes from '@/components/iyp/as/ASSiblingASes.vue'
import ASRankings from '@/components/iyp/as/ASRankings.vue'
import ASAuthoritativeNameservers from '@/components/iyp/as/ASAuthoritativeNameservers.vue'

const props = defineProps(['startTime', 'endTime', 'asNumber', 'family', 'peeringdbId', 'pageTitle', 'interval', 'hash'])

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, label: 'Overview' },
  { value: false, label: t('charts.asInterdependencies.title') },
  { value: false, label: t('charts.iodaChart.title') },
  { value: false, label: t('charts.prefixHegemony.title') },
  { value: false, label: t('charts.networkDelay.title') },
  { value: false, label: t('iyp.as.atlas.title') },
  // { value: false, label: t('charts.delayAndForwarding.title') },
  { value: false, label: t('charts.disconnections.title') },
  { value: false, label: t('iyp.as.ipPrefix.title') },
  { value: false, label: t('iyp.as.peers.title') },
  { value: false, label: t('iyp.as.upstreams.title') },
  { value: false, label: t('iyp.as.downstreams.title') },
  { value: false, label: t('iyp.as.roas.title') },
  { value: false, label: t('iyp.as.popularDomains.title') },
  { value: false, label: t('iyp.as.popularHostNames.title') },
  { value: false, label: t('iyp.as.authoritativeNameservers.title') },
  { value: false, label: t('iyp.as.ixp.title') },
  { value: false, label: t('iyp.as.facilities.title') },
  { value: false, label: t('iyp.as.siblings.title') },
  { value: false, label: t('iyp.as.rankings.title') },
])
const selectAll = ref(false)

const pushRoute = () => {
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      display: JSON.stringify(selects.value.map((obj, index) => {
        if (obj.value) {
          return index
        }
      }).filter(val => val != null))
    })
  }))
}

const hashToDisplay = (hash) => {
  selects.value.forEach(obj => {
    if (obj.label === hash.replace('#', '').replaceAll('-', ' ')) {
      obj.value = true
    }
  })
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach(obj => obj.value = selectAll.value)
})

onMounted(() => {
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else if (props.hash) {
    hashToDisplay(props.hash)
  } else if (route.hash) {
    hashToDisplay(route.hash)
  } else {
    displayWidgets.value.forEach(val => selects.value[val].value = true)
  }
})
</script>

<template>
  <QCard flat bordered>
    <QCardSection>
      <div class="text-h6">Select widgets</div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <QCheckbox v-for="select in selects" :label="select.label" v-model="select.value" />
      <QCheckbox label="All" v-model="selectAll" />
    </QCardSection>
  </QCard>
  <!-- Overview -->
  <ASOverview
    :as-number="asNumber"
    :peeringdbId="peeringdbId"
    class="card"
    v-if="selects[0].value"
  />
  <!-- Monitoring -->
  <GenericCardController
    :title="$t('charts.asInterdependencies.title')"
    sub-title="BGP Data"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[1].value"
  >
    <AsInterdependenciesChart
      :start-time="startTime"
      :end-time="endTime"
      :as-number="asNumber"
      :address-family="family"
      :fetch="fetch"
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('charts.iodaChart.title')"
    sub-title="AS Internet Overview"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[2].value"
  >
    <IodaChart
      :entity-value="String(asNumber)"
      :filter-by-country="false"
      :start-time="startTime"
      :end-time="endTime"
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('charts.prefixHegemony.title')"
    sub-title="BGP / IRR / RPKI / delegated"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[3].value"
  >
    <PrefixHegemonyChart
      :start-time="startTime"
      :end-time="endTime"
      :as-number="asNumber"
      :fetch="fetch"
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('charts.networkDelay.title')"
    sub-title="Traceroute Data"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[4].value"
  >
    <NetworkDelayChart
      :start-time="startTime"
      :end-time="endTime"
      :startPointName="Math.abs(asNumber).toString()"
      :startPointType="route.params.id.substring(0, 2)"
      :fetch="fetch"
      :readonlySourceSearch="true"
      searchBar
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('iyp.as.atlas.title')"
    :sub-title="$t('iyp.as.atlas.caption')+asNumber"
    class="card"
    v-if="selects[5].value"
  >
    <ASRipeAtlas
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>

  <!-- <GenericCardController
    :title="$t('charts.delayAndForwarding.title')"
    sub-title="Traceroute Data"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[6].value"
  >
    <DelayAndForwardingChart
      :start-time="startTime"
      :end-time="endTime"
      :as-number="asNumber"
      :fetch="fetch"
    />
  </GenericCardController> -->

  <GenericCardController
    :title="$t('charts.disconnections.title')"
    sub-title="RIPE Atlas Log"
    :report-day="interval.dayDiff()"
    class="card"
    v-if="selects[6].value"
  >
    <DiscoChart
      :streamName="asNumber"
      :start-time="startTime"
      :end-time="endTime"
      :fetch="fetch"
      :minAvgLevel="9"
    />
  </GenericCardController>
  <!-- Routing -->
  <GenericCardController
    :title="$t('iyp.as.ipPrefix.title')"
    :sub-title="$t('iyp.as.ipPrefix.caption')+asNumber"
    class="card"
    v-if="selects[7].value"
  >
    <ASOriginatedPrefixes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.peers.title')"
    :sub-title="$t('iyp.as.peers.caption')+asNumber"
    class="card"
    v-if="selects[8].value"
  >
    <ASConnectedASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.upstreams.title')"
    :sub-title="$t('iyp.as.upstreams.caption')+asNumber"
    class="card"
    v-if="selects[9].value"
  >
    <ASUpstreamASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.downstreams.title')"
    :sub-title="$t('iyp.as.downstreams.caption')+asNumber"
    class="card"
    v-if="selects[10].value"
  >
    <ASDownstreamsASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.roas.title')"
    :sub-title="$t('iyp.as.roas.caption')+asNumber"
    class="card"
    v-if="selects[11].value"
  >
    <ASRPKIRouteOriginAuthorization
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- DNS -->
  <GenericCardController
    :title="$t('iyp.as.popularDomains.title')"
    :sub-title="$t('iyp.as.popularDomains.caption')+asNumber"
    class="card"
    v-if="selects[12].value"
  >
    <ASPopularDomains
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.popularHostNames.title')"
    :sub-title="$t('iyp.as.popularHostNames.caption')+asNumber"
    class="card"
    v-if="selects[13].value"
  >
    <ASPopularHostNames
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.authoritativeNameservers.title')"
    :sub-title="$t('iyp.as.authoritativeNameservers.caption')+asNumber"
    class="card"
    v-if="selects[14].value"
  >
    <ASAuthoritativeNameservers
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Peering -->
  <GenericCardController
    :title="$t('iyp.as.ixp.title')"
    :sub-title="$t('iyp.as.ixp.caption')+asNumber"
    class="card"
    v-if="selects[15].value"
  >
    <ASIXPs
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.facilities.title')"
    :sub-title="$t('iyp.as.facilities.caption')+asNumber"
    class="card"
    v-if="selects[16].value"
  >
    <ASCoLocatedASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Registration -->
  <GenericCardController
    :title="$t('iyp.as.siblings.title')"
    :sub-title="$t('iyp.as.siblings.caption')"
    class="card"
    v-if="selects[17].value"
  >
    <ASSiblingASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Rankings -->
  <GenericCardController
    :title="$t('iyp.as.rankings.title')"
    :sub-title="$t('iyp.as.rankings.caption')+asNumber"
    class="card"
    v-if="selects[18].value"
  >
    <ASRankings
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>