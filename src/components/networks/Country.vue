<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import DateTimePicker from '@/components/DateTimePicker.vue'
import { AS_FAMILY } from '@/plugins/IhrApi'
import CountryOverview from '@/components/networks/country/CountryOverview.vue'
import CountryMonitoring from '@/components/networks/country/CountryMonitoring.vue'
import CountryRouting from '@/components/networks/country/CountryRouting.vue'
import CountryPeering from '@/components/networks/country/CountryPeering.vue'
import CountryRankings from '@/components/networks/country/CountryRankings.vue'
import CountryCustom from '@/components/networks/country/CountryCustom.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const timeRange = route.query.last ? route.query.last : 3

let { interval, utcString, fetch, reportDateFmt, minDate, maxDate, setReportDate, startTime, endTime } = report(timeRange)

if (route.query.date && route.query.date != utcString(maxDate.value).split('T')[0]) {
  setReportDate(new Date(route.query.date))
}

const activeMenu = route.query.active ? route.query.active : 'overview'

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const countryCode = ref(route.params.cc)
const countryName = ref(null)
const menu = ref(activeMenu)
const addressFamily = ref(route.query.af == undefined ? 4 : route.query.af)

const getInfo = () => {
  const query = `MATCH (c:Country {country_code: $cc})
    RETURN c.name AS name`
  return [{ statement: query, parameters: { cc: countryCode.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    countryName.value = res[0][0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const pushRoute = () => {
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      af: family.value,
      last: interval.value.dayDiff(),
      date: utcString(interval.value.end).split('T')[0],
      active: menu.value ? menu.value : activeMenu
    })
  }))
}

const family = computed(() => {
  return addressFamily.value == 6 ? AS_FAMILY.v6 : AS_FAMILY.v4
})

const pageTitle = computed(() => {
  return countryName.value
})

watch(addressFamily, () => {
  pushRoute()
})
watch(() => route.params.cc, (country) => {
  const newCountry = country
  if (newCountry != countryCode.value) {
    countryCode.value = newCountry
    if (countryCode.value) {
      pushRoute()
      fetchData()
    }
  }
})
watch(interval, () => {
  pushRoute()
})
watch(() => route.query.active, (active) => {
  if (active != menu.value) {
    menu.value = active
  }
})
watch(menu, () => {
  if ('display' in route.query && !route.hash.includes('#')) {
    delete route.query.display
  }
  pushRoute()
})
onMounted(() => {
  if (countryCode.value) {
    pushRoute()
    fetchData()
  } else {
    router.push(Tr.i18nRoute({
      name: 'countries',
    }))
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <h3 class="text-center">
      <div v-if="['monitoring', 'custom'].includes(menu)">
        {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
        <DateTimePicker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
      </div>
      <div v-else>
        Weekly report
      </div>
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
        <QTab name="overview">Overview</QTab>
        <QTab name="monitoring">Monitoring</QTab>
        <QTab name="routing">Routing</QTab>
        <QTab name="peering">Peering</QTab>
        <QTab name="rankings">Rankings</QTab>
        <QTab name="custom">Custom</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels
        v-model="menu"
        v-if="pageTitle"
      >
        <QTabPanel name="overview">
          <CountryOverview
            :country-code="countryCode"
          />
        </QTabPanel>
        <QTabPanel name="monitoring">
          <CountryMonitoring
            :start-time="startTime"
            :end-time="endTime"
            :country-code="countryCode"
            :family="family"
            :page-title="pageTitle"
            :interval="interval"
          />
        </QTabPanel>
        <QTabPanel name="routing">
          <CountryRouting
            :country-code="countryCode"
            :page-title="pageTitle"
          />
        </QTabPanel>
        <QTabPanel name="peering">
          <CountryPeering
            :country-code="countryCode"
            :page-title="pageTitle"
          />
        </QTabPanel>
        <QTabPanel name="rankings">
          <CountryRankings
            :country-code="countryCode"
            :page-title="pageTitle"
          />
        </QTabPanel>
        <QTabPanel name="custom">
          <CountryCustom
            :start-time="startTime"
            :end-time="endTime"
            :country-code="countryCode"
            :family="family"
            :page-title="pageTitle"
            :interval="interval"
            :hash="routeHash"
          />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus">
.cards
  display inline-block
</style>