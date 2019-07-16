<template>
  <div class="IHR_disco-chart">
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
import { DiscoEventQuery, PROJECT_START_DATE } from "@/plugins/IhrApi";
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
    asn: {
      type: Number,
      required: true
    },
    af: {
      type: Number,
      default: 4
    },
    startTime: {
      type: Date,
      require: true
    },
    endTime: {
      type: Date,
      require: true
    }
  },
  data() {
    let filter = new DiscoEventQuery()
      .streamName(this.streamName)
      .timeInterval(this.startTime, this.endTime)
      .orderedByStartTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        //FIXME
        /*
        this.traces = [...DEFAULT_TRACE];
        this.loading = true;
        this.loadingHegemony = true;
        this.loadingHegemonyCone = true;
        this.queryHegemonyAPI();
        this.queryHegemonyConeAPI();
        */
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      debouncedApiCall: debouncedApiCall,
      loading: true,
      loadingHegemony: true,
      loadingHegemonyCone: true,
      filter: filter,
      traces: [],
      layout: {
          hovermode:'closest',
          yaxis: {
              title: "AS"+this.asn+" dependencies",
              domain: [0.55, 1],
              range: [0, 1.1],
              automargin: true,
          },
          yaxis2:{
              title: 'Number of ASes<br>dependent on AS'+this.asn,
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
        this.filter,
        result => {
          this.fetchDiscoData(result.results);
          this.loadingHegemony = false;
          this.loading = !this.hegemony_cone;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    queryHegemonyConeAPI() {
      this.loadingHegemonyCone = true;
      this.$ihr_api.hegemony_cone(
        this.filter,
        result => {
          this.fetchHegemonyCone(result.results);
          this.loadingHegemonyCone = false;
          this.loading = !this.loadingHegemony;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchHegemony(data) {
      let traces = {}
      data.forEach(resp => {
        if(resp.asn == this.asn)
          return;

        if(!(resp.asn in traces)) {
          let trace = {
              x: [],
              y: [],
              name: this.printAsn(resp.asn)+" "+resp.asn_name.split(" ")[0],
          };
          traces[resp.asn] = trace;
          this.traces.push(trace)
        }
        let trace = traces[resp.asn];
        trace.y.push(resp.hege)
        trace.x.push(resp.timebin)
      });
    },
    fetchHegemonyCone(data) {
      data.forEach(resp => {
        this.traces[0].y.push(resp.conesize)
        this.traces[0].x.push(resp.timebin)
      });
      this.layout.datarevision = new Date().getTime();
    }
  },
  watch: {
    startTime() {
      this.filter.startTime(this.startTime, DiscoEventQuery.GTE);
      this.debouncedApiCall();
    },
    endTime() {
      this.filter.endTime(this.endTime, DiscoEventQuery.LTE);
      this.debouncedApiCall();
    }
  }
};
</script>

<style lang="stylus">
.IHR_
  &disco-chart
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
