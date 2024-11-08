<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import CountryOverview from '@/components/networks/country/CountryOverview.vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryHegemonyChart from '@/components/charts/CountryHegemonyChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import IodaChart from '@/components/charts/IodaChart.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import CountryRipeAtlas from '@/components/iyp/country/CountryRipeAtlas.vue'
import CountryAutonomousSystems from '@/components/iyp/country/CountryAutonomousSystems.vue'
import CountryIPPrefixes from '@/components/iyp/country/CountryIPPrefixes.vue'
import CountryInternetExchangePoints from '@/components/iyp/country/CountryInternetExchangePoints.vue'
import CountryASRankings from '@/components/iyp/country/CountryASRankings.vue'

const props = defineProps([
  'startTime',
  'endTime',
  'countryCode',
  'family',
  'pageTitle',
  'interval',
  'hash'
])

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, label: 'Overview' },
  { value: false, label: t('charts.countryHegemony.title') },
  { value: false, label: t('charts.iodaChart.title') },
  { value: false, label: t('charts.prefixHegemony.title') },
  { value: false, label: t('charts.networkDelay.title') },
  { value: false, label: t('iyp.country.atlas.title') },
  { value: false, label: t('iyp.country.ases.title') },
  { value: false, label: t('iyp.country.prefixes.title') },
  { value: false, label: t('iyp.country.ixps.title') },
  { value: false, label: t('iyp.country.rankings.title') }
])
const selectAll = ref(false)
const majorEyeballs = ref([])
const majorEyeballsThreshold = ref(10)
const clear = ref(0)

const setMajorEyeballs = (asns) => {
  majorEyeballs.value = []
  asns.forEach((elem) => {
    majorEyeballs.value.push('AS4' + elem)
  })
}

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        display: JSON.stringify(
          selects.value
            .map((obj, index) => {
              if (obj.value) {
                return index
              }
            })
            .filter((val) => val != null)
        )
      })
    })
  )
}

const hashToDisplay = (hash) => {
  selects.value.forEach((obj) => {
    if (obj.label === hash.replace('#', '').replaceAll('-', ' ')) {
      obj.value = true
    }
  })
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach((obj) => (obj.value = selectAll.value))
})

onMounted(() => {
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else if (props.hash) {
    hashToDisplay(props.hash)
  } else if (route.hash) {
    hashToDisplay(route.hash)
  } else {
    displayWidgets.value.forEach((val) => (selects.value[val].value = true))
  }
})
</script>

<template>
  <QCard
    flat
    bordered
  >
    <QCardSection>
      <div class="text-h6">
        Select widgets to show
      </div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <QCheckbox
        v-for="select in selects"
        :key="select.value"
        v-model="select.value"
        :label="select.label"
      />
      <QCheckbox
        v-model="selectAll"
        label="All"
      />
    </QCardSection>
  </QCard>
  <!-- Overview -->
  <CountryOverview
    v-if="selects[0].value"
    :country-code="countryCode"
    class="card"
  />
  <!-- Monitoring -->
  <GenericCardController
    v-if="selects[1].value"
    :title="$t('charts.countryHegemony.title')"
    sub-title="BGP data / APNIC population estimates"
    :report-day="interval.dayDiff()"
    :info-title="$t('charts.countryHegemony.info.title')"
    :info-description="$t('charts.countryHegemony.info.description')"
    class="card"
  >
    <CountryHegemonyChart
      ref="asInterdependenciesChart"
      :start-time="startTime"
      :end-time="endTime"
      :country-code="countryCode"
      :address-family="family"
      :fetch="fetch"
      @eyeballs="setMajorEyeballs($event)"
    />
  </GenericCardController>

  <GenericCardController
    v-if="selects[2].value"
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
    v-if="selects[3].value"
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
    v-if="selects[4].value"
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
      :start-point-names="majorEyeballs"
      :end-point-names="[
        'AS415169',
        'CT4Amsterdam, North Holland, NL',
        'CT4Singapore, Central Singapore, SG',
        'CT4New York City, New York, US'
      ]"
      :eyeball-threshold="majorEyeballsThreshold"
      :fetch="majorEyeballs.length != 0"
      :clear="clear"
      search-bar
    />
  </GenericCardController>

  <GenericCardController
    v-if="selects[5].value"
    :title="$t('iyp.country.atlas.title')"
    :sub-title="$t('iyp.country.atlas.caption') + pageTitle"
    :info-title="$t('iyp.country.atlas.info.title')"
    :info-description="$t('iyp.country.atlas.info.description')"
    class="card"
  >
    <CountryRipeAtlas
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Routing -->
  <GenericCardController
    v-if="selects[6].value"
    :title="$t('iyp.country.ases.title')"
    :sub-title="$t('iyp.country.ases.caption') + pageTitle"
    :info-title="$t('iyp.country.ases.info.title')"
    :info-description="$t('iyp.country.ases.info.description')"
    class="card"
  >
    <CountryAutonomousSystems
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    v-if="selects[7].value"
    :title="$t('iyp.country.prefixes.title')"
    :sub-title="$t('iyp.country.prefixes.caption') + pageTitle"
    :info-title="$t('iyp.country.prefixes.info.title')"
    :info-description="$t('iyp.country.prefixes.info.description')"
    class="card"
  >
    <CountryIPPrefixes
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Peering -->
  <GenericCardController
    v-if="selects[8].value"
    :title="$t('iyp.country.ixps.title')"
    :sub-title="$t('iyp.country.ixps.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps.info.title')"
    :info-description="$t('iyp.country.ixps.info.description')"
    class="card"
  >
    <CountryInternetExchangePoints
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <!-- Rankings -->
  <GenericCardController
    v-if="selects[9].value && pageTitle"
    :title="$t('iyp.country.rankings.title')"
    :sub-title="$t('iyp.country.rankings.caption') + pageTitle"
    :info-title="$t('iyp.country.rankings.info.title')"
    :info-description="$t('iyp.country.rankings.info.description')"
    class="card"
  >
    <CountryASRankings
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
