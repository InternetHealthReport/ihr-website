<script>
import Vue from "vue";
import NetworkDisco, { push0 } from "../DiscoChart";
import { DiscoEventQuery } from "@/plugins/query/IhrQuery";
import DiscoChartVue from "../DiscoChart.vue";

const DEFAULT_DISCO_AVG_LEVEL = 12;
//under this gap 2 consecutive event are considered like 1 that change value

//utility functions

/**
 * Push a non event into the graph at position time
 */


export default {
  extends: NetworkDisco,
  props: {
    minAvgLevel: {
      required: true,
      default: DEFAULT_DISCO_AVG_LEVEL
    }
  },
  data() {
    return {};
  },
  beforeCreate() {
    Vue.delete(this.$options.props, "streamName");
  },
  beforeMount() {
    this.filters[0].streamName().avgLevel(this.minAvgLevel, DiscoEventQuery.GTE);
    this.traces = [];
    this.layout.showlegend = false;
    delete this.layout.legend;
  },
  methods: {
    fetchDiscoData(data) {
      console.log("fetch data");
      this.traces = [];
      let streamTraces = {};
      data.forEach(event => {
        //for (var i = 0; i < data.results.length; i++) {
        let streamname = event.streamname;
        let trace = streamTraces[streamname];

        if (trace == undefined) {
          trace = {
            x: [this.$options.filters.ihrUtcString(this.startTime)],
            y: [0],
            z: [0],
            name: streamname,
            line: { shape: "hv" }
          };
          streamTraces[streamname] = trace;
          this.traces.push(trace);
        } else {
          //if it's not the first generate the gap with no events
          push0(trace, trace.x[trace.x.length - 1], 0);
        }

        //generate square for the event
        push0(trace, event.starttime);
        trace.x.push(event.starttime);
        trace.y.push(event.avglevel);
        trace.z.push(event.id);

        trace.x.push(event.endtime);
        trace.y.push(event.avglevel);
        trace.z.push(event.id);
        push0(trace, event.endtime);
      });
      this.traces.forEach(trace => {
        push0(trace, this.$options.filters.ihrUtcString(this.endTime));
      });
    }
  }
};

export {DEFAULT_DISCO_AVG_LEVEL};
</script>