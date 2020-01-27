<template>
  <div class="IHR_char-container">
    <div class="q-mb-xl">
        <h1 class="text-center">{{title}}</h1>
        <h2 class="text-center"> 
            {{reportDateFmt}}
            <date-time-picker
                :min="minDate"
                :max="maxDate"
                :value="maxDate"
                @input="setReportDate"
                hideTime
                class="IHR_subtitle_calendar"
            />
        </h2>
    </div>
    <q-expansion-item
      expand-separator
      :label="$t('charts.linkDelays.title')"
      header-class="IHR_charts-title"
      default-opened
    >
      <delay-chart
        :start-time="startTime"
        :end-time="endTime"
        :fetch="fetch"
        :min-nprobes="minNprobes"
        :min-deviation="minDeviation"
        :min-diffmedian="minDiffmedian"
        :max-diffmedian="maxDiffmedian"
        :selected-asn="asnList"
        ref="ihrChartDelay"
        @prefix-details="showDetails($event)"
      />
    </q-expansion-item>
    <q-expansion-item
      expand-separator
      :label="$t('charts.disconnections.title')"
      header-class="IHR_charts-title"
      default-opened
    >
      <events-map :geo-probes="geoProbes" ref="ihrChartMap" />
    </q-expansion-item>
    <q-expansion-item
      expand-separator
      :label="$t('charts.disconnections.title')"
      header-class="IHR_charts-title"
      default-opened
    >
      <disco-chart
        :start-time="startTime"
        :end-time="endTime"
        :fetch="fetch"
        :min-avg-level="minAvgLevel"
        :geoprobes.sync="geoProbes"
        ref="ihrChartDisco"
      />
    </q-expansion-item>
    <q-drawer
      :value="true"
      side="left"
      :mini="!showSidebar"
      show-if-above
      bordered
      @on-layout="resizeCharts"
    >
      <!-- non minified area -->
      <div class="fit column">
        <div class="IHR_sidebar-filter-section-global col-auto q-mini-drawer-hide q-gutter-y-md">
          <div>
            <label>filter level</label>
            <q-btn-toggle
              class="col"
              v-model="filterLevel"
              :toggle-color="levelColors[filterLevel]"
              :toggle-text-color="levelColors[filterLevel] == 'warning'?'black':'white'"
              :options="levelOptions"
            />
          </div>
        </div>
        <q-scroll-area class="col">
          <q-list padding>
            <q-item clickable v-ripple @click="fetchList" v-if="$ihr_api.authenticated">
              <q-item-section avatar>
                <q-icon name="fas fa-user-circle" color="accent" />
              </q-item-section>
              <q-item-section class="IHR_presets-name">{{$t('globalReport.filters.monitoredAsn')}}</q-item-section>
            </q-item>
            <q-item
              clickable
              v-ripple
              @click="asnList = preset.asnList"
              :key="preset.name"
              v-for="preset in presetAsnLists"
            >
              <q-item-section class="IHR_presets-name">{{preset.name}}</q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </div>
       <!--minified area -->
      <template v-slot:mini>
        <q-scroll-area class="fit cursor-pointer column">
          <q-avatar
            text-color="accent"
            icon="fas fa-user-circle"
            class="col-auto"
            font-size="20pt"
            style="width: 100%"
            v-if="$ihr_api.authenticated"
            @click="fetchList"
          />
          <div
            clickable
            @click="asnList = preset.asnList"
            :key="preset.name"
            v-for="preset in presetAsnLists"
            class="IHR_presets-name-vertical col-auto"
          >
            <span>{{preset.name}}</span>
          </div>
        </q-scroll-area>
      </template>
    </q-drawer>
  </div>
</template>

<script>
import reportMixin from "@/views/mixin/reportMixin";
import DiscoChart, {
  DEFAULT_DISCO_AVG_LEVEL
} from "./charts/global/DiscoChart";
import DelayChart, {
  DEFAULT_MIN_NPROBES,
  DEFAULT_MIN_DEVIATION,
  DEFAULT_MIN_DIFFMEDIAN,
  DEFAULT_MAX_DIFFMEDIAN
} from "./charts/global/DelayChart";
import EventsMap from "./charts/global/EventsMap";
import DateTimePicker from "@/components/DateTimePicker";

const CHART_REFS = ["ihrChartDelay", "ihrChartMap", "ihrChartDisco"];

const REPORT_TYPE = {
  GLOBAL: 0,
  PERSONAL: 1,
  TIER_1: 2
};

const PARAMETERS_LEVEL = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2
};

