<template>
  <div>
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
        ref="delayAndForwardingChart"
        @prefix-details="showDetails($event)"
      />
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
      />
    </q-expansion-item>
  </div>
</template>

<script>
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

export default {
  components: {
    DiscoChart,
    DelayChart
  },
  data() {
    return {
      startTime: new Date("2019-08-01T00:00+00:00"),
      endTime: new Date("2019-08-02T23:59+00:00"),
      minAvgLevel: DEFAULT_DISCO_AVG_LEVEL,
      minNprobes: DEFAULT_MIN_NPROBES,
      minDeviation: DEFAULT_MIN_DEVIATION,
      minDiffmedian: DEFAULT_MIN_DIFFMEDIAN,
      maxDiffmedian: DEFAULT_MAX_DIFFMEDIAN,
      asFamily: DEFAULT_AS_FAMILY,
      fetch: false
    };
  },
  mounted() {
    this.fetch = true;
  }
};
</script>

<style>
</style>