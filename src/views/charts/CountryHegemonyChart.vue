<template>
  <div class="IHR_chart">
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
    <q-card v-if="details.tableVisible" class="q-ma-xl">
      <q-tabs
        v-model="details.activeTab"
        class="table-card text-grey bg-grey-2"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="dependency" :label="$t('charts.countryHegemony.table.dependencyTitle')" />
        <q-tab name="api" label="API" />
      </q-tabs>
      <q-tab-panels v-model="details.activeTab" animated>
        <q-tab-panel name="dependency">
          <as-interdependencies-table :data="countryHegemonyData" :loading="loading" />
        </q-tab-panel>
        <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
          <h3>{{ $t('charts.countryHegemony.table.apiTitle') }}</h3>
          <table>
            <tr>
              <td>
                <a :href="hegemonyUrl" target="_blank" id="tableUrl">{{ hegemonyUrl }}</a>
              </td>
            </tr>
          </table>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>
import CommonChartMixin from './CommonChartMixin'
import AsInterdependenciesTable from './tables/CountryHegemonyTable'
import { AS_INTERDEPENDENCIES_LAYOUT } from './layouts'
import i18n from '@/locales/i18n'

import { HegemonyCountryQuery, AS_FAMILY } from '@/plugins/IhrApi'

const DEFAULT_TRACE = [
  {
    // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: 'y2',
    name: i18n.t('charts.countryHegemony.defaultTrace'),
    showlegend: false,
    hovertemplate: '%{x}<br>' + '%{yaxis.title.text}: <b>%{y:.2f}</b>' + '<extra></extra>',
  },
]

export default {
  mixins: [CommonChartMixin],
  components: {
    AsInterdependenciesTable,
  },
  props: {
    countryCode: {
      type: String,
      required: true,
    },
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4,
    },
    eyeballThreshold: {
      type: Number,
      default: 10,
    },
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    return {
      details: {
        activeTab: 'dependency',
        date: null,
        tablesData: {
          dependency: { data: [] },
        },
        tableVisible: true,
      },
      loading: true,
      hegemonyFilter: null,
      traces: DEFAULT_TRACE,
      layout: AS_INTERDEPENDENCIES_LAYOUT,
      major_eyeball: [],
    }
  },
  beforeMount() {
    this.updateAxesLabel()
  },
  mounted() {
    this.details.date = `${this.startTime} - ${this.endTime}`
  },
  methods: {
    updateAxesLabel() {
      this.layout.yaxis.title = this.countryCode + ` ${this.$t('charts.countryHegemony.yaxis')}`
      this.layout.yaxis2.title = `${this.$t('charts.countryHegemony.yaxis2')} ` + this.countryCode
    },
    makeHegemonyFilter() {
      console.log('going to query country hegemony')
      return new HegemonyCountryQuery()
        .country(this.countryCode)
        .addressFamily(this.addressFamily)
        .timeInterval(this.startTime, this.endTime)
    },
    apiCall() {
      if (this.asNumber == 0) return
      this.updateAxesLabel()
      this.hegemonyFilter = this.makeHegemonyFilter()
      this.loading = true
      this.queryCountryHegemonyAPI()
    },
    queryCountryHegemonyAPI() {
      console.log('in queryCountryHegemonyAPI')
      this.loading = true
      this.$ihr_api.hegemony_country(
        this.hegemonyFilter,
        result => {
          this.fetchCountryHegemony(result.results)
          this.loading = false
        },
        error => {
          console.error(error) //FIXME do a correct alert
        }
      )
    },
    median(values) {
      if (values == undefined) return 0
      if (values.length === 0) return 0

      values.sort(function (a, b) {
        return a - b
      })

      var half = Math.floor(values.length / 2)

      if (values.length % 2) return values[half]

      return (values[half - 1] + values[half]) / 2.0
    },
    fetchCountryHegemony(data) {
      this.traces = []
      let traces = {}
      data.forEach(elem => {
        let trace = traces[elem.asn]
        if (trace === undefined) {
          trace = {
            hege_as: [],
            hege_eye_all: [],
            hege_eye_transit: [],
            asn: elem.asn,
            asn_name: elem.asn_name,
            eyeball: 0,
            name: this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) + ' ' + elem.asn_name.split(' ')[0],
            hovertemplate:
              '<b>' +
              this.$options.filters.ihr_NumberToAsOrIxp(elem.asn) +
              ' ' +
              elem.asn_name.split(' ')[0] +
              '</b><br><br>' +
              '%{x}<br>' +
              '%{yaxis.title.text}: <b>%{y:.2f}</b>' +
              '<extra></extra>',
          }
          traces[elem.asn] = trace
          this.traces.push(trace)
        }
        if (elem.weightscheme == 'as') {
          if (!elem.transitonly) {
            trace.hege_as.push(elem.hege)
          }
        } else if (elem.weightscheme == 'eyeball') {
          if (elem.transitonly) {
            trace.hege_eye_transit.push(elem.hege)
          } else {
            trace.hege_eye_all.push(elem.hege)
            trace.eyeball = elem.weight
          }
        }
      })

      // Compute median value from each array of hegemony scores
      this.major_eyeball = []
      this.traces.forEach(elem => {
        elem.hege_as = this.median(elem.hege_as) * 100
        elem.hege_eye_all = this.median(elem.hege_eye_all) * 100
        elem.hege_eye_transit = this.median(elem.hege_eye_transit) * 100

        if (elem.eyeball > this.eyeballThreshold) {
          this.major_eyeball.push(elem.asn)
        }
      })
      this.$emit('eyeballs', this.major_eyeball)

      // TODO remove the 2 fl
      this.noData |= Object.keys(traces).length == 0
      this.layout.datarevision = new Date().getTime()

      this.details.tableVisible = true
      this.details.tablesData['dependency'] = {
        data: this.traces,
      }
    },
  },
  computed: {
    dateStr() {
      let year = this.details.date.getUTCFullYear()
      var day = this.details.date.getUTCDate()
      var month = this.details.date.getUTCMonth() + 1
      var hours = this.details.date.getUTCHours()
      var minutes = this.details.date.getUTCMinutes()
      var seconds = this.details.date.getUTCSeconds()

      if (day < 10) day = '0' + day
      if (month < 10) month = '0' + month
      if (hours < 10) hours = '0' + hours
      if (minutes < 10) minutes = '0' + minutes
      if (seconds < 10) seconds = '0' + seconds

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`
    },
    countryHegemonyData() {
      return this.details.tablesData.dependency.data
    },
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter)
    },
  },
  watch: {
    addressFamily() {
      this.debouncedApiCall()
    },
    countryCode() {
      this.debouncedApiCall()
    },
    'details.activeTab'(newValue) {
      this.updateQuery({ hege_tb: newValue })
    },
    'details.date'() {},
  },
}
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";
.bgplay-container {
  overflow: hidden;
  padding-top: 1100px;
  position: relative;
}

.bgplay-container iframe {
   border: 0;
   height: 100%;
   left: 0;
   position: absolute;
   top: 0;
   width: 100%;
}
</style>
