<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div class="q-mb-xs">
      <div class="text-center">
        <div class="text-h1">{{ title }}</div>
        <div class="text-h3">
          {{ interval.dayDiff() }}-day report ending on {{ reportDateFmt }}
          <date-time-picker :min="minDate" :max="maxDate" :value="maxDate" @input="setReportDate" hideTime
            class="IHR_subtitle_calendar" />
        </div>
        <!-- <button @click="generateReport()" class="np-btn">Generate Report</button> -->
      </div>
    </div>
<!--
    <q-card class="q-mb-xl" flat>
      <q-card-section>
        <div class="row justify-center q-pa-md">
          <div class="text">
            <q-input outlined debounce="300" v-model="globalFilter" placeholder="Filter">
              <template v-slot:append>
                <q-icon name="fas fa-filter" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-section class="stat-cards">
        <div class="stat-grid">
          <div class="stat-tab text-center text-h3">
            <router-link :to="{ path: this.$route.path, query: this.$route.query, hash: 'hegemony' }" class="IHR_global_stats">
              <q-spinner v-if="loading.hegemony" color="primary" size="1em" />
              <b v-else>{{ nbAlarms.hegemony }}</b>
              AS Dependency Alarms
            </router-link>
          </div>
          <div class="stat-tab text-center text-h3">
            <router-link :to="{ path: this.$route.path, query: this.$route.query, hash: 'networkDelay' }" class="IHR_global_stats">
              <q-spinner v-if="loading.networkDelay" color="primary" size="1em" />
              <b v-else>{{ nbAlarms.networkDelay }}</b> Network Delay Alarms
            </router-link>
          </div>
          <div class="stat-tab text-center text-h3">
            <router-link :to="{ path: this.$route.path, query: this.$route.query, hash: 'linkDelay' }" class="IHR_global_stats">
              <q-spinner v-if="loading.linkDelay" color="primary" size="1em" />
              <b v-else>{{ nbAlarms.linkDelay }}</b> Link Delay Alarms
            </router-link>
          </div>
          <div class="stat-tab text-center text-h3">
            <router-link :to="{ path: this.$route.path, query: this.$route.query, hash: 'disco' }" class="IHR_global_stats">
              <q-spinner v-if="loading.disco" color="primary" size="1em" />
              <b v-else>{{ nbAlarms.disco }}</b> Network Disconnections
            </router-link>
          </div>
        </div>
      </q-card-section>
      <q-separator />
    </q-card>
 -->
    <q-expansion-item caption="IHR Aggregated Alarms" header-class="IHR_charts-title" default-opened expand-icon-toggle
      v-model="aggregatedAlarmsExpanded">
      <template v-slot:header>
        <div class="graph-header-div">
          <q-item-section class="graph-header">
            <q-item-section avatar>
              <q-icon name="fas fa-plug" color="primary" text-color="white" />
            </q-item-section>

            <q-item-section>
              <a id="aggregatedAlarms"></a>
              <div class="text-primary">
                {{ $t('charts.aggregatedAlarms.title') }}
              </div>
              <div class="text-caption text-grey">IHR Aggregated Alarms</div>
            </q-item-section>
          </q-item-section>
        </div>
      </template>
      <aggregated-alarms-controller :startTime="startTime" :endTime="endTime" :hegemonyAlarms="hegemonyAlarms"
        :networkDelayAlarms="networkDelayAlarms" :key="aggregatedAlarmsKey" :hegemonyLoading="loading.hegemony"
        :networkDelayLoading="loading.networkDelay" />
    </q-expansion-item>
    <a id="hegemony"></a>
    <div v-show="!this.nbAlarms['hegemony']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="ndelayExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-project-diagram" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <div class="text-primary text-grey">
                  {{ $t('charts.asInterdependencies.title') }}
                </div>
                <div class="text-caption text-grey">BGP data</div>
              </q-item-section>
            </q-item-section>

            <q-item-section class="filter-div">
              <div class="text" v-if="hegemonyExpanded">
                <q-input debounce="300" v-model="hegemonyFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
      </q-expansion-item>
    </div>
    <div v-show="this.nbAlarms['hegemony']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="hegemonyExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-project-diagram" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <div class="text-primary">
                  {{ $t('charts.asInterdependencies.title') }}
                </div>
                <div class="text-caption text-grey">BGP data</div>
              </q-item-section>
            </q-item-section>

            <q-item-section class="filter-div">
              <div class="text" v-if="hegemonyExpanded">
                <q-input debounce="300" v-model="hegemonyFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
        <q-card class="IHR_charts-body">
          <q-card-section>
            <hegemony-alarms-chart :start-time="startTime" :end-time="endTime" :fetch="fetch"
              :min-deviation="minDeviationNetworkDelay" :filter="hegemonyFilter"
              @filteredRows="newFilteredRows('hegemony', $event)" @loading="hegemonyLoading"
              @hegemony-alarms-data-loaded="hegemonyAlarms = $event" ref="ihrChartHegemonyAlarms" />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>
    <a id="networkDelay"></a>
    <div v-show="!this.nbAlarms['networkDelay']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="ndelayExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-shipping-fast" color="primary" text-color="white" />
              </q-item-section>
              <q-item-section>
                <div class="text-primary text-grey">{{ $t('charts.networkDelay.title') }}</div>
                <div class="text-caption text-grey">Traceroute data</div>
              </q-item-section>
            </q-item-section>
            <q-item-section class="filter-div">
              <div class="text" v-if="ndelayExpanded">
                <q-input debounce="300" v-model="ndelayFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
      </q-expansion-item>
    </div>
    <div v-show="this.nbAlarms['networkDelay']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="ndelayExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-shipping-fast" color="primary" text-color="white" />
              </q-item-section>
              <q-item-section>
                <div class="text-primary">{{ $t('charts.networkDelay.title') }}</div>
                <div class="text-caption text-grey">Traceroute data</div>
              </q-item-section>
            </q-item-section>
            <q-item-section class="filter-div">
              <div class="text" v-if="ndelayExpanded">
                <q-input debounce="300" v-model="ndelayFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
        <q-card class="IHR_charts-body">
          <q-card-section>
            <network-delay-alarms-chart :start-time="startTime" :end-time="endTime" :fetch="fetch"
              :min-deviation="minDeviationNetworkDelay" :filter="ndelayFilter"
              @filteredRows="newFilteredRows('networkDelay', $event)" @loading="networkDelayLoading"
              @network-delay-alarms-data-loaded="networkDelayAlarms = $event" ref="ihrChartNetworkDelay" />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>
    <a id="linkDelay"></a>
    <div v-show="!this.nbAlarms['linkDelay']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="ndelayExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-exchange-alt" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <div class="text-primary text-grey">
                  {{ $t('charts.delayAndForwarding.title') }}
                </div>
                <div class="text-caption text-grey">Traceroute data</div>
              </q-item-section>
            </q-item-section>
            <q-item-section class="filter-div">
              <div class="text" v-if="linkExpanded">
                <q-input debounce="300" v-model="linkFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
      </q-expansion-item>
    </div>
    <div v-show="this.nbAlarms['linkDelay']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="linkExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-exchange-alt" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <div class="text-primary">
                  {{ $t('charts.delayAndForwarding.title') }}
                </div>
                <div class="text-caption text-grey">Traceroute data</div>
              </q-item-section>
            </q-item-section>
            <q-item-section class="filter-div">
              <div class="text" v-if="linkExpanded">
                <q-input debounce="300" v-model="linkFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
        <q-card class="IHR_charts-body">
          <q-card-section>
            <delay-chart :start-time="startTime" :end-time="endTime" :fetch="fetch" :min-nprobes="minNprobes"
              :min-deviation="minDeviation" :min-diffmedian="minDiffmedian" :max-diffmedian="maxDiffmedian"
              :filter="linkFilter" @filteredRows="newFilteredRows('linkDelay', $event)" @loading="linkDelayLoading"
              :selected-asn="asnList" ref="ihrChartDelay" @prefix-details="showDetails($event)" />
          </q-card-section>
        </q-card>
      </q-expansion-item>
    </div>
    <a id="disco"></a>
    <!-- <div v-show="!this.nbAlarms['disco']">
      <q-expansion-item header-class="IHR_charts-title" default-opened expand-icon-toggle v-model="ndelayExpanded">
        <template v-slot:header>
          <div class="graph-header-div">
            <q-item-section class="graph-header">
              <q-item-section avatar>
                <q-icon name="fas fa-plug" color="primary" text-color="white" />
              </q-item-section>

              <q-item-section>
                <div class="text-primary text-grey">
                  {{ $t('charts.disconnections.title') }}
                </div>
                <div class="text-caption text-grey">RIPE Atlas log</div>
              </q-item-section>
            </q-item-section>
            <q-item-section class="filter-div">
              <div class="text" v-if="discoExpanded">
                <q-input debounce="300" v-model="discoFilter" placeholder="Filter">
                  <template v-slot:append>
                    <q-icon name="fas fa-filter" />
                  </template>
                </q-input>
              </div>
            </q-item-section>
          </div>
        </template>
      </q-expansion-item>
    </div> -->
    <!-- <div v-show="this.nbAlarms['disco']"> -->
    <q-expansion-item caption="RIPE Atlas log" header-class="IHR_charts-title" default-opened expand-icon-toggle
      v-model="discoExpanded">
      <template v-slot:header>
        <div class="graph-header-div">
          <q-item-section class="graph-header">
            <q-item-section avatar>
              <q-icon name="fas fa-plug" color="primary" text-color="white" />
            </q-item-section>

            <q-item-section>
              <div class="text-primary">
                {{ $t('charts.disconnections.title') }}
              </div>
              <div class="text-caption text-grey">RIPE Atlas log</div>
            </q-item-section>
          </q-item-section>
          <q-item-section class="filter-div">
            <div class="text" v-if="discoExpanded">
              <q-input debounce="300" v-model="discoFilter" placeholder="Filter">
                <template v-slot:append>
                  <q-icon name="fas fa-filter" />
                </template>
              </q-input>
            </div>
          </q-item-section>
        </div>
      </template>

      <q-card class="IHR_charts-body">
        <q-card-section>
          <disco-chart :start-time="startTime" :end-time="endTime" :fetch="fetch" :min-avg-level="minAvgLevel"
            :geoprobes.sync="geoProbes" :filter="discoFilter" @filteredRows="newFilteredRows('disco', $event)"
            @loading="discoLoading" :selected-asn="asnList" ref="ihrChartDisco" />
        </q-card-section>
      </q-card>
    </q-expansion-item>

  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import DiscoChart, { DEFAULT_DISCO_AVG_LEVEL } from './charts/global/DiscoChart'
