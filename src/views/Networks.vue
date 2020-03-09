<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div>
        <h1 class="text-center">{{subHeader}} - {{headerString}}</h1>
        <h3 class="text-center">3-day report ending on {{reportDateFmt}}
            <date-time-picker
                :min="minDate"
                :max="maxDate"
                :value="maxDate"
                @input="setReportDate"
                hideTime
                class="IHR_subtitle_calendar"
            />
        </h3>
    </div>
    <q-list v-if="showGraphs">
      <q-expansion-item
        :label="$t('charts.asInterdependencies.title')"
        caption="BGP data"
        header-class="IHR_charts-title"
        icon="fas fa-project-diagram"
        :disable="!show.hegemony"
        v-model="show.hegemony"
      >
        <q-separator />
        <q-card class="IHR_charts-body">
          <q-card-section>
            <as-interdependencies-chart
            :start-time="startTime"
            :end-time="endTime"
            :as-number="asNumber"
            :as-family="family"
            :fetch="fetch"
            ref="asInterdependenciesChart"
            />
          </q-card-section>
       </q-card>
      </q-expansion-item>

      <q-expansion-item
        :label="$t('charts.networkDelay.title')"
        caption="Traceroute data"
        header-class="IHR_charts-title"
        icon="fas fa-shipping-fast"
        v-model="show.net_delay"
        :disable="show.net_delay_disable"
      >
        <q-separator />
        <q-card class="IHR_charts-body">
          <q-card-section>
            <network-delay-chart 
                :start-time="startTime" 
                :end-time="endTime" 
                :startPointName="Math.abs(asNumber).toString()"
                :startPointType="this.$route.params.asn.substring(0,2)"
                :fetch="fetch"
                searchBar
                ref="networkDelayChart"
                @display="displayNetDelay"
            />
          </q-card-section>
       </q-card>
      </q-expansion-item>

      <q-expansion-item
        :label="$t('charts.delayAndForwarding.title')"
        caption="Traceroute data"
        header-class="IHR_charts-title"
        icon="fas fa-exchange-alt"
        :disable="!show.delayAndForwarding"
        v-model="show.delayAndForwarding"
      >
        <q-separator />
        <q-card class="IHR_charts-body">
          <q-card-section>
            <delay-and-forwarding-chart
            :start-time="startTime"
            :end-time="endTime"
            :as-number="asNumber"
            :fetch="fetch"
            ref="delayAndForwardingChart"
            />
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <q-expansion-item
        :label="$t('charts.disconnections.title')"
        caption="RIPE Atlas log"
        header-class="IHR_charts-title"
        icon="fas fa-plug"
        :disable="!show.disco"
        v-model="show.disco"
      >
        <q-separator />
        <q-card class="IHR_charts-body">
          <q-card-section>
            <disco-chart
                :streamName="asNumber"
                :start-time="startTime"
                :end-time="endTime"
                :fetch="fetch"
                :minAvgLevel=9
                ref="ihrChartDisco"
            />
          </q-card-section>
        </q-card>
      </q-expansion-item>
      <div class="IHR_last-element">&nbsp;</div>
    </q-list>
  </div>
</template>

<script>
import reportMixin from "@/views/mixin/reportMixin";
import ClosableContainer from "@/components/ClosableContainer";
import AsInterdependenciesChart from "@/views/charts/AsInterdependenciesChart";
import DiscoChart, {
  DEFAULT_DISCO_AVG_LEVEL
} from "@/views/charts/global/DiscoChart";
import DelayAndForwardingChart from "@/views/charts/DelayAndForwardingChart";
import NetworkDelayChart from "@/views/charts/NetworkDelayChart";
import { AS_FAMILY, NetworkQuery } from "@/plugins/IhrApi";
import ReverseDnsIp from "@/components/ripe/ReverseDnsIp";
import PrefixOverview from "@/components/ripe/PrefixOverview";
import { setTimeout } from "timers";
import DateTimePicker from "@/components/DateTimePicker";

const LOADING_STATUS = {
  ERROR: -3,
  EXPIRED: -2,
  NOT_FOUND: -1,
  LOADING: 0,
  LOADED: 1
};

const CHART_REFS = [
  "asInterdependenciesChart",
  "networkDelayChart",
  "delayAndForwardingChart",
  "ihrChartDisco"
];

