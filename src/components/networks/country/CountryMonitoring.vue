<script setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryHegemonyChart from '@/components/charts/CountryHegemonyChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import IodaChart from '@/components/charts/IodaChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import CountryRipeAtlas from '@/components/iyp/country/CountryRipeAtlas.vue'

const props = defineProps([
  'startTime',
  'endTime',
  'countryCode',
  'family',
  'pageTitle',
  'interval'
])

const route = useRoute()

const fetch = ref(true)
const majorEyeballs = ref([])
const majorEyeballsThreshold = ref(10)
const clear = ref(0)

const setMajorEyeballs = (asns) => {
  majorEyeballs.value = []
  asns.forEach((elem) => {
    majorEyeballs.value.push('AS4' + elem)
  })
}
</script>

<template>
  <GenericCardController
    :title="$t('charts.countryHegemony.title')"
    sub-title="BGP data / APNIC population estimates"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.countryHegemony.info.title')"
    :info-description="$t('charts.countryHegemony.info.description')"
  >
    <CountryHegemonyChart
      :start-time="startTime"
      :end-time="endTime"
      :country-code="countryCode"
      :address-family="family"
      :fetch="fetch"
      ref="asInterdependenciesChart"
      @eyeballs="setMajorEyeballs($event)"
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
      :entity-value="countryCode"
      :filter-by-country="true"
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
      :country-code="countryCode"
      :address-family="family"
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
      group="start"
      :start-time="startTime"
      :end-time="endTime"
      :startPointNames="majorEyeballs"
      :endPointNames="[
        'AS415169',
        'CT4Amsterdam, North Holland, NL',
        'CT4Singapore, Central Singapore, SG',
        'CT4New York City, New York, US'
      ]"
      :eyeballThreshold="majorEyeballsThreshold"
      :fetch="majorEyeballs.length != 0"
      :clear="clear"
      searchBar
    />
  </GenericCardController>

  <GenericCardController
    :title="$t('iyp.country.atlas.title')"
    :sub-title="$t('iyp.country.atlas.caption') + pageTitle"
    :info-title="$t('iyp.country.atlas.info.title')"
    :info-description="$t('iyp.country.atlas.info.description')"
    class="card"
  >
    <CountryRipeAtlas :country-code="countryCode" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
