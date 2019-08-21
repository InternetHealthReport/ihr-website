<template>
  <div class="IHR_char-container">
    <q-expansion-item
      expand-separator
      :label="$t('charts.delays.title')"
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
    <q-drawer :value="showSidebar" side="left" bordered @on-layout="resizeCharts">
      <div class="IHR_sidebar-filter-section row justify-around">
        <interval-picker v-model="interval" class="col-12" />
        <q-input
          v-model.number="minAvgLevel"
          type="number"
          filled
          :hint="$t('globalReport.filters.minAvgLevel')"
          class="col-5"
        />
        <q-input
          v-model.number="minNprobes"
          type="number"
          filled
          :hint="$t('globalReport.filters.minNprobes')"
          class="col-5"
        />
        <q-input
          v-model.number="minDiffmedian"
          type="number"
          filled
          :hint="$t('globalReport.filters.minDiffmedian')"
          class="col-5"
        />
        <q-input
          v-model.number="maxDiffmedian"
          type="number"
          filled
          :hint="$t('globalReport.filters.maxDiffmedian')"
          class="col-5"
        />
        <q-input
          v-model.number="minDeviation"
          type="number"
          filled
          :hint="$t('globalReport.filters.minDeviation')"
          class="col-5"
        />
      </div>
    </q-drawer>
  </div>
</template>

<script>
const CHART_REFS = ["ihrChartDelay", "ihrChartMap", "ihrChartDisco"];

import reportMixin from "@/views/mixin/reportMixin";
import DiscoChart, {
  DEFAULT_DISCO_AVG_LEVEL
} from "./charts/global/DiscoChart";
import DelayChart, {
  DEFAULT_MIN_NPROBES,
  DEFAULT_MIN_DEVIATION,
  DEFAULT_MIN_DIFFMEDIAN,
  DEFAULT_MAX_DIFFMEDIAN,
  DEFAULT_AS_FAMILY
} from "./charts/global/DelayChart";
import EventsMap from "./charts/global/EventsMap";

export default {
  mixins: [reportMixin],
  components: {
    DiscoChart,
    DelayChart,
    EventsMap
  },
  data() {
    let checkAndSet = (par, _default) => {
      let num = Number(this.$route.query[par]);
      return num ? num : _default;
    };

    return {
      minAvgLevel: checkAndSet("min_avg_lvl", DEFAULT_DISCO_AVG_LEVEL),
      minNprobes: checkAndSet("min_nprobes", DEFAULT_MIN_NPROBES),
      minDeviation: checkAndSet("min_deviation", DEFAULT_MIN_DEVIATION),
      minDiffmedian: checkAndSet("min_diffmedian", DEFAULT_MIN_DIFFMEDIAN),
      maxDiffmedian: checkAndSet("max_diffmedian", DEFAULT_MAX_DIFFMEDIAN),
      charRefs: CHART_REFS,
      geoProbes: []
    };
  },
  mounted() {
    this.fetch = true;
  },
  methods: {
    pushRoute() {
      this.$router.push({
        query: {
          min_avg_lvl: this.minAvgLevel,
          min_nprobes: this.minNprobes,
          min_deviation: this.minDeviation,
          min_diffmedian: this.minDiffmedian,
          max_diffmedian: this.maxDiffmedian,
          last: this.interval.dayDiff(),
          date: this.$options.filters.ihrUtcString(this.interval.end, false)
        }
      });
    }
  },
  watch: {
    minAvgLevel() {
      this.pushRoute();
    },
    minNprobes() {
      this.pushRoute();
    },
    minDeviation() {
      this.pushRoute();
    },
    minDiffmedian() {
      this.pushRoute();
    },
    maxDiffmedian() {
      this.pushRoute();
    }
  }
};
</script>

<style>
</style>