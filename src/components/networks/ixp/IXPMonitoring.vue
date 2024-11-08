<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import DelayAndForwardingChart from '@/components/charts/DelayAndForwardingChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'

const props = defineProps([
  'startTime',
  'endTime',
  'caidaId',
  'family',
  'pageTitle',
  'interval',
  'peeringdbId'
])

const route = useRoute()

const fetch = ref(true)
</script>

<template>
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
      :start-point-name="Math.abs(caidaId).toString()"
      :start-point-type="route.params.id.substring(0, 2)"
      :fetch="fetch"
      search-bar
      :peeringdb-id="peeringdbId"
      :readonly-source-search="true"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