import NetworkDelayAlarmsChart from './charts/global/NetworkDelayAlarmsChart'
import HegemonyAlarmsChart from './charts/global/HegemonyAlarmsChart'
import AggregatedAlarmsController from './charts/global/AggregatedAlarmsController'
import DelayChart, {
  DEFAULT_MIN_NPROBES,
  DEFAULT_MIN_DEVIATION,
  DEFAULT_MIN_DIFFMEDIAN,
  DEFAULT_MAX_DIFFMEDIAN,
} from './charts/global/DelayChart'
import DateTimePicker from '@/components/DateTimePicker'
import html2pdf from 'html2pdf.js'

const CHART_REFS = ['ihrChartNetworkDelay', 'ihrChartDelay', 'ihrChartMap', 'ihrChartDisco']

const REPORT_TYPE = {
  GLOBAL: 0,
  PERSONAL: 1,
  TIER_1: 2,
}

const PARAMETERS_LEVEL = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
}

const LEVEL_OPTIONS = Object.keys(PARAMETERS_LEVEL).map(key => {
  return { label: key, value: PARAMETERS_LEVEL[key] }
})
const LEVEL_COLOR = ['warning', 'positive', 'negative']

//TODO use presets with some sense
const PRAMETERS_PRESETS = {
  DISCO_AVG_LEVEL: [7, DEFAULT_DISCO_AVG_LEVEL, 10],
  MIN_NPROBES: [5, DEFAULT_MIN_NPROBES, 12],
  MIN_DEVIATION: [100, DEFAULT_MIN_DEVIATION, 120],
  MIN_DIFFMEDIAN: [10, DEFAULT_MIN_DIFFMEDIAN, 20],
  MAX_DIFFMEDIAN: [150, DEFAULT_MAX_DIFFMEDIAN, 300],
}

