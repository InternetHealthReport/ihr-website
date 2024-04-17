<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import DelayAndForwardingChart from '@/components/charts/DelayAndForwardingChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'

const props = defineProps(['startTime', 'endTime', 'caidaId', 'family', 'pageTitle', 'interval', 'peeringdbId'])

const route = useRoute()

const fetch = ref(true)
</script>

<template>
  <GenericCardController
    :title="$t('charts.prefixHegemony.title')"
    sub-title="BGP / IRR / RPKI / delegated"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.prefixHegemony.info.title')"
    :info-description="$t('charts.prefixHegemony.info.description')"
    class="card"
    v-if="caidaId"
  >
    <PrefixHegemonyChart
      :start-time="startTime"
      :end-time="endTime"
      :as-number="caidaId"
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
      :startPointName="Math.abs(caidaId).toString()"
      :startPointType="route.params.id.substring(0, 2)"
      :fetch="fetch"
      searchBar
      :peeringdbId="peeringdbId"
      :readonlySourceSearch="true"
    />
  </GenericCardController>

  <GenericCardController
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
      :as-number="caidaId ? caidaId : 0"
      :fetch="fetch"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>