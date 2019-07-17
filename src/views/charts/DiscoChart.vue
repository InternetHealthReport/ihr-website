<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      chart-title="Disconnection Events"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em"/>
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import ReactiveChart from "@/components/ReactiveChart";
import DateTimePicker from "@/components/DateTimePicker";
import { DiscoEventQuery } from "@/plugins/IhrApi";

const DEFAULT_DEBOUNCE = 800;

export default {
  components: {
    ReactiveChart,
    DateTimePicker
  },
  props: {
    streamName: {
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
    let filter = new DiscoEventQuery()
      .streamName(this.streamName)
      .timeInterval(this.startTime, this.endTime)
      .orderedByTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if(!this.fetch)
          return;
        this.queryDiscoApi();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      debouncedApiCall: debouncedApiCall,
      loading: true,
      filter: filter,
      traces: [
        {
          x: [],
          y: [],
          z: [],
          yaxis: "y",
          name: "Disconnection Level",
          showlegend: false,
          line: { shape: "hv" }
        }
      ],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: "Disconnection Level",
          autorange: true,
          automargin: true
        },
        margin: {
          t: 50,
          b: 50
        },
        height: 350,
        showlegend: true,
        legend: {
          x: 0,
          y: 1.2,
          orientation: "h"
        }
      }
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    queryDiscoApi() {
      this.loading = true;
      this.$ihr_api.disco_events(
        this.filter,
        result => {
          this.fetchDiscoData(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    fetchDiscoData(data) {
      let trace = this.traces[0];
      trace.x = [];
      trace.y = [];
      trace.z = [];

      trace.x.push(this.startTime.toUTCString());
      trace.y.push(0);
      trace.z.push(0);

      data.forEach(elem => {
        trace.x.push(elem.starttime);
        trace.y.push(elem.avglevel);
        trace.z.push(elem.id);

        trace.x.push(elem.endtime);
        trace.y.push(0);
        trace.z.push(elem.id);
      });

      trace.x.push(this.endTime.toUTCString());
      trace.y.push(0);
      trace.z.push(0);
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
    },
    fetch() {
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
