<template>
  <div id="IHR_as-and-ixp-container">
    <h1 class="text-center">{{headerString}}</h1>
    <h2 class="text-center">{{subHeader}}</h2>
    <q-list v-if="showGraphs">
      <q-expansion-item
        expand-separator
        :label="$t('charts.asInterdependencies.title') + ' ' + asFamilyText"
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
          :stream-name="asNumber"
          :fetch="fetch"
          ref="discoChart"
        />
      </q-expansion-item>
      <q-drawer :value="showSidebar" side="left" bordered @on-layout="resizeCharts">
        <div class="row IHR_sidebar-filter-section">
          <interval-picker v-model="interval" class="col-9"/>
          <div class="col-3 IHR_family-filter">
            <div>
              <q-toggle v-model="asFamily" name="asFamily"/>
            </div>
            <div class="text-center">
              <label for="asFamily">{{asFamilyText}}</label>
            </div>
          </div>
        </div>
        <div class="IHR_sidebar-content-section">
          <q-scroll-area
            class="fit"
            :thumb-style="{right: '1px', width: '6pt'}"
          >
            <closable-container
              @close-me="removePrefix(prefix)"
              v-for="prefix in prefixesDetail"
              :key="prefix"
              class="IHR_prefix-sidebar shadow-2"
            >
              <reverse-dns-ip :ip="prefix" class="IHR_reverse-dns-ip-improved" />
              <prefix-overview :ip="prefix" class="IHR_prefix-overview-improved" />
            </closable-container>
          </q-scroll-area>
        </div>
      </q-drawer>
      <div class="IHR_last-element">&nbsp;</div>
    </q-list>
  </div>
</template>

<script>
import IntervalPicker, { ChartInterval } from "@/components/IntervalPicker";
import ClosableContainer from "@/components/ClosableContainer";
import AsInterdependenciesChart from "@/views/charts/AsInterdependenciesChart";
import DiscoChart from "@/views/charts/DiscoChart";
import DelayAndForwardingChart from "@/views/charts/DelayAndForwardingChart";
import { AS_FAMILY, NetworkQuery } from "@/plugins/IhrApi";
import ReverseDnsIp from "@/components/ripe/ReverseDnsIp";
import PrefixOverview from "@/components/ripe/PrefixOverview";
import { setTimeout } from "timers";

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1
};

const CHART_REFS = [
  "asInterdependenciesChart",
  "delayAndForwardingChart",
  "delayAndForwardingChart"
];

export default {
  components: {
    AsInterdependenciesChart,
    DiscoChart,
    DelayAndForwardingChart,
    IntervalPicker,
    PrefixOverview,
    ClosableContainer,
    ReverseDnsIp
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: true
    }
  },
  data() {
    //correct
    let routePieces = this.$route.params.asn.match(/[0-9]+$/);
    let asNumber = Number(routePieces[0]);
    if (this.$route.params.asn.startsWith("IXP")) {
      asNumber = -asNumber;
    }

    let asFamily = this.$route.query.af;
    let interval;
    try {
      interval = ChartInterval.getFromDuration(this.$route.query.date + "T00:00+00:00", this.$route.query.last);
    } catch(e) {
      if(!(e instanceof RangeError)) {
        throw e;
      }
      interval = ChartInterval.lastWeek(); //fallback to lastweek
    }
    return {
      asFamily: asFamily == 4 || asFamily == undefined,
      fetch: false,
      loadingStatus: LOADING_STATUS.LOADING,
      asNumber: asNumber,
      asName: null,
      interval: interval,
      prefixesDetail: []
    };
  },
  methods: {
    resizeCharts() {
      setTimeout(() => {
        CHART_REFS.forEach(chart => {
          this.$refs[chart].relayout();
        });
      }, 400);
    },
    showDetails(address) {
      this.$emit("sidebar-action", true);
      if(this.prefixesDetail.find((elem) => address == elem) == undefined)
        this.prefixesDetail.push(address);
    },
    removePrefix(address) {
      this.prefixesDetail = this.prefixesDetail.filter(elem => address != elem);
    },
    pushRoute() {
      this.$router.push({
      query: {
        af: this.family,
        last: this.interval.dayDiff(),
        date: this.$options.filters.ihrUtcString(this.interval.end, false)
        }
      });
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
    this.pushRoute();
  },
  computed: {
    family() {
      return this.asFamily? AS_FAMILY.v4 : AS_FAMILY.v6;
    },
    asFamilyText(){
      return this.asFamily? "IPv4" : "IPv6";
    },
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
  },
  watch: {
    asFamily() {
      this.pushRoute();
    },
    interval() {
      this.pushRoute();
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
      height 4.5vh

  &last-element
    margin-bottom 40px

  &charts-title
    text-align center
    text-transform capitalize
    font-size 22pt

  &prefix-sidebar
    margin 4pt 6pt

  &sidebar-filter-section
    height 16%
    & > ~/family-filter
      padding 2pt
      & label
        font-weight bold

  &sidebar-content-section
    height 84%

</style>
