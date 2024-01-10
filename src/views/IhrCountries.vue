<script setup>
import { QList, QExpansionItem, QSeparator, QCard, QCardSection } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import report from '@/plugins/report'
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, computed, watch, nextTick, onMounted, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'
import DateTimePicker from '@/components/DateTimePicker.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import { isoCountries } from '@/plugins/countryName'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/plugins/disco'
import { AS_FAMILY } from '@/plugins/IhrApi'
import CountryHegemonyChart from '../components/charts/CountryHegemonyChart.vue'
import CountryOverview from '@/components/iyp/CountryOverview.vue'
import IodaChart from '@/components/charts/IodaChart.vue'

const { t } = useI18n()

const ihr_api = inject('ihr_api')

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1,
}

const route = useRoute()
const router = useRouter()

const timeRange = route.query.last ? route.query.last : 3

let { interval, utcString, fetch, reportDateFmt, minDate, maxDate, setReportDate, startTime, endTime } = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)
const loadingStatus = ref(LOADING_STATUS.LOADING)
const countryCode = ref(route.params.cc in isoCountries ? route.params.cc : null)
const countryName = ref(null)
const minAvgLevel = ref(DEFAULT_DISCO_AVG_LEVEL)
const show = ref({
  prefixHegemonyChart: true,
  prefixHegemonyChart_disable: false,
  disco: true,
  disco_disable: false,
  hegemony: true,
  hegemony_disable: false,
  ioda: true,
  ioda_disable: false,
  net_delay: true,
  net_delay_disable: false
})
const majorEyeballs = ref([])
const majorEyeballsThreshold = ref(10)
const clear = ref(0)

const family = computed(() => {
  return addressFamily.value == 6 ? AS_FAMILY.v6 : AS_FAMILY.v4
})
const addressFamilyText = computed(() => {
  return addressFamily.value ? 'IPv4' : 'IPv6'
})
const showGraphs = computed(() => {
  return loadingStatus.value == LOADING_STATUS.LOADED
})
const headerString = computed(() => {
  if (loadingStatus.value == LOADING_STATUS.LOADING) {
    return t('Networks.headerString.loading')
  } else if (loadingStatus.value == LOADING_STATUS.NOT_FOUND) {
    return t('Networks.headerString.notFound')
  } else if (loadingStatus.value == LOADING_STATUS.EXPIRED) {
    return t('Networks.headerString.expired')
  } else if (loadingStatus.value == LOADING_STATUS.LOADED) {
    if (countryCode.value in isoCountries) {
      return isoCountries[countryCode.value]
    } else {
      return t('Networks.headerString.notFound')
    }
  } else {
    return t('genericErrors.ups')
  }
})
const subHeader = computed(() => {
  if (loadingStatus.value == LOADING_STATUS.LOADING) {
    return t('Networks.subHeader.loading')
  } else if (loadingStatus.value == LOADING_STATUS.NOT_FOUND) {
    return t('Networks.subHeader.notFound')
  } else if (loadingStatus.value == LOADING_STATUS.EXPIRED) {
    return t('Networks.subHeader.expired')
  } else if (loadingStatus.value == LOADING_STATUS.LOADED) {
    return countryCode.value
  } else {
    return t('genericErrors.badHappened')
  }
})

const pushRoute = () => {
  router.push({
    replace: true,
    query: Object.assign({}, route.query, {
      af: family.value,
      last: interval.value.dayDiff(),
      date: utcString(interval.value.end).split('T')[0],
    }),
  })
  loadingStatus.value = LOADING_STATUS.LOADED
  fetch.value = true
}

const displayNetDelay = (displayValue) => {
  show.value.net_delay = displayValue
  nextTick(() => {
    show.value.net_delay_disable = !displayValue
  })
}

const setMajorEyeballs = (asns) => {
  majorEyeballs.value = []
  asns.forEach(elem => {
    majorEyeballs.value.push('AS4' + elem)
  })
}

watch(addressFamily, () => {
  pushRoute()
})
watch(() => route.params.cc, (cc) => {
  if (cc != countryCode.value) {
    loadingStatus.value = LOADING_STATUS.LOADING
    countryCode .value = cc
    majorEyeballs.value = []
    if (countryCode.value) {
      pushRoute()
    }
  }
})
watch(interval, () => {
  pushRoute()
})
onMounted(() => {
  if (isoCountries[route.params.cc]) {
    pushRoute()
  } else {
    router.push(Tr.i18nRoute({
      name: 'countries',
    }))
  }
})
</script>

<template>
  <div v-if="countryCode" id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ headerString }}</h1>
    <div>
      <CountryOverview :country-code="route.params.cc" :title="() => setPageTitle" />
      <h3 class="text-center">
        {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
        <DateTimePicker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
      </h3>
    </div>
    <QList v-if="showGraphs">
      <QExpansionItem
        :label="$t('charts.countryHegemony.title')"
        caption="BGP data / APNIC population estimates"
        header-class="IHR_charts-title"
        icon="fas fa-project-diagram"
        :disable="show.hegemony_disable"
        v-model="show.hegemony"
      >
        <QSeparator />
        <QCard class="IHR_charts-body">
          <QCardSection>
            <CountryHegemonyChart
              :start-time="startTime"
              :end-time="endTime"
              :country-code="countryCode"
              :address-family="family"
              :fetch="fetch"
              ref="asInterdependenciesChart"
              @eyeballs="setMajorEyeballs($event)"
            />
          </QCardSection>
        </QCard>
      </QExpansionItem>

      <QExpansionItem :label="$t('charts.iodaChart.title')" caption="Country Internet Overview" header-class="IHR_charts-title"
          icon="fas fa-globe" :disable="show.ioda_disable" v-model="show.ioda">
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <IodaChart :entity-value="countryCode" :filter-by-country="true" :start-time="startTime" :end-time="endTime" />
            </QCardSection>
          </QCard>
        </QExpansionItem>

      <QExpansionItem
        :label="$t('charts.prefixHegemony.title')"
        caption="BGP / IRR / RPKI / delegated"
        header-class="IHR_charts-title"
        icon="fas fa-route"
        :disable="show.prefixHegemonyChart_disable"
        v-model="show.prefixHegemonyChart"
      >
        <QSeparator />
        <QCard class="IHR_charts-body">
          <QCardSection>
            <PrefixHegemonyChart
              :start-time="startTime"
              :end-time="endTime"
              :country-code="countryCode"
              :address-family="family"
              :fetch="fetch"
            />
          </QCardSection>
        </QCard>
      </QExpansionItem>

      <QExpansionItem
        :label="$t('charts.networkDelay.title')"
        caption="Traceroute data"
        header-class="IHR_charts-title"
        icon="fas fa-shipping-fast"
        v-model="show.net_delay"
        :disable="show.net_delay_disable"
      >
        <QSeparator />
        <QCard class="IHR_charts-body">
          <QCardSection>
            <NetworkDelayChart
              group="start"
              :start-time="startTime"
              :end-time="endTime"
              :startPointNames="majorEyeballs"
              :endPointNames="[
                'AS415169',
                'CT4Amsterdam, North Holland, NL',
                'CT4Singapore, Central Singapore, SG',
                'CT4New York City, New York, US',
              ]"
              :eyeballThreshold="majorEyeballsThreshold"
              :fetch="majorEyeballs.length != 0"
              :clear="clear"
              searchBar
            />
          </QCardSection>
        </QCard>
      </QExpansionItem>

      <div class="IHR_last-element">&nbsp;</div>
    </QList>
  </div>
</template>


<style lang="stylus">
.IHR_
  &char-container
    width 90%
    margin 0 auto
</style>