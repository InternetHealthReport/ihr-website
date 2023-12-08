<script setup>
import { QList, QExpansionItem, QSeparator, QCard, QCardSection, date } from 'quasar'
import { RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import report from '@/plugins/report'
import { useRoute, useRouter } from 'vue-router'
import { ref, inject, computed, watch, nextTick, onMounted, onBeforeMount } from 'vue'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/plugins/disco'
import { AS_FAMILY, NetworkQuery } from '@/plugins/IhrApi'
import i18n from '@/i18n'
import NetworkSearchBar from '@/components/search/NetworkSearchBar.vue'
import DateTimePicker from '@/components/DateTimePicker.vue'
import PrefixHegemonyChart from '@/components/charts/PrefixHegemonyChart.vue'
import NetworkDelayChart from '@/components/charts/NetworkDelayChart.vue'
import AsInterdependenciesChart from '@/components/charts/AsInterdependenciesChart.vue'
import DelayAndForwardingChart from '@/components/charts/DelayAndForwardingChart.vue'

const { t } = i18n.global

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

if (route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)
const loadingStatus = ref(LOADING_STATUS.LOADING)
const asNumber = ref(ihr_api.ihr_AsOrIxpToNumber(route.params.asn))
const asName = ref(null)
const minAvgLevel = ref(DEFAULT_DISCO_AVG_LEVEL)
const show = ref({
  rov: true,
  rov_disable: false,
  delayAndForwarding: true,
  delayAndForwarding_disable: false,
  disco: true,
  disco_disable: false,
  hegemony: true,
  hegemony_disable: false,
  net_delay: true,
  net_delay_disable: false,
  measurementLab: true,
})

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
    return asName.value
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
    return route.params.asn
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
      date: utcString(interval.value.end).split('T')[0]
    })
  })
}

const netName = () => {
  const filter = new NetworkQuery().asNumber(asNumber.value)
  ihr_api.network(filter, results => {
    if (results.count < 1) {
      loadingStatus.value = LOADING_STATUS.NOT_FOUND
      return
    }
    // Hide tabs if not necessary
    nextTick(() => {
      show.value.delayAndForwarding_disable = !results.results[0].delay_forwarding
      show.value.delayAndForwarding = results.results[0].delay_forwarding
      show.value.disco_disable = !results.results[0].disco
      show.value.disco = results.results[0].disco
      show.value.hegemony_disable = !results.results[0].hegemony
      show.value.hegemony = results.results[0].hegemony
    })

    if (results.results[0].name && results.results[0].name.length !== 0) {
      asName.value = results.results[0].name
    }
    loadingStatus.value = LOADING_STATUS.LOADED
    fetch.value = true
  })
}

const displayNetDelay = (displayValue) => {
  show.value.net_delay = displayValue
  nextTick(() => {
    show.value.net_delay_disable = !displayValue
  })
}

watch(addressFamily, () => {
  pushRoute()
})
watch(() => route.params.asn, (asn) => {
  if (ihr_api.ihr_AsOrIxpToNumber(asn) != asNumber.value) {
    loadingStatus.value = LOADING_STATUS.LOADING
    asNumber.value = ihr_api.ihr_AsOrIxpToNumber(asn)
    if (asNumber.value) {
      pushRoute()
      netName()
    }
  }
})
watch(interval, () => {
  pushRoute()
})
onMounted(() => {
  if (ihr_api.ihr_AsOrIxpToNumber(route.params.asn)) {
    pushRoute()
    netName()
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="asNumber">
      <div>
        <h1 class="text-center">{{ subHeader }} - {{ headerString }}</h1>
        <h3 class="text-center">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <DateTimePicker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
        </h3>
      </div>
      <QList v-if="showGraphs">
        <QExpansionItem
          :label="$t('charts.asInterdependencies.title')"
          caption="BGP Data"
          header-class="IHR_charts-title"
          icon="fas fa-project-diagram"
          :disable="show.hegemony_disable"
          v-model="show.hegemony"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <AsInterdependenciesChart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :address-family="family"
                :fetch="fetch"
              />
            </QCardSection>
          </QCard>
        </qExpansionItem>
        <QExpansionItem
          :label="$t('charts.prefixHegemony.title')"
          caption="BGP / IRR / RPKI / delegated"
          header-class="IHR_charts-title"
          icon="fas fa-route"
          :disable="show.rov_disable"
          v-model="show.rov"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <PrefixHegemonyChart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :fetch="fetch"
              />
            </QCardSection>
          </QCard>
        </QExpansionItem>
        <QExpansionItem
          :label="$t('charts.networkDelay.title')"
          caption="Traceroute Data"
          header-class="IHR_charts-title"
          icon="fas fa-shipping-fast"
          v-model="show.net_delay"
          :disable="show.net_delay_disable"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <NetworkDelayChart
                :start-time="startTime"
                :end-time="endTime"
                :startPointName="Math.abs(asNumber).toString()"
                :startPointType="route.params.asn.substring(0, 2)"
                :fetch="fetch"
                searchBar
                @display="displayNetDelay"
              />
            </QCardSection>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          :label="$t('charts.delayAndForwarding.title')"
          caption="Traceroute Data"
          header-class="IHR_charts-title"
          icon="fas fa-exchange-alt"
          :disable="show.delayAndForwarding_disable"
          v-model="show.delayAndForwarding"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <DelayAndForwardingChart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :fetch="fetch"
              />
            </QCardSection>
          </QCard>
        </QExpansionItem>
        <QExpansionItem
          :label="$t('charts.disconnections.title')"
          caption="RIPE Atlas Log"
          header-class="IHR_charts-title"
          icon="fas fa-plug"
          :disable="show.disco_disable"
          v-model="show.disco"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <QCardSection>
              <!-- <disco-chart
                :streamName="asNumber"
                :start-time="startTime"
                :end-time="endTime"
                :fetch="fetch"
                :minAvgLevel="9"
                ref="ihrChartDisco"
              /> -->
            </QCardSection>
          </QCard>
        </QExpansionItem>
        <div class="IHR_last-element">&nbsp;</div>
      </QList>
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Network Report</h1>
        <div class="row justify-center">
          <div class="col-8">
            <NetworkSearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter an ASN, IXP ID, or network name (at least 3 characters)"
            />
          </div>
        </div>
      </div>
      <div class="q-pa-xl">
        <div class="row justify-center">
          <div class="col-6">
            <h3>Examples:</h3>
          </div>
        </div>
        <div class="row justify-center">
          <div class="col-3">
            <ul>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'AS2497' } })" class="IHR_delikify">IIJ (AS2497)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'AS15169' } })" class="IHR_delikify">Google (AS15169)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'AS2501' } })" class="IHR_delikify">University of Tokyo (AS2501)</RouterLink>
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'AS7922' } })" class="IHR_delikify">Comcast (AS7922)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'AS25152' } })" class="IHR_delikify">K-Root server (AS25152)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { asn: 'IXP208' } })" class="IHR_delikify">DE-CIX (IXP208)</RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
.IHR_
  &char-container
    width 90%
    margin 0 auto
</style>