<template>
  <div id="IHR_as-and-ixp-container">
    <h1 class="text-center">{{headerString}}</h1>
    <h2 class="text-center">{{subHeader}}</h2>
    <q-list v-if="showGraphs">
      <q-expansion-item
        expand-separator
        :label="$t('charts.asInterdependencies.title')"
        header-class="IHR_charts-title"
        default-opened
      >
        <as-interdependencies-chart
          :start-time="startTime"
          :end-time="endTime"
          :as-number="asNumber"
          :as-family="family"
          :fetch="fetch"
          ref="asInterdependenciesChart"
        />
      </q-expansion-item>
      <q-expansion-item
        expand-separator
        :label="$t('charts.delayAndForwarding.title')"
        header-class="IHR_charts-title"
        default-opened
      >
        <delay-and-forwarding-chart
          :start-time="startTime"
          :end-time="endTime"
          :as-number="asNumber"
          :fetch="fetch"
          ref="delayAndForwardingChart"
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
          :stream-name="asNumber"
          :fetch="fetch"
          ref="discoChart"
        />
      </q-expansion-item>
      <q-drawer :value="showSidebar" side="right" bordered @on-layout="resizeCharts">
        <prefix-overview ip="198.32.118.63 " class="IHR_prefix-overview-container"/>
      </q-drawer>
      <div class="IHR_last-element">&nbsp;</div>
      <q-page-sticky position="bottom" class="IHR_time-filter" expand>
        <interval-picker v-model="interval" white />
      </q-page-sticky>
    </q-list>
  </div>
</template>

<script>
import IntervalPicker, { ChartInterval } from "@/components/IntervalPicker";
import AsInterdependenciesChart from "@/views/charts/AsInterdependenciesChart";
import DiscoChart from "@/views/charts/DiscoChart";
import DelayAndForwardingChart from "@/views/charts/DelayAndForwardingChart";
import { AS_FAMILY, NetworkQuery } from "@/plugins/IhrApi";

import PrefixOverview from "@/components/ripe/PrefixOverview";
import { setTimeout } from 'timers';

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1
};

const CHART_REFS = [
  'asInterdependenciesChart',
  'delayAndForwardingChart',
  'delayAndForwardingChart'];

export default {
  components: {
    AsInterdependenciesChart,
    DiscoChart,
    DelayAndForwardingChart,
    IntervalPicker,
    PrefixOverview
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    //correct
    let routePieces = this.$route.params.asn.match(/[0-9]+$/);
    let asNumber = Number(routePieces[0]);
    if (this.$route.params.asn.startsWith("IXP")) asNumber = -asNumber;
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return {
      family: AS_FAMILY.v4,
      fetch: false,
      loadingStatus: LOADING_STATUS.LOADING,
      asNumber: asNumber,
      asName: null,
      interval: new ChartInterval(lastWeek, new Date())
    };
  },
  methods: {
    resizeCharts() {
      setTimeout(() => {
        CHART_REFS.forEach((chart)=>{
          this.$refs[chart].relayout();
        });
      },400);
    }
  },
  mounted() {
    let filter = new NetworkQuery().asNumber(this.asNumber);
    this.$ihr_api.network(filter, results => {
      if (results.count != 1) {
        this.loadingStatus = LOADING_STATUS.ERROR;
        return;
      }

      this.asName = results.results[0].name;
      this.loadingStatus = LOADING_STATUS.LOADED;
      this.fetch = true;
    });
  },
  computed: {
    startTime() {
      return this.interval.begin;
    },
    endTime() {
      return this.interval.end;
    },
    showGraphs() {
      return this.loadingStatus == LOADING_STATUS.LOADED;
    },
    headerString() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t("AsAndIxp.headerString.loading");
        case LOADING_STATUS.NOT_FOUND:
          return this.$t("AsAndIxp.headerString.notFound");
        case LOADING_STATUS.EXPIRED:
          return this.$t("AsAndIxp.headerString.expired");
        case LOADING_STATUS.LOADED:
          return this.asName;
        default:
        case LOADING_STATUS.ERROR:
          return this.$t("genericErrors.ups");
      }
    },
    subHeader() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t("AsAndIxp.subHeader.loading");
        case LOADING_STATUS.NOT_FOUND:
          return this.$t("AsAndIxp.subHeader.notFound");
        case LOADING_STATUS.EXPIRED:
          return this.$t("AsAndIxp.subHeader.expired");
        case LOADING_STATUS.LOADED:
          return this.$route.params.asn;
        default:
        case LOADING_STATUS.ERROR:
          return this.$t("genericErrors.badHappened");
      }
    }
  }
};
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

#IHR_as-and-ixp-container
  width 90%
  margin 0 auto

.IHR_
  &time-filter
    background-color $secondary
    padding 8px 0px

    & > *:first-child
      width 100%

  &last-element
    margin-bottom 40px

  &charts-title
    text-align center
    text-transform capitalize
    font-size 22pt
</style>
