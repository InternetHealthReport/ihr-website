<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      ref="chart"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="4em"/>
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import CommonChartMixin, {DEFAULT_DEBOUNCE} from "./CommonChartMixin"
import { DiscoEventQuery } from "@/plugins/IhrApi";

export default {
  mixins: [CommonChartMixin],
  props: {
    streamName: {
      type: Number,
      required: true
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
      filters: [filter],
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
  methods: {
    queryDiscoApi() {
      this.loading = true;
      this.$ihr_api.disco_events(
        this.filters[0],
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
