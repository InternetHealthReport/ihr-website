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
      </div>
    </div>
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
      <aggregated-alarms-controller :key="$route.fullPath" :startTime="startTime" :endTime="endTime" />
    </q-expansion-item>
  </div>
</template>

<script>
import reportMixin from '@/views/mixin/reportMixin'
import DateTimePicker from '@/components/DateTimePicker'
import AggregatedAlarmsController from './charts/global/AggregatedAlarmsController'
import html2pdf from 'html2pdf.js'

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

export default {
  mixins: [reportMixin],
  components: {
    AggregatedAlarmsController,
    DateTimePicker
  },
  data() {
    let filterLevel = Number(this.$route.query.filter_level)
    filterLevel = filterLevel ? filterLevel : PARAMETERS_LEVEL.MEDIUM
    return {
      filterLevel: filterLevel,
      aggregatedAlarmsExpanded: true,
      asnListState: REPORT_TYPE.GLOBAL,
      defaultTimeRange: 1
    }
  },
  mounted() {
    this.fetch = true
  },
  methods: {
    pushRoute() {
      const currentQuery = {
        filter_level: String(this.filterLevel),
        last: String(this.interval.dayDiff()),
        date: this.$options.filters.ihrUtcString(this.interval.end, false),
      };
      if (JSON.stringify(currentQuery) !== JSON.stringify(this.$route.query)) {
        const newRoute = { query: currentQuery, hash: this.$route.hash }
        this.$router.replace(newRoute);
      }
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
    }
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
    }
  },
  watch: {
    filterLevel(newValue, oldValue) {
      if (newValue != oldValue) {
        this.pushRoute()
      }
    }
  }
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
