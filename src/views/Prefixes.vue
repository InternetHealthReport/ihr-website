<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="prefix">
      <div>
        <h1 class="text-center">{{ subHeader }} - {{ headerString }}</h1>
        <h3 class="text-center">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <date-time-picker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
        </h3>
      </div>
      <q-list v-if="showGraphs">
        <q-expansion-item
          :label="$t('charts.prefixDependencies.title')"
          caption="BGP data"
          header-class="IHR_charts-title"
          icon="fas fa-project-diagram"
          :disable="show.hegemony_disable"
          v-model="show.hegemony"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <prefix-dependencies-chart
                :start-time="startTime"
                :end-time="endTime"
                :prefix="prefix"
                :address-family="family"
                :fetch="fetch"
                ref="prefixDependenciesChart"
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
                :prefix="prefix"
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
                :startPointName="prefix.toString()"
                :startPointType="prefix"
                :fetch="fetch"
                searchBar
                ref="networkDelayChart"
                @display="displayNetDelay"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- <q-expansion-item
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
                :prefix="prefix"
                :fetch="fetch"
                ref="delayAndForwardingChart"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item> -->

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
                :streamName="prefix"
                :start-time="startTime"
                :end-time="endTime"
                :fetch="fetch"
                :minAvgLevel="9"
                ref="ihrChartDisco"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>
        <div class="IHR_last-element">&nbsp;</div>
      </q-list>
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Prefix Report</h1>
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
      <!-- <div class="q-pa-xl">
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
      </div> -->
    </div>
  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import PrefixDependenciesChart from '@/views/charts/PrefixDependenciesChart'
import PrefixHegemonyChart from '@/views/charts/PrefixHegemonyChart'
import DiscoChart, { DEFAULT_DISCO_AVG_LEVEL } from '@/views/charts/global/DiscoChart'
import DelayAndForwardingChart from '@/views/charts/DelayAndForwardingChart'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'
import { AS_FAMILY, HegemonyPrefixQuery } from '@/plugins/IhrApi'
import DateTimePicker from '@/components/DateTimePicker'
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar'
import html2pdf from 'html2pdf.js'

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1,
}

const CHART_REFS = ['prefixDependenciesChart', 'prefixHegemonyChart', 'networkDelayChart', 'delayAndForwardingChart', 'ihrChartDisco']

export default {
  name: 'PrefixesReport',
  mixins: [reportMixin],
  components: {
    PrefixDependenciesChart,
    PrefixHegemonyChart,
    DiscoChart,
    DelayAndForwardingChart,
    NetworkDelayChart,
    DateTimePicker,
    NetworkSearchBar,
  },
  data() {
    let prefix = this.$route.params.prefix
    let addressFamily = this.$route.query.af
    return {
      addressFamily: addressFamily == undefined ? 4 : addressFamily,
      loadingStatus: LOADING_STATUS.LOADING,
      prefix: prefix,
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
        measurementLab: true,
      },
    }
  },
  methods: {
    pushRoute() {
      this.$router.replace({
        query: Object.assign({}, this.$route.query, {
          af: this.family,
          last: this.interval.dayDiff(),
          date: this.$options.filters.ihrUtcString(this.interval.end, false),
        }),
      })
    },
    netName() {
      let filter = new HegemonyPrefixQuery().prefix(this.prefix)
      this.$ihr_api.hegemony_prefix(filter, results => {
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

        this.prefix = results.results[0].prefix
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
    generateReport() {
      let element = document.getElementById('IHR_as-and-ixp-container')
      let opt = {
        margin: 0,
        filename: 'Prefixes.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a3', orientation: 'l' },
      }
      html2pdf(element, opt)
      console.log('button is clicked')
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
          return this.$t('Prefixes.headerString.loading')
        case LOADING_STATUS.NOT_FOUND:
          return this.$t('Prefixes.headerString.notFound')
        case LOADING_STATUS.EXPIRED:
          return this.$t('Prefixes.headerString.expired')
        case LOADING_STATUS.LOADED:
          return this.prefix
        default:
        case LOADING_STATUS.ERROR:
          return this.$t('genericErrors.ups')
      }
    },
    subHeader() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t('Prefixes.subHeader.loading')
        case LOADING_STATUS.NOT_FOUND:
          return this.$t('Prefixes.subHeader.notFound')
        case LOADING_STATUS.EXPIRED:
          return this.$t('Prefixes.subHeader.expired')
        case LOADING_STATUS.LOADED:
          return this.$route.params.prefix
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
    '$route.params.prefix': {
      handler: function(prefix) {
        if (this.$route.query.prefix != this.prefix) {
          this.loadingStatus = LOADING_STATUS.LOADING
          this.prefix = this.$route.query.prefix
          this.netName()
        }
        console.log(this.prefix)
        console.log(prefix)
      },
      deep: true,
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';
</style>