const PRESETS_ASN_LISTS = []

export default {
  mixins: [reportMixin],
  components: {
    NetworkDelayAlarmsChart,
    HegemonyAlarmsChart,
    DiscoChart,
    AggregatedAlarmsController,
    DelayChart,
    DateTimePicker,
  },
  data() {
    let filterLevel = Number(this.$route.query.filter_level)
    filterLevel = filterLevel ? filterLevel : PARAMETERS_LEVEL.MEDIUM

    return {
      globalFilter: '',
      hegemonyFilter: '',
      ndelayFilter: '',
      linkFilter: '',
      discoFilter: '',
      hegemonyExpanded: true,
      ndelayExpanded: true,
      linkExpanded: true,
      discoExpanded: true,
      aggregatedAlarmsExpanded: true,
      presetAsnLists: PRESETS_ASN_LISTS,
      levelOptions: LEVEL_OPTIONS,
      levelColors: LEVEL_COLOR,
      filterLevel: filterLevel,
      minAvgLevel: PRAMETERS_PRESETS.DISCO_AVG_LEVEL[filterLevel],
      minNprobes: PRAMETERS_PRESETS.MIN_NPROBES[filterLevel],
      minDeviation: PRAMETERS_PRESETS.MIN_DEVIATION[filterLevel],
      minDeviationNetworkDelay: 20,
      minDiffmedian: PRAMETERS_PRESETS.MIN_DIFFMEDIAN[filterLevel],
      maxDiffmedian: PRAMETERS_PRESETS.MAX_DIFFMEDIAN[filterLevel],
      charRefs: CHART_REFS,
      asnList: [],
      asnListState: REPORT_TYPE.GLOBAL,
      geoProbes: [],
      // hideValue: {
      //   hegemony: 0,
      //   networkDelay: 0,
      //   linkDelay: 0,
      //   disco: 0,
      // },
      nbAlarms: {
        hegemony: 0,
        networkDelay: 0,
        linkDelay: 0,
        disco: 0,
      },
      loading: {
        hegemony: true,
        networkDelay: true,
        linkDelay: true,
        disco: true,
      },
      hegemonyAlarms: [],
      networkDelayAlarms: [],
    }
  },
  mounted() {
    this.fetch = true
  },
  methods: {
    hegemonyLoading(val) {
      this.$nextTick(function () {
        this.loading.hegemony = val
      })
    },
    networkDelayLoading(val) {
      this.$nextTick(function () {
        this.loading.networkDelay = val
      })
    },
    linkDelayLoading(val) {
      this.$nextTick(function () {
        this.loading.linkDelay = val
      })
    },
    discoLoading(val) {
      this.$nextTick(function () {
        this.loading.disco = val
      })
    },
    pushRoute() {
      this.$router.replace({
        query: {
          filter_level: this.filterLevel,
          last: this.interval.dayDiff(),
          date: this.$options.filters.ihrUtcString(this.interval.end, false),
        },
        hash: this.$route.hash,
      })

      this.minAvgLevel = PRAMETERS_PRESETS.DISCO_AVG_LEVEL[this.filterLevel]
      this.minNprobes = PRAMETERS_PRESETS.MIN_NPROBES[this.filterLevel]
      this.minDeviation = PRAMETERS_PRESETS.MIN_DEVIATION[this.filterLevel]
      this.minDiffmedian = PRAMETERS_PRESETS.MIN_DIFFMEDIAN[this.filterLevel]
      this.maxDiffmedian = PRAMETERS_PRESETS.MAX_DIFFMEDIAN[this.filterLevel]
    },
    fetchList() {
      this.$ihr_api.userShow(
        results => {
          let asnList = []
          results.monitoredasn.forEach(monitored => {
            asnList.push(monitored.asnumber)
          })
          this.asnList = asnList
          this.asnListState = REPORT_TYPE.PERSONAL
        },
        error => {
          console.error(error) //FIXME correct error handling
        }
      )
    },
    newFilteredRows(graphType, val) {
      let search = val[0]
      let rows = val[1]
      if (this.globalFilter == search) {
        this.$nextTick(function () {
          this.nbAlarms[graphType] = rows.length

        })

      }

      // if (this.nbAlarms['networkDelay'] > 0) {
      //   this.hideValue['networkDelay'] = false
      // } else {
      //   this.hideValue['networkDelay'] = true
      // }
    },
    generateReport() {
      let element = this.$refs['ihrAsAndIxpContainer']
      let opt = {
        margin: 0,
        filename: 'GlobalReport.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a3', orientation: 'l' },
      }
      html2pdf(element, opt)
      // console.log('button is clicked')
    },


  },
  computed: {
    title() {
      switch (this.asnListState) {
        case REPORT_TYPE.GLOBAL:
          return this.$t('globalReport.title.global')
        case REPORT_TYPE.PERSONAL:
          return this.$t('globalReport.title.personal')
      }
      return this.$t('globalReport.title.global')
    },
    aggregatedAlarmsKey() {
      return `${JSON.stringify(this.loading.hegemony)}-${JSON.stringify(this.loading.networkDelay)}`
    },
  },
  watch: {
    filterLevel(newValue, oldValue) {
      if (newValue != oldValue) {
        this.pushRoute()
      }
    },
    globalFilter(newValue) {
      this.hegemonyFilter = newValue
      this.ndelayFilter = newValue
      this.linkFilter = newValue
      this.discoFilter = newValue
    },
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';
.stat-grid
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 20px;
  align-items: stretch;
@media screen and (max-width: 768px)
  .stat-grid
    grid-template-columns: repeat(2, 1fr);
@media screen and (max-width: 480px)
  .stat-grid
    grid-template-columns: 1fr;
.stat-cards
  width 100% !important
.stat-tab
  border-radius 10px
  min-height 120px
  background: white;
  border 1px solid #E9E8E8
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  padding: 10px;
  display flex
  flex-direction column
  justify-content center
  align-items center
.IHR_global_stats
  text-decoration none;
  display flex;
  justify-content center;
  align-items center;
  flex-direction column;
.IHR_charts-body
  border-radius 20px
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
.IHR_charts-title
  width 100%
  margin-top 10px
.graph-header
  display flex
  justify-content flex-start
  align-items center
  flex-direction row
  width 100%
.graph-header-div
  display flex
  justify-content space-between
  align-items center
  width 100%
.filter-div
  max-width 300px
.toggle-arrow
  padding 0px 0px 0px 16px !important
@media screen and (max-width: 650px)
  .graph-header-div
    flex-direction column
    justify-content center
    align-items flex-start
  .filter-div
    margin-top 5px
[dir=ltr] .q-item__section--side
  padding-right: 0;
  padding-left: 16px;
.IHR_
  &subtitle_calendar
      position relative
      top -5px
      left 5px

  &sidebar-filter-section-global
    & label
      margin 0pt 4pt
      font-weight 600

  &presets-name
    font-weight 500
    &-vertical
        font-size 18pt
        width 100%
        text-align center
        margin 8pt 0
        border-top rgb(164, 171, 171, 90) solid 2px
        transition font-weight 0.2s;

        &:last-of-type
          border-bottom rgb(164, 171, 171, 90) solid 2px

        &:hover
          font-weight 600

        & > span
          color $accent
          display inline-block
          padding 14px 0px
          transform rotate(-90deg)
          /*
          text-orientation upright
          letter-spacing -7px
          */
          cursor pointer
</style>
