<template>
  <div>
    <h1 class="text-center">{{headerString}}</h1>
    <h2 class="text-center">{{subHeader}}</h2>
    <div v-if="showGraphs">
      <as-interdependencies-chart
        :start-time="startTime"
        :end-time="endTime"
        :as-number="asNumber"
        :as-family="family"
        :fetch="fetch"
      />
      <delay-and-forwarding-chart
        :start-time="startTime"
        :end-time="endTime"
        :as-number="asNumber"
        :fetch="fetch"
      />
      <disco-chart
        :start-time="startTime"
        :end-time="endTime"
        :stream-name="asNumber"
        :fetch="fetch"
      />
      <div class="IHR_last-element">&nbsp;</div>
      <q-page-sticky position="bottom" class="IHR_time-filter" expand>
        <interval-picker v-model="interval" white />
      </q-page-sticky>
    </div>
  </div>
</template>

<script>
import IntervalPicker, { ChartInterval } from "@/components/IntervalPicker";
import AsInterdependenciesChart from "@/views/charts/AsInterdependenciesChart";
import DiscoChart from "@/views/charts/DiscoChart";
import DelayAndForwardingChart from "@/views/charts/DelayAndForwardingChart";
import { AS_FAMILY, NetworksQuery } from "@/plugins/IhrApi";

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1
};

export default {
  components: {
    AsInterdependenciesChart,
    DiscoChart,
    DelayAndForwardingChart,
    IntervalPicker
  },
  data() {
    //correct
    let routePieces = this.$route.params.asn.match(/[0-9]+$/);
    let asNumber = Number(routePieces[0]);
    if(this.$route.params.asn.startsWith("IXP"))
      asNumber = -asNumber;
    let lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    return {
      family: AS_FAMILY.v4,
      fetch: false,
      loadingStatus: LOADING_STATUS.LOADING,
      asNumber: asNumber,
      asName: null,
      interval: new ChartInterval(lastWeek , new Date())
    };
  },
  methods: {},
  mounted() {
    let filter = new NetworksQuery().asNumber(this.asNumber);
    this.$ihr_api.networks(filter, results => {
      if (results.count != 1) {
        this.loadingStatus = LOADING_STATUS.ERROR;
        return;
      }

      console.log(results.results[0])
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
          return this.$t("AsAndIxp.headerString.not_found");
        case LOADING_STATUS.EXPIRED:
          return this.$t("AsAndIxp.headerString.expired");
        case LOADING_STATUS.LOADED:
          return this.$route.params.asn;
        default:
        case LOADING_STATUS.ERROR:
          return this.$t("generic_errors.ups");
      }
    },
    subHeader() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t("AsAndIxp.subHeader.loading");
        case LOADING_STATUS.NOT_FOUND:
          return this.$t("AsAndIxp.subHeader.not_found");
        case LOADING_STATUS.EXPIRED:
          return this.$t("AsAndIxp.subHeader.expired");
        case LOADING_STATUS.LOADED:
          return this.asName
        default:
        case LOADING_STATUS.ERROR:
          return this.$t("generic_errors.bad_happened");
      }
    }
  }
};
</script>

<style lang="stylus" scoped>
@import '../styles/quasar.variables';

.IHR_
  &time-filter
    background-color $secondary
    padding 8px 0px

    & > *:first-child
      width 100%
  
  &last-element
    margin-bottom 40px
</style>
