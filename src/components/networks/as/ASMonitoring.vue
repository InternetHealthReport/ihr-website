<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import AsInterdependenciesChart from '@/components/charts/AsInterdependenciesChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import DelayAndForwardingChart from '@/components/charts/DelayAndForwardingChart.vue'
import DiscoChart from '@/components/charts/DiscoChart.vue'
import IodaChart from '@/components/charts/IodaChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import ASRipeAtlas from '@/components/iyp/as/ASRipeAtlas.vue'

const props = defineProps(['startTime', 'endTime', 'asNumber', 'family', 'pageTitle', 'interval'])

const route = useRoute()

const fetch = ref(true)
</script>

<template>
  <GenericCardController
    :title="$t('charts.asInterdependencies.title')"
    sub-title="BGP Data"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.asInterdependencies.info.title')"
    :info-description="$t('charts.asInterdependencies.info.description')"
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
    sub-title="Reachability data from Georgia Tech's Internet Intelligence Lab"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.iodaChart.info.title')"
    :info-description="$t('charts.iodaChart.info.description')"
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
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.prefixHegemony.info.title')"
    :info-description="$t('charts.prefixHegemony.info.description')"
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
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.networkDelay.info.title')"
    :info-description="$t('charts.networkDelay.info.description')"
    class="card"
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
    :sub-title="$t('iyp.as.atlas.caption') + asNumber"
    :info-title="$t('iyp.as.atlas.info.title')"
    :info-description="$t('iyp.as.atlas.info.description')"
    class="card"
  >
    <ASRipeAtlas :asNumber="asNumber" :page-title="pageTitle" />
  </GenericCardController>

  <!-- <GenericCardController
    :title="$t('charts.delayAndForwarding.title')"
    sub-title="Traceroute Data"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.delayAndForwarding.info.title')"
    :info-description="$t('charts.delayAndForwarding.info.description')"
    class="card"
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
    :info-title="$t('charts.disconnections.info.title')"
    :info-description="$t('charts.disconnections.info.description')"
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
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>
