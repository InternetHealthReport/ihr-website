<template>
  <div class="IHR_internal-delay-forwarding">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em" />
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import ReactiveChart from "@/components/ReactiveChart";
import DateTimePicker from "@/components/DateTimePicker";
import { ForwardingQuery, DelayQuery } from "@/plugins/IhrApi";

const DEFAULT_TRACES = [
  {
    x: [],
    y: [],
    yaxis: "y",
    name: "Delay",
    showlegend: false
  },
  {
    x: [],
    y: [],
    yaxis: "y2",
    name: "Forwarding",
    showlegend: false
  }
];

const DEFAULT_DEBOUNCE = 800;

export default {
  components: {
    ReactiveChart,
    DateTimePicker
  },
  props: {
    asNumber: {
      type: Number,
      required: true
    },
    startTime: {
      type: Date,
      require: true
    },
    endTime: {
      type: Date,
      require: true
    },
    fetch: {
      type: Boolean
    }
  },
  data() {
    let delayFilter = new DelayQuery()
      .asNumber(this.asNumber)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    let forwardingFilter = new ForwardingQuery()
      .asNumber(this.asNumber)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.traces = [...DEFAULT_TRACES];
        this.loading = true;
        this.loadingDelay = true;
        this.loadingForwarding = true;
        this.queryForwardingAPI();
        this.queryDelayAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingDelay: true,
      loadingForwarding: true,
      delayFilter: delayFilter,
      forwardingFilter: forwardingFilter,
      traces: [],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: "Delay Change Level",
          domain: [0.55, 1],
          autorange: true,
          automargin: true
        },
        yaxis2: {
          title: "Forwarding Change Level",
          domain: [0, 0.45],
          autorange: true,
          automargin: true
        },
        margin: {
          t: 50,
          b: 50
        }
      }
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    queryForwardingAPI() {
      this.loadingForwarding = true;
      this.$ihr_api.forwarding(
        this.forwardingFilter,
        result => {
          this.fetchForwarding(result.results);
          this.loadingForwarding = false;
          this.loading = this.loadingDelay || this.loadingForwarding;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryDelayAPI() {
      this.loadingDelay = true;
      this.$ihr_api.delay(
        this.delayFilter,
        result => {
          this.fetchDelay(result.results);
          this.loadingDelay = false;
          this.loading = this.loadingDelay || this.loadingForwarding;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchData(trace, data){
      data.forEach(resp => {
        trace.y.push(resp.magnitude);
        trace.x.push(resp.timebin);
      });
      this.layout.datarevision = new Date().getTime();
    },
    fetchDelay(data) {
      console.log("fetchDelay");
      this.fetchData(this.traces[0], data);
    },
    fetchForwarding(data) {
      console.log("fetchForwarding");
      this.fetchData(this.traces[1], data);
    }
  },
  watch: {
    startTime() {
      this.delayFilter.startTime(this.startTime, DelayQuery.GTE);
      this.forwardingFilter.startTime(this.startTime, ForwardingQuery.GTE);
      this.debouncedApiCall();
    },
    endTime() {
      this.delayFilter.endTime(this.endTime, DelayQuery.LTE);
      this.forwardingFilter.endTime(this.endTime, ForwardingQuery.LTE);
      this.debouncedApiCall();
    },
    fetch() {
      this.debouncedApiCall();
    }
  }
};
</script>

<style lang="stylus">
.IHR_
  &internal-delay-forwarding
    text-align center
    position relative

    & h1
      font-size 25pt
      margin-bottom 0px
      font-weight 400
      line-height 1

  &loading-spinner
    position absolute
    top 50%
    left 49%
</style>