const LEVEL_OPTIONS = Object.keys(PARAMETERS_LEVEL).map(key => {
  return { label: key, value: PARAMETERS_LEVEL[key] };
});
const LEVEL_COLOR = ["warning", "positive", "negative"];

//TODO use presets with some sense
const PRAMETERS_PRESETS = {
  DISCO_AVG_LEVEL: [7, DEFAULT_DISCO_AVG_LEVEL, 10],
  MIN_NPROBES: [5, DEFAULT_MIN_NPROBES, 12],
  MIN_DEVIATION: [100, DEFAULT_MIN_DEVIATION, 120],
  MIN_DIFFMEDIAN: [10, DEFAULT_MIN_DIFFMEDIAN, 20],
  MAX_DIFFMEDIAN: [150, DEFAULT_MAX_DIFFMEDIAN, 300]
};

const PRESETS_ASN_LISTS = [];
const PRESETS_ASN_LISTS_SAVE = [
  {
    name: "Tier1",
    asnList: [2914, 4134, 7018, 3356, 1299, 3257, 6939, 174]
  },
  {
    name: "SNS",
    asnList: [32934, 14618, 54113, 13414, 14413, 37936, 47541]
  },
  {
    name: "CDN",
    asnList: [
      20940,
      14618,
      54113,
      16509,
      15169,
      8075,
      12200,
      45102,
      22822,
      15133
    ]
  },
  {
    name: "DNS",
    asnList: [
      26415,
      394353,
      2149,
      10886,
      21556,
      3557,
      5927,
      1508,
      29216,
      26415,
      25152,
      20144,
      7500
    ]
  }
];

export default {
  mixins: [reportMixin],
  components: {
    DiscoChart,
    DelayChart,
    EventsMap,
    DateTimePicker
  },
  data() {
    let filterLevel = Number(this.$route.query.filter_level);
    filterLevel = filterLevel ? filterLevel : PARAMETERS_LEVEL.MEDIUM;

    return {
      presetAsnLists: PRESETS_ASN_LISTS,
      levelOptions: LEVEL_OPTIONS,
      levelColors: LEVEL_COLOR,
      filterLevel: filterLevel,
      minAvgLevel: PRAMETERS_PRESETS.DISCO_AVG_LEVEL[filterLevel],
      minNprobes: PRAMETERS_PRESETS.MIN_NPROBES[filterLevel],
      minDeviation: PRAMETERS_PRESETS.MIN_DEVIATION[filterLevel],
      minDiffmedian: PRAMETERS_PRESETS.MIN_DIFFMEDIAN[filterLevel],
      maxDiffmedian: PRAMETERS_PRESETS.MAX_DIFFMEDIAN[filterLevel],
      charRefs: CHART_REFS,
      asnList: [],
      asnListState: REPORT_TYPE.GLOBAL,
      geoProbes: [],
    };
  },
  mounted() {
    this.fetch = true;
  },
  methods: {
    pushRoute() {
      this.$router.push({
        query: {
          filter_level: this.filterLevel,
          last: this.interval.dayDiff(),
          date: this.$options.filters.ihrUtcString(this.interval.end, false)
        }
      });

      this.minAvgLevel = PRAMETERS_PRESETS.DISCO_AVG_LEVEL[this.filterLevel];
      this.minNprobes = PRAMETERS_PRESETS.MIN_NPROBES[this.filterLevel];
      this.minDeviation = PRAMETERS_PRESETS.MIN_DEVIATION[this.filterLevel];
      this.minDiffmedian = PRAMETERS_PRESETS.MIN_DIFFMEDIAN[this.filterLevel];
      this.maxDiffmedian = PRAMETERS_PRESETS.MAX_DIFFMEDIAN[this.filterLevel];
    },
    fetchList() {
      this.$ihr_api.userShow(
        results => {
          let asnList = [];
          results.monitoredasn.forEach(monitored => {
            asnList.push(monitored.asnumber);
          });
          this.asnList = asnList;
          this.asnListState = REPORT_TYPE.PERSONAL;
          console.log(asnList);
        },
        error => {
          console.error(error); //FIXME correct error handling
        }
      );
    },
  },
  computed: {
    title() {
      switch (this.asnListState) {
        case REPORT_TYPE.GLOBAL:
          return this.$t("globalReport.title.global");
        case REPORT_TYPE.PERSONAL:
          return this.$t("globalReport.title.personal");
      }
    },
  },
  watch: {
    filterLevel(newValue, oldValue) {
      if (newValue != oldValue) {
        this.pushRoute();
      }
    }
  }
};
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

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
