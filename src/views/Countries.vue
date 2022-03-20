<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="countryCode">
      <div>
        <h1 class="text-center">{{ headerString }}</h1>
        <h3 class="text-center">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <date-time-picker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
        </h3>
      </div>
      <q-list v-if="showGraphs">
        <q-expansion-item
          :label="$t('charts.countryHegemony.title')"
          caption="BGP data / APNIC population estimates"
          header-class="IHR_charts-title"
          icon="fas fa-project-diagram"
          :disable="show.hegemony_disable"
          v-model="show.hegemony"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <country-hegemony-chart
                :start-time="startTime"
                :end-time="endTime"
                :country-code="countryCode"
                :address-family="family"
                :fetch="fetch"
                ref="asInterdependenciesChart"
                @eyeballs="setMajorEyeballs($event)"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          :label="$t('charts.prefixHegemony.title')"
          caption="BGP / IRR / RPKI / delegated"
          header-class="IHR_charts-title"
          icon="fas fa-route"
          :disable="show.prefixHegemonyChart_disable"
          v-model="show.prefixHegemonyChart"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <prefix-hegemony-chart
                :start-time="startTime"
                :end-time="endTime"
                :country-code="countryCode"
                :address-family="family"
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
                ref="networkDelayChart"
                @display="displayNetDelay"
              />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <div class="IHR_last-element">&nbsp;</div>
      </q-list>
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Country Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <network-search-bar bg="white" label="grey-8" input="black" labelTxt="Enter a country name" noAS="true" />
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
                <router-link :to="{ name: 'countries', params: { cc: 'JP' } }" class="IHR_delikify">Japan</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'countries', params: { cc: 'FR' } }" class="IHR_delikify">France</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'countries', params: { cc: 'US' } }" class="IHR_delikify">United States</router-link>
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <router-link :to="{ name: 'countries', params: { cc: 'BR' } }" class="IHR_delikify">Brazil</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'countries', params: { cc: 'DE' } }" class="IHR_delikify">Germany</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'countries', params: { cc: 'CN' } }" class="IHR_delikify">China</router-link>
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
import CountryHegemonyChart from '@/views/charts/CountryHegemonyChart'
import PrefixHegemonyChart from '@/views/charts/PrefixHegemonyChart'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/views/charts/global/DiscoChart'
import NetworkDelayChart from '@/views/charts/NetworkDelayChart'
import { AS_FAMILY } from '@/plugins/IhrApi'
import DateTimePicker from '@/components/DateTimePicker'
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar'
import { isoCountries } from '@/plugins/countryName'

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1,
}

const CHART_REFS = ['countryHegemonyChart', 'prefixHegemonyChart', 'networkDelayChart', 'delayAndForwardingChart', 'ihrChartDisco']

export default {
  name: 'CountryReport',
  mixins: [reportMixin],
  components: {
    CountryHegemonyChart,
    PrefixHegemonyChart,
    NetworkDelayChart,
    DateTimePicker,
    NetworkSearchBar,
  },
  data() {
    let addressFamily = this.$route.query.af
    return {
      addressFamily: addressFamily == undefined ? 4 : addressFamily,
      loadingStatus: LOADING_STATUS.LOADING,
      countryCode: this.$route.params.cc,
      countryName: null,
      charRefs: CHART_REFS,
      minAvgLevel: DEFAULT_DISCO_AVG_LEVEL,
      show: {
        prefixHegemonyChart: true,
        prefixHegemonyChart_disable: false,
        disco: true,
        disco_disable: false,
        hegemony: true,
        hegemony_disable: false,
        net_delay: true,
        net_delay_disable: false,
      },
      majorEyeballs: [],
      majorEyeballsThreshold: 10,
      clear: 0,
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
      this.loadingStatus = LOADING_STATUS.LOADED
      this.fetch = true
    },
    displayNetDelay(displayValue) {
      this.show.net_delay = displayValue
      this.$nextTick(function () {
        this.show.net_delay_disable = !displayValue
      })
    },
    setMajorEyeballs(asns) {
      var tmp = []
      this.majorEyeballs = []
      asns.forEach(elem => {
        tmp.push('AS4' + elem)
      })
      this.majorEyeballs = tmp
    },
  },
  mounted() {},
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
          return isoCountries[this.countryCode]
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
          return this.countryCode
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
    '$route.params.cc': {
      handler: function (cc) {
        if (cc != this.countryCode) {
          this.loadingStatus = LOADING_STATUS.LOADING
          this.countryCode = cc
          this.pushRoute()
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
