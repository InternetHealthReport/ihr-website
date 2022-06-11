<template>
    <div class="IHR_chart">
        <div class="row justify-center">
            <div class="col-2">
                <q-select v-model="selection" :options="selectionOptions"> </q-select>
            </div>
        </div>
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
                <q-tab name="routes" :label="$t('charts.prefixHegemony.table.routesTitle')" />
                <q-tab name="origins" :disable="statsDisable" :label="$t('charts.prefixHegemony.table.originsTitle')" />
                <q-tab name="transits" :disable="statsDisable" :label="$t('charts.prefixHegemony.table.transitsTitle')" />
                <q-tab name="api" label="API" />
            </q-tabs>
            <q-tab-panels v-model="details.activeTab" animated>
                <q-tab-panel name="routes">
                    <as-interdependencies-table :data="prefixHegemonyData" :loading="loading" :showCountry="countryCode == null" />
                </q-tab-panel>
                <q-tab-panel name="origins">
                    <as-interdependencies-table-stats :data="prefixHegemonyDataOrigins" :loading="loading" :columnName="selection.label" />
                </q-tab-panel>
                <q-tab-panel name="transits">
                    <as-interdependencies-table-stats :data="prefixHegemonyDataTransits" :loading="loading" :columnName="selection.label" />
                </q-tab-panel>
                <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
                    <h3>{{ $t('charts.prefixHegemony.table.apiTitle') }}</h3>
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
import { extend } from 'quasar'
import AsInterdependenciesTable from './tables/PrefixHegemonyTable'
import AsInterdependenciesTableStats from './tables/PrefixHegemonyTableStats'
import { AS_INTERDEPENDENCIES_LAYOUT } from './layouts'
import i18n from '@/locales/i18n'

import { HegemonyPrefixQuery, AS_FAMILY, Query } from '@/plugins/IhrApi'

const ROV_SELECTIONS = {
  country: [
    {
      label: 'Originated prefix',
      value: 'Originated prefix',
      description: 'All routes observed in BGP data',
      disable: false,
      icon: 'fas fa-cloud-upload-alt',
    },
    {
      label: 'RPKI invalid',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle',
    },
    {
      label: 'IRR invalid',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation',
    },
    {
      label: 'Bogon ASN',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle',
    },
  ],
  asn: [
    {
      label: 'Originated prefix',
      value: 'Originated prefix',
      description: 'All routes observed in BGP data',
      disable: false,
      icon: 'fas fa-cloud-upload-alt',
    },
    {
      label: 'RPKI invalid (origin & transit)',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle',
    },
    {
      label: 'IRR invalid (origin & transit)',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation',
    },
    {
      label: 'Bogon prefix (origin & transit)',
      value: 'Bogon prefix',
      description: 'Unregistered prefixes seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle',
    },
    {
      label: 'Bogon ASN (transit)',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle',
    },
  ],
  global: [
    {
      label: 'RPKI invalid',
      value: 'RPKI invalid',
      description: 'Routes conflicting with RPKI data',
      disable: false,
      icon: 'fas fa-minus-circle',
    },
    {
      label: 'IRR invalid',
      value: 'IRR invalid',
      description: 'Routes conflicting with IRR data',
      disable: false,
      icon: 'fas fa-exclamation',
    },
    {
      label: 'Bogon prefix',
      value: 'Bogon prefix',
      description: 'Unregistered prefixes seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle',
    },
    {
      label: 'Bogon ASN',
      value: 'Bogon ASN',
      description: 'Unregistered Autonomous System Numbers seen in BGP data',
      disable: false,
      icon: 'fas fa-exclamation-triangle',
    },
  ],
}

