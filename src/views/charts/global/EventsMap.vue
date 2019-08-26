<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      :ref="myId"
      :no-data="noData"
    />
  </div>
</template>

<script>
import ReactiveChart from "@/components/ReactiveChart";
import { DiscoProbesQuery } from "@/plugins/query/IhrQuery";
import { COMMON_FEATURE } from "../layouts";

const MAX_ID_FOR_REQUEST = 10;

export default {
  components: { ReactiveChart },
  props: {
    geoProbes: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      myId: `ihrMapchar${this._uid}`,
      layout: {
        ...COMMON_FEATURE,
        geo: {
          showframe: false,
          showcoastlines: false,
          showland: true,
          landcolor: "rgb(215, 215, 215)",
          countrycolor: "rgb(235, 235, 235)",
          showcountries: true
        },
        margin: {
          t: 10,
          b: 10
        }
      },
      pendingCalls: 0,
      events: [],
      probes: []
    };
  },
  methods: {
    relayout() {
      this.$refs[this.myId].relayout();
    },
    muliQueryProbesAPI() {
      if (this.events.length == 0) return false;
      let events = this.events;
      this.events = [];
      //if too many events do separate query
      let filter = new DiscoProbesQuery();
      let cap = events.length - MAX_ID_FOR_REQUEST;
      this.probes = [];
      for (var i = 0; i < cap; i += MAX_ID_FOR_REQUEST) {
        filter.event(events.slice(i, i + MAX_ID_FOR_REQUEST));
        this.singleQueryProbesAPI(filter);
      }
      filter.event(events.slice(i, events.length));
      this.singleQueryProbesAPI(filter);
      return true;
    },
    singleQueryProbesAPI(filter) {
      this.pendingCalls++;
      this.$ihr_api.disco_probes(
        filter,
        results => {
          this.pendingCalls--;
          results.results.forEach(newProbe => {
            let probe = this.probes.find(p => {
              return newProbe.probe_id === p.probe_id;
            });
            if (probe === undefined) {
              this.probes.push({
                level: [newProbe.level],
                lon: newProbe.lon,
                lat: newProbe.lat,
                id: newProbe.probe_id,
                startTime: [newProbe.starttime],
                endTime: [newProbe.endtime]
              });
            } else {
              probe.level.push(newProbe.level);
              probe.startTime.push(newProbe.starttime);
              probe.endTime.push(newProbe.endtime);
            }
          });
        },
        error => {
          console.error(error);
        }
      );
    }
  },
  watch: {
    geoProbes(newValue) {
      this.events = newValue.map(event => {
        return event.id;
      });
      if (this.pendingCalls == 0) {
        this.muliQueryProbesAPI();
      }
    },
    pendingCalls(newValue, oldValue) {
      if (newValue === 0 && oldValue != 0) {
        this.muliQueryProbesAPI();
      }
    }
  },
  computed: {
    traces() {
      let latitudes = [];
      let longitudes = [];
      let sizes = [];
      let text = [];
      this.probes.forEach(prob => {
        latitudes.push(prob.lat);
        longitudes.push(prob.lon);
        let size = 0;
        let probeText = `probe id: ${prob.id}`;
        for (let i = 0; i < prob.startTime.length; ++i) {
          size += prob.level[i];
          probeText += ` [${prob.startTime[i]}, ${prob.endTime[i]}] level ${prob.level[i]}`;
        }
        text.push(probeText);
        sizes.push(size / prob.startTime.length);
      });
      this.noData = (latitudes.length === 0) ? this.$t("noDataAvailable"): false;
      return [
        {
          type: "scattergeo",
          mode: "markers",
          lat: latitudes,
          lon: longitudes,
          hoverinfo: "text",
          text: text,
          marker: {
            size: sizes,
            line: {
              color: "black",
              width: 2
            }
          },
          name: "world events"
        }
      ];
    }
  }
};
</script>

<style>
</style>