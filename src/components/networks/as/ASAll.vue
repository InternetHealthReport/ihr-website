<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
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
import ASIXPs from '@/components/iyp/as/ASIXPs.vue'
import ASCoLocatedASes from '@/components/iyp/as/ASCoLocatedASes.vue'
import ASSiblingASes from '@/components/iyp/as/ASSiblingASes.vue'
import ASRankings from '@/components/iyp/as/ASRankings.vue'

const props = defineProps(['startTime', 'endTime', 'asNumber', 'family', 'peeringdbId', 'pageTitle'])

const route = useRoute()

const fetch = ref(true)
</script>

<template>
  <!-- Overview -->
  <ASOverview
    :as-number="asNumber"
    :peeringdbId="peeringdbId"
  />
  <!-- Monitoring -->
  <GenericCardController
    :title="$t('charts.asInterdependencies.title')"
    sub-title="BGP Data"
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
    class="card"
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
    class="card"
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
    class="card"
  >
    <NetworkDelayChart
      :start-time="startTime"
      :end-time="endTime"
      :startPointName="Math.abs(asNumber).toString()"
      :startPointType="route.params.id.substring(0, 2)"
      :fetch="fetch"
      searchBar
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('iyp.as.atlas.title')"
    :sub-title="$t('iyp.as.atlas.caption')+asNumber"
    class="card"
  >
    <ASRipeAtlas
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('charts.delayAndForwarding.title')"
    sub-title="Traceroute Data"
    class="card"
  >
    <DelayAndForwardingChart
      :start-time="startTime"
      :end-time="endTime"
      :as-number="asNumber"
      :fetch="fetch"
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('charts.disconnections.title')"
    sub-title="RIPE Atlas Log"
    class="card"
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
  >
    <ASPopularDomains
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Peering -->
  <GenericCardController
    :title="$t('iyp.as.ixp.title')"
    :sub-title="$t('iyp.as.ixp.caption')+asNumber"
    class="card"
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