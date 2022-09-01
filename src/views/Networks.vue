<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="asNumber">
      <div>
        <h1 class="text-center">{{ subHeader }} - {{ headerString }}</h1>
        <h3 class="text-center">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <date-time-picker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
        </h3>
      </div>
      <q-list v-if="showGraphs">
        <q-expansion-item
          :label="$t('charts.asInterdependencies.title')"
          caption="BGP data"
          header-class="IHR_charts-title"
          icon="fas fa-project-diagram"
          :disable="show.hegemony_disable"
          v-model="show.hegemony"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <as-interdependencies-chart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :address-family="family"
                :fetch="fetch"
                ref="asInterdependenciesChart"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          :label="$t('charts.prefixHegemony.title')"
          caption="BGP / IRR / RPKI / delegated"
          header-class="IHR_charts-title"
          icon="fas fa-route"
          :disable="show.rov_disable"
          v-model="show.rov"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <prefix-hegemony-chart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :fetch="fetch"
                ref="prefixHegemonyChart"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          :label="$t('charts.networkDelay.title')"
          caption="Traceroute data"
          header-class="IHR_charts-title"
          icon="fas fa-shipping-fast"
          v-model="show.net_delay"
          :disable="show.net_delay_disable"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <network-delay-chart
                :start-time="startTime"
                :end-time="endTime"
                :startPointName="Math.abs(asNumber).toString()"
                :startPointType="this.$route.params.asn.substring(0, 2)"
                :fetch="fetch"
                searchBar
                ref="networkDelayChart"
                @display="displayNetDelay"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          :label="$t('charts.delayAndForwarding.title')"
          caption="Traceroute data"
          header-class="IHR_charts-title"
          icon="fas fa-exchange-alt"
          :disable="show.delayAndForwarding_disable"
          v-model="show.delayAndForwarding"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <delay-and-forwarding-chart
                :start-time="startTime"
                :end-time="endTime"
                :as-number="asNumber"
                :fetch="fetch"
                ref="delayAndForwardingChart"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-expansion-item
          :label="$t('charts.disconnections.title')"
          caption="RIPE Atlas log"
          header-class="IHR_charts-title"
          icon="fas fa-plug"
          :disable="show.disco_disable"
          v-model="show.disco"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <disco-chart
                :streamName="asNumber"
                :start-time="startTime"
                :end-time="endTime"
                :fetch="fetch"
                :minAvgLevel="9"
                ref="ihrChartDisco"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <q-expansion-item
          :label="$t('IODA')"
          caption="© Georgia Tech Research Corporation, 2022"
          header-class="IHR_charts-title"
          icon="fas fa-plug"
          :disable="show.disco_disable"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <ioda-chart :ASN="asNumber" :fetch="fetch" :start-time="startTime" :end-time="endTime" ref="iodaChart" />
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <div class="IHR_last-element">&nbsp;</div>
      </q-list>
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Network Report</h1>
        <div class="row justify-center">
          <div class="col-8">
            <network-search-bar
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
                <router-link :to="{ name: 'networks', params: { asn: 'AS2497' } }" class="IHR_delikify">IIJ (AS2497)</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'networks', params: { asn: 'AS15169' } }" class="IHR_delikify">Google (AS15169)</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'networks', params: { asn: 'AS2501' } }" class="IHR_delikify"
                  >University of Tokyo (AS2501)</router-link
                >
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <router-link :to="{ name: 'networks', params: { asn: 'AS7922' } }" class="IHR_delikify">Comcast (AS7922)</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'networks', params: { asn: 'AS25152' } }" class="IHR_delikify"
                  >K-Root server (AS25152)</router-link
                >
              </li>
              <li>
                <router-link :to="{ name: 'networks', params: { asn: 'IXP208' } }" class="IHR_delikify">DE-CIX (IXP208)</router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import AsInterdependenciesChart from '@/views/charts/AsInterdependenciesChart'
import PrefixHegemonyChart from '@/views/charts/PrefixHegemonyChart'
import DiscoChart, { DEFAULT_DISCO_AVG_LEVEL } from '@/views/charts/global/DiscoChart'
import DelayAndForwardingChart from '@/views/charts/DelayAndForwardingChart'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'
import { AS_FAMILY, NetworkQuery } from '@/plugins/IhrApi'
import DateTimePicker from '@/components/DateTimePicker'
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar'
import IodaChart from './charts/IodaChart.vue'

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1,
}

