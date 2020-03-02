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
import getCountryName from "@/plugins/countryName.js";

const MAX_ID_FOR_REQUEST = 50;

export default {
  components: { ReactiveChart },
  props: {
    events: {
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
      probes: [],
      noData: this.$t("noOutage")
    };
  },
  methods: {
    relayout() {
      this.$refs[this.myId].relayout();
    },
    updateProbes(){ 
      this.probes = []
      this.events.forEach( event => { 
        var label = '';
        if(event.streamtype == 'asn'){ 
            label = "AS"+event.streamname

        }else if(event.streamtype == 'country'){ 
            label = getCountryName(event.streamname)
        }
        else{ 
            label = event.streamname
        }
        event.discoprobes.forEach( newProbe => { 
            this.probes.push({
            label: label,
            level: newProbe.level,
            lon: newProbe.lon,
            lat: newProbe.lat,
            id: newProbe.probe_id,
            startTime: new Date(newProbe.starttime),
            endTime: new Date(newProbe.endtime)
            });
        });
      })
    },
    dateFormatter(datetime){ 
        var dt = new Date(datetime)
        var options = { year: 'numeric', month: 'long', day: '2-digit', hour: '2-digit', minute: '2-digit',  timeZone: 'UTC' };
        return dt.toLocaleDateString(undefined, options)
    },
  },
  mounted() { 
      this.updateProbes()
  },
  watch: {
    events(newValue) {
        this.updateProbes()
    },
  },
  computed: {
    traces() {
      let latitudes = [];
      let longitudes = [];
      let sizes = [];
      let colors = [];
      let text = [];
      this.probes.forEach(prob => {
        latitudes.push(prob.lat);
        longitudes.push(prob.lon);
        let color = prob.level-6;
        let durationHour = 1+Math.ceil(Math.abs(prob.endTime - prob.startTime) / (1000*60*60));
          let probeText = `<b>${prob.label}</b><br> PB${prob.id}<br> ${this.dateFormatter(prob.startTime)}<br> Duration: ${durationHour}H<br> Deviation: ${prob.level}`;
        text.push(probeText);
        sizes.push(Math.log(durationHour)*10);
        const red = Math.min(255, 255*(color/5));
        const green = 255-Math.min(255, 255*(color/5));
        const blue = 255-Math.min(255, 255*(color/5));
        colors.push(`rgba(${red},${green},${blue},0.1)`);
      });
      this.noData = (latitudes.length === 0) ? this.$t("noOutage"): false;
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
            color: colors,
            line: {
              color: "black",
              width: 1
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