export default {
  mixins: [CommonChartMixin],
  components: {
    AsInterdependenciesTable,
    AsInterdependenciesTableStats,
  },
  props: {
    asNumber: {
      type: Number,
    },
    countryCode: {
      type: String,
    },
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4,
    },
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    return {
      details: {
        activeTab: null,
        date: null,
        tablesData: {
          routes: [],
          origins: [],
          transits: [],
        },
        tableVisible: true,
      },
      statsDisable: false,
      loading: true,
      hegemonyFilter: null,
      routes: [],
      origins: {},
      transits: {},
      layout: AS_INTERDEPENDENCIES_LAYOUT,
      selectionOptions: null,
      selection: null,
    }
  },
  beforeMount() {
    if (this.asNumber != null) {
      this.selectionOptions = ROV_SELECTIONS.asn
      this.selection = this.selectionOptions[1]
    } else if (this.countryCode != null) {
      this.selectionOptions = ROV_SELECTIONS.country
      this.selection = this.selectionOptions[1]
    } else {
      this.selectionOptions = ROV_SELECTIONS.global
      this.selection = this.selectionOptions[0]
    }
  },
  mounted() {
    this.details.date = `${this.startTime} - ${this.endTime}`
    if (this.$route.query.rov_tb == null) this.details.activeTab = 'routes'
    else this.details.activeTab = this.$route.query.rov_tb
  },
  methods: {
    makeHegemonyFilter() {
      let filter = new HegemonyPrefixQuery().timeInterval(this.startTime, this.endTime)
      if (this.countryCode != null) {
        filter.country(this.countryCode)
      }
      if (this.asNumber != null) {
        if (this.selection.value == 'Originated prefix') {
          filter.originAs(this.asNumber)
          this.statsDisable = true
        } else {
          filter.asn(this.asNumber)
        }
      }
      if (this.selection.value == 'Bogon prefix') {
        filter.delegatedPrefixStatus('available')
        this.statsDisable = true
      } else if (this.selection.value == 'Bogon ASN') {
        filter.delegatedAsnStatus('available')
        this.statsDisable = true
      } else if (this.selection.value == 'IRR invalid') {
        filter.irrStatus('Invalid')
        this.statsDisable = false
      } else if (this.selection.value == 'RPKI invalid') {
        filter.rpkiStatus('Invalid')
        this.statsDisable = false
      }
      return filter
    },
    apiCall() {
      this.hegemonyFilter = this.makeHegemonyFilter()
      this.loading = true
      this.queryPrefixHegemonyAPI()
    },
    queryPrefixHegemonyAPI() {
      this.loading = true
      this.$ihr_api.hegemony_prefix(
        this.hegemonyFilter,
        result => {
          this.fetchPrefixHegemony(result.results)
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
    fetchPrefixHegemony(data) {
      this.routes = []
      this.origins = {}
      this.transits = {}
      let traces = {}
      data.forEach(elem => {
        let trace_key = elem.prefix + elem.originasn
        let trace = traces[trace_key]
        if (trace === undefined) {
          trace = {
            maxHege: 1,
            dependencies: {},
            visibility: elem.visibility,
            prefix: { value: elem.prefix, descr: elem.descr },
            originasn: { asn: elem.originasn, name: elem.originasn_name },
            rpki_status: elem.rpki_status,
            irr_status: elem.irr_status,
            country: elem.country,
            delegated_prefix_status: elem.delegated_prefix_status,
            delegated_asn_status: elem.delegated_asn_status,
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
          traces[trace_key] = trace
          this.routes.push(trace)
        }

        let route = elem.originasn + elem.prefix

        // Count the different status per origin ASN
        if (!(elem.originasn in this.origins)) {
          this.origins[elem.originasn] = {
            count: {},
            name: elem.originasn_name,
            asn: elem.originasn,
          }
        }
        if (this.selection.value.startsWith('RPKI')) {
          if (!(elem.rpki_status in this.origins[elem.originasn]['count'])) {
            this.origins[elem.originasn]['count'][elem.rpki_status] = {}
          }
          this.origins[elem.originasn]['count'][elem.rpki_status][route] = 1
        } else if (this.selection.value.startsWith('IRR')) {
          if (!(elem.irr_status in this.origins[elem.originasn]['count'])) {
            this.origins[elem.originasn]['count'][elem.irr_status] = {}
          }
          this.origins[elem.originasn]['count'][elem.irr_status][route] = 1
        } else if (this.selection.value.startsWith('Bogon prefix')) {
          if (!(elem.delegated_prefix_status in this.origins[elem.originasn]['count'])) {
            this.origins[elem.originasn]['count'][elem.delegated_prefix_status] = {}
          }
          this.origins[elem.originasn]['count'][elem.delegated_prefix_status][route] = 1
        } else if (this.selection.value.startsWith('Bogon ASN')) {
          if (!(elem.delegated_asn_status in this.origins[elem.originasn]['count'])) {
            this.origins[elem.originasn]['count'][elem.delegated_asn_status] = {}
          }
          this.origins[elem.originasn]['count'][elem.delegated_asn_status][route] = 1
        }

        if (elem.asn == elem.originasn) {
          trace.maxHege = elem.hege
        } else {
          trace.dependencies[elem.asn] = {
            asn: elem.asn,
            name: elem.asn_name,
            hege: elem.hege,
          }

          // Count the different status per transit ASN
          if (!(elem.asn in this.transits)) {
            this.transits[elem.asn] = {
              count: {},
              name: elem.asn_name,
              asn: elem.asn,
            }
          }

          if (this.selection.value.startsWith('RPKI')) {
            if (!(elem.rpki_status in this.transits[elem.asn]['count'])) {
              this.transits[elem.asn]['count'][elem.rpki_status] = {}
            }
            this.transits[elem.asn]['count'][elem.rpki_status][route] = 1
          } else if (this.selection.value.startsWith('IRR')) {
            if (!(elem.irr_status in this.transits[elem.asn]['count'])) {
              this.transits[elem.asn]['count'][elem.irr_status] = {}
            }
            this.transits[elem.asn]['count'][elem.irr_status][route] = 1
          } else if (this.selection.value.startsWith('Bogon prefix')) {
            if (!(elem.delegated_prefix_status in this.transits[elem.asn]['count'])) {
              this.transits[elem.asn]['count'][elem.delegated_prefix_status] = {}
            }
            this.transits[elem.asn]['count'][elem.delegated_prefix_status][route] = 1
          } else if (this.selection.value.startsWith('Bogon ASN')) {
            if (!(elem.delegated_asn_status in this.transits[elem.asn]['count'])) {
              this.transits[elem.asn]['count'][elem.delegated_asn_status] = {}
            }
            this.transits[elem.asn]['count'][elem.delegated_asn_status][route] = 1
          }
        }
      })

      // Compute median value of hegemony scores
      this.routes.forEach(elem => {
        elem.hege_as = this.median(elem.hege_as) * 100
      })

      // Count unique routes
      Object.values(this.transits).forEach(transit => {
        Object.keys(transit.count).forEach(status => {
          transit.count[status] = Object.keys(transit.count[status]).length
        })
      })
      Object.values(this.origins).forEach(origin => {
        Object.keys(origin.count).forEach(status => {
          origin.count[status] = Object.keys(origin.count[status]).length
        })
      })

      // TODO remove the 2 following lines?
      this.noData |= Object.keys(traces).length == 0
      this.layout.datarevision = new Date().getTime()

      this.details.tableVisible = true
      this.details.tablesData.routes = this.routes
      this.details.tablesData.origins = Object.values(this.origins)
      this.details.tablesData.transits = Object.values(this.transits)
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
    prefixHegemonyData() {
      return this.details.tablesData.routes
    },
    prefixHegemonyDataOrigins() {
      return this.details.tablesData.origins
    },
    prefixHegemonyDataTransits() {
      return this.details.tablesData.transits
    },
    hegemonyUrl() {
      return this.$ihr_api.getUrl(this.hegemonyFilter)
    },
  },
  watch: {
    selection() {
      this.debouncedApiCall()
    },
    addressFamily() {
      this.debouncedApiCall()
    },
    countryCode() {
      this.debouncedApiCall()
    },
    'details.activeTab'(newValue) {
      this.updateQuery({ rov_tb: newValue })
    },
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