const CHART_REFS = ['asInterdependenciesChart', 'prefixHegemonyChart', 'networkDelayChart', 'delayAndForwardingChart', 'ihrChartDisco']

export default {
  mixins: [reportMixin],
  components: {
    AsInterdependenciesChart,
    PrefixHegemonyChart,
    DiscoChart,
    DelayAndForwardingChart,
    NetworkDelayChart,
    DateTimePicker,
    NetworkSearchBar,
    IodaChart,
  },
  data() {
    let asNumber = this.$options.filters.ihr_AsOrIxpToNumber(this.$route.params.asn)
    let addressFamily = this.$route.query.af
    return {
      addressFamily: addressFamily == undefined ? 4 : addressFamily,
      loadingStatus: LOADING_STATUS.LOADING,
      asNumber: asNumber,
      asName: null,
      charRefs: CHART_REFS,
      minAvgLevel: DEFAULT_DISCO_AVG_LEVEL,
      show: {
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
      },
    }
  },
  methods: {
    pushRoute() {
      this.$router.replace({
        //this.$router.replace({ query: Object.assign({}, this.$route.query, { hege_dt: clickData.points[0].x, hege_tb: table }) });
        query: Object.assign({}, this.$route.query, {
          af: this.family,
          last: this.interval.dayDiff(),
          date: this.$options.filters.ihrUtcString(this.interval.end, false),
        }),
      })
    },
    netName() {
      let filter = new NetworkQuery().asNumber(this.asNumber)
      this.$ihr_api.network(filter, results => {
        if (results.count < 1) {
          this.loadingStatus = LOADING_STATUS.NOT_FOUND
          return
        }
        // Hide tabs if not necessary
        this.$nextTick(function () {
          this.show.delayAndForwarding_disable = !results.results[0].delay_forwarding
          this.show.delayAndForwarding = results.results[0].delay_forwarding
          this.show.disco_disable = !results.results[0].disco
          this.show.disco = results.results[0].disco
          this.show.hegemony_disable = !results.results[0].hegemony
          this.show.hegemony = results.results[0].hegemony
        })

        this.asName = results.results[0].name
        this.loadingStatus = LOADING_STATUS.LOADED
        this.fetch = true
      })
    },
    displayNetDelay(displayValue) {
      this.show.net_delay = displayValue
      this.$nextTick(function () {
        this.show.net_delay_disable = !displayValue
      })
    },
  },
  mounted() {
    this.netName()
  },
  computed: {
    family() {
      return this.addressFamily == 6 ? AS_FAMILY.v6 : AS_FAMILY.v4
    },
    addressFamilyText() {
      return this.addressFamily ? 'IPv4' : 'IPv6'
    },
    showGraphs() {
      return this.loadingStatus == LOADING_STATUS.LOADED
    },
    headerString() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t('Networks.headerString.loading')
        case LOADING_STATUS.NOT_FOUND:
          return this.$t('Networks.headerString.notFound')
        case LOADING_STATUS.EXPIRED:
          return this.$t('Networks.headerString.expired')
        case LOADING_STATUS.LOADED:
          return this.asName
        default:
        case LOADING_STATUS.ERROR:
          return this.$t('genericErrors.ups')
      }
    },
    subHeader() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t('Networks.subHeader.loading')
        case LOADING_STATUS.NOT_FOUND:
          return this.$t('Networks.subHeader.notFound')
        case LOADING_STATUS.EXPIRED:
          return this.$t('Networks.subHeader.expired')
        case LOADING_STATUS.LOADED:
          return this.$route.params.asn
        default:
        case LOADING_STATUS.ERROR:
          return this.$t('genericErrors.badHappened')
      }
    },
  },
  watch: {
    addressFamily() {
      this.pushRoute()
    },
    '$route.params.asn': {
      handler: function (asn) {
        console.log(this.asNumber)
        console.log(asn)

        if (this.$options.filters.ihr_AsOrIxpToNumber(asn) != this.asNumber) {
          this.loadingStatus = LOADING_STATUS.LOADING
          this.asNumber = this.$options.filters.ihr_AsOrIxpToNumber(asn)
          this.netName()
        }
      },
      deep: true,
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';
</style>