export default {
  mixins: [reportMixin],
  components: {
    AsInterdependenciesChart,
    DiscoChart,
    DelayAndForwardingChart,
    NetworkDelayChart,
    PrefixOverview,
    ClosableContainer,
    ReverseDnsIp,
    DateTimePicker
  },
  data() {
    let asNumber = this.$options.filters.ihr_AsOrIxpToNumber(this.$route.params.asn);
    let addressFamily = this.$route.query.af;
    return {
      addressFamily: addressFamily == 4 || addressFamily == undefined,
      loadingStatus: LOADING_STATUS.LOADING,
      asNumber: asNumber,
      asName: null,
      charRefs: CHART_REFS,
      prefixesDetail: [],
      minAvgLevel: DEFAULT_DISCO_AVG_LEVEL,
      show: { 
        delayAndForwarding: false,
        disco: false,
        hegemony: false,
        net_delay: true,
        net_delay_disable: false,
      }
    };
  },
  methods: {
    pushRoute() {
      this.$router.push({
      query: {
        af: this.family,
        last: this.interval.dayDiff(),
        date: this.$options.filters.ihrUtcString(this.interval.end, false)
        }
      });
    },
    netName() {
        let filter = new NetworkQuery().asNumber(this.asNumber);
        this.$ihr_api.network(filter, results => {
        if (results.count != 1) {
            this.loadingStatus = LOADING_STATUS.ERROR;
            return;
        }

        this.$nextTick(function () {
            this.show.delayAndForwarding = results.results[0].delay_forwarding;
            this.show.disco = results.results[0].disco;
            this.show.hegemony = results.results[0].hegemony;
        })

        this.asName = results.results[0].name;
        this.loadingStatus = LOADING_STATUS.LOADED;
        this.fetch = true;
    });

    },
    displayNetDelay(displayValue){ 
        this.show.net_delay = displayValue;
        this.$nextTick(function () {
            this.show.net_delay_disable = !displayValue;
        })
    }
  },
  mounted() {
    this.netName()
  },
  computed: {
    family() {
      return this.addressFamily? AS_FAMILY.v4 : AS_FAMILY.v6;
    },
    addressFamilyText(){
      return this.addressFamily? "IPv4" : "IPv6";
    },
    showGraphs() {
      return this.loadingStatus == LOADING_STATUS.LOADED;
    },
    headerString() {
      switch (this.loadingStatus) {
        case LOADING_STATUS.LOADING:
          return this.$t("Networks.headerString.loading");
        case LOADING_STATUS.NOT_FOUND:
          return this.$t("Networks.headerString.notFound");
        case LOADING_STATUS.EXPIRED:
          return this.$t("Networks.headerString.expired");
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
          return this.$t("Networks.subHeader.loading");
        case LOADING_STATUS.NOT_FOUND:
          return this.$t("Networks.subHeader.notFound");
        case LOADING_STATUS.EXPIRED:
          return this.$t("Networks.subHeader.expired");
        case LOADING_STATUS.LOADED:
          return this.$route.params.asn;
        default:
        case LOADING_STATUS.ERROR:
          return this.$t("genericErrors.badHappened");
      }
    }
  },
  watch: {
    addressFamily() {
      this.pushRoute();
    },
    '$route.params.asn': {
        handler: function(asn){
            this.loadingStatus = LOADING_STATUS.LOADING,
            this.asNumber = this.$options.filters.ihr_AsOrIxpToNumber(asn);
            this.netName()
        },
        deep: true,
    }
  }
};
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_
  &prefix-sidebar
    margin 4pt 6pt

  &sidebar-filter-section
    & > ~/family-filter
      padding 2pt
      & label
        font-weight bold
</style>


      <!--<q-drawer :value="showSidebar" side="left" bordered @on-layout="resizeCharts">-->
        <!--<div class="fit column">-->
          <!--<div class="row IHR_sidebar-filter-section col-auto">-->
            <!--<div class="col-3 IHR_family-filter">-->
              <!--<div>-->
                <!--<q-toggle v-model="addressFamily" name="addressFamily"/>-->
              <!--</div>-->
              <!--<div class="text-center">-->
                <!--<label for="addressFamily">{{addressFamilyText}}</label>-->
              <!--</div>-->
            <!--</div>-->
          <!--</div>-->
        <!--</div>-->
      <!--</q-drawer>-->
