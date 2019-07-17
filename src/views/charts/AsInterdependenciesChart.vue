<template>
  <div class="IHR_interndependencies-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      chart-title="AS interdependecies"
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
import {
  HegemonyQuery,
  HegemonyConeQuery,
  AS_FAMILY
  } from "@/plugins/IhrApi";

const DEFAULT_TRACE = [{ // First trace is used for the hegemony cone
    x: [],
    y: [],
    yaxis: 'y2',
    name: 'Number of dependents',
    showlegend: false
  }];

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
    asFamily: {
      type: Number,
      default: AS_FAMILY.v4
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
    let hegemonyFilter = new HegemonyQuery()
      .originAs(this.asNumber)
      .asFamily(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    let hegemonyConeFilter = new HegemonyConeQuery()
      .asNumber(this.asNumber)
      .asFamily(this.asFamily)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if(!this.fetch)
          return;
        this.traces = [...DEFAULT_TRACE];
        this.loading = true;
        this.loadingHegemony = true;
        this.loadingHegemonyCone = true;
        this.queryHegemonyAPI();
        this.queryHegemonyConeAPI();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingHegemony: true,
      loadingHegemonyCone: true,
      hegemonyFilter: hegemonyFilter,
      hegemonyConeFilter: hegemonyConeFilter,
      traces: [],
      layout: {
          hovermode:'closest',
          yaxis: {
              title: "AS"+this.asNumber+" dependencies",
              domain: [0.55, 1],
              range: [0, 1.1],
              automargin: true,
          },
          yaxis2:{
              title: 'Number of ASes<br>dependent on AS'+this.asNumber,
              domain: [0, 0.45],
              autorange: true,
              automargin: true,
          },
          margin: {
              t: 50,
              b: 50,
          },
          showlegend: true,
          legend: {
              x: 0,
              y: 1.2,
              orientation: "h"
          },
      }
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    queryHegemonyAPI() {
      this.loadingHegemony = true;
      this.$ihr_api.hegemony(
        this.hegemonyFilter,
        result => {
          this.fetchHegemony(result.results);
          this.loadingHegemony = false;
          this.loading = this.loadingHegemony || this.loadingHegemonyCone;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryHegemonyConeAPI() {
      this.loadingHegemonyCone = true;
      this.$ihr_api.hegemony_cone(
        this.hegemonyConeFilter,
        result => {
          this.fetchHegemonyCone(result.results);
          this.loadingHegemonyCone = false;
          this.loading = this.loadingHegemony || this.loadingHegemonyCone;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchHegemony(data) {
      console.log("fetchHegemony")
      let traces = {}
      data.forEach(resp => {
        if(resp.asn == this.asNumber)
          return;

        let trace;
        if(!(resp.asn in traces)) {
          trace = {
              x: [],
              y: [],
              name: this.$ihr_api.getAsOrIxp(resp.asn)+" "+resp.asn_name.split(" ")[0],
          };
          traces[resp.asn] = trace;
          this.traces.push(trace)
        } else {
          trace = traces[resp.asn];
        }

        trace.y.push(resp.hege)
        trace.x.push(resp.timebin)
      });
    },
    fetchHegemonyCone(data) {
      console.log("fetchHegemonyCone")
      let trace = this.traces[0];
      data.forEach(resp => {
        trace.y.push(resp.conesize)
        trace.x.push(resp.timebin)
      });
      this.layout.datarevision = new Date().getTime();
    }
  },
  watch: {
    startTime() {
      this.hegemonyFilter.startTime(this.startTime, HegemonyQuery.GTE);
      this.hegemonyConeFilter.startTime(this.startTime, HegemonyConeQuery.GTE);
      this.debouncedApiCall();
    },
    endTime() {
      this.hegemonyFilter.endTime(this.endTime, HegemonyQuery.LTE);
      this.hegemonyConeFilter.endTime(this.endTime, HegemonyConeQuery.LTE);
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
  &interndependencies-chart
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
