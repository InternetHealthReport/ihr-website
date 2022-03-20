<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div>
      <h1 class="text-center"><q-icon name="fas fa-route" />&nbsp; Route Origin Validation</h1>
      <h3 class="text-center">
        {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
        <date-time-picker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime class="IHR_subtitle_calendar" />
      </h3>
    </div>
    <prefix-hegemony-chart :start-time="startTime" :end-time="endTime" :fetch="fetch" ref="asInterdependenciesChart" />
  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import PrefixHegemonyChart from '@/views/charts/PrefixHegemonyChart'
import { DEFAULT_DISCO_AVG_LEVEL } from '@/views/charts/global/DiscoChart'
import { AS_FAMILY } from '@/plugins/IhrApi'
import DateTimePicker from '@/components/DateTimePicker'
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
  name: 'ROVReport',
  mixins: [reportMixin],
  components: {
    PrefixHegemonyChart,
    DateTimePicker,
  },
  data() {
    let addressFamily = this.$route.query.af
    return {
      asNumber: 2497,
      addressFamily: addressFamily == undefined ? 4 : addressFamily,
      loadingStatus: LOADING_STATUS.LOADING,
      countryCode: this.$route.params.cc,
      countryName: null,
      charRefs: CHART_REFS,
      minAvgLevel: DEFAULT_DISCO_AVG_LEVEL,
      show: {
        disco: true,
        disco_disable: false,
        hegemony: true,
        hegemony_disable: false,
        net_delay: true,
        net_delay_disable: false,
      },
      majorEyeballs: [],
      majorEyeballsThreshold: 10,
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
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';
</style>
