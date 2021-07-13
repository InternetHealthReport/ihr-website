<template>
  <div class="IHR_chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @plotly-click="plotClick"
      :ref="myId"
      :no-data="noData"
    />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
  </div>
</template>

<script>
import CommonChartMixin from "./CommonChartMixin";
import { extend } from "quasar";
import { ASGRAPH_LAYOUT } from "./layouts";
import i18n from "@/locales/i18n";
import { HegemonyQuery, HegemonyConeQuery, AS_FAMILY } from "@/plugins/IhrApi";
import ripeApi from "@/plugins/RipeApi";

const DEFAULT_TRACE = [
  {
    type: "sankey",
    orientation: "h",
    valueformat: ".0f",
    valuesuffix: "%",
    node: {
        line: {
            color: 'white'
        },
        pad: 15,
        label: [],
        color: [],
    },

    link: {
        source: [],
        target: [],
        value: [],
        label: [],
        color: [],
    }
  }
];

export default {
  mixins: [CommonChartMixin],
  components: {
  },
  props: {
    asNumber: {
      type: Number,
    },
    addressFamily: {
      type: Number,
      default: AS_FAMILY.v4
    },
    plot: { 
        type: Number,
        default: 1
    },
    clear: {
      type: Number,
      default: 1
    },
    hegemonyValues: { 
      type: Object,
    }
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    return {
      details: {
        date: null,
        tableVisible: false,
        enableBgpPlay: false
      },
      graph: {},
      traces: DEFAULT_TRACE,
      layout: ASGRAPH_LAYOUT,
    };
  },
  beforeMount() {
  },
  mounted() {
  },
  methods: {
    newCounter(){
        let handler = {
            get: function(target, name) {
                return target.hasOwnProperty(name) ? target[name] : 0;
            }
        };
        let emptyObj = {};
        return new Proxy(emptyObj, handler);
    },
    apiCall() {
      if (this.asNumber == 0) return;

      // Initialisation
      this.graph = {};
      var consumedHege = {};
      Object.keys(this.hegemonyValues).forEach( asn => consumedHege[asn] = {});

      // Read bgplay graph 
      ripeApi.bgplayData(this.asNumber).then(res => {
        res.data.initial_state.forEach( route => {
              var prev_asn = 'Internet';
              route.path.forEach( asn => { 
                  if (asn in this.hegemonyValues){ 
                    if( prev_asn != asn ){ 
                        if( !( prev_asn in this.graph ) ){ 
                            this.graph[prev_asn] = this.newCounter();
                        }
                        this.graph[prev_asn][asn] += 1;
                        // Keep track of unmeasured hegemony
                        consumedHege[asn][prev_asn] = this.hegemonyValues[prev_asn]
                    } 
                    prev_asn = asn;
                  }
                  else { 
                    prev_asn = 'Internet';
                  }
              })
        })

        console.log(this.graph)
        // Populate node labels
        this.hegemonyValues['Internet'] = 1.0;
        for( const asn in this.hegemonyValues ){ 
            this.traces[0].node.label.push(asn)
        }
        console.log(this.traces)

        console.log('now making the sankey')

        // push AS graph / AS hegemony to sankey
        var idx = this.traces[0].node.label.indexOf('Internet'); 
        this.traces[0].link.target.push(idx);
        this.traces[0].link.source.push(idx);
        this.traces[0].link.value.push(20);
        this.traces[0].link.color.push('rgba(255,255,255,0)')
        for( const target in this.graph){
            console.log(target)
            let target_idx = this.traces[0].node.label.indexOf(target); 
            let total_count = Object.values(this.graph[target]).reduce((a, b) => a + b, 0)
            for( const source in this.graph[target] ){ 
                let source_idx = this.traces[0].node.label.indexOf(source); 
                this.traces[0].link.target.push(target_idx);
                this.traces[0].link.source.push(source_idx);
                let weight = this.hegemonyValues[target]* (this.graph[target][source]/total_count);
                if( target == 'Internet' ){ 
                    var sum = 0;
                    for ( const [asn, hege] of Object.entries( consumedHege[source]) ) if( asn!= target ) sum += hege;
                    console.log(sum)
                    weight = this.hegemonyValues[source] - sum;
                    console.log(weight)
                }
                this.traces[0].link.value.push(100*weight);

                // set link colors 
                let link_color = 'rgba(214, 39, 40, 0.4)';
                if( target == 'Internet' )  link_color = 'rgba(44, 160, 44, 0.4)'
                else{
                    if( this.hegemonyValues[target] < 0.5 ) link_color = 'rgba(255, 127, 14, 0.4)';
                    if( this.hegemonyValues[target] < 0.1 ) link_color = 'rgba(188, 189, 34, 0.4)';
                }
                this.traces[0].link.color.push(link_color)
            }
        }

        // add a large link to reduce the overall size of nodes
        this.traces[0].link.target.push(idx);
        this.traces[0].link.source.push(idx);
        this.traces[0].link.value.push(20);
        this.traces[0].link.color.push('rgba(255,255,255,0)')
        console.log('finished apiCall')

        // set node colors
        this.traces[0].node.label.forEach( asn => { 
            let node_color = 'rgba(214, 39, 40, 1)';
            if( asn == 'Internet') node_color = 'rgb(255, 255, 255)'
            else if( asn == this.asNumber ) node_color = 'rgba(31, 119, 180, 1)'
            else {
                if( this.hegemonyValues[asn] < 0.5 ) node_color = 'rgba(255, 127, 14, 1)';
                if( this.hegemonyValues[asn] < 0.1 ) node_color = 'rgba(188, 189, 34, 1)';
            }
            this.traces[0].node.color.push(node_color)
        })
        this.layout.datarevision = new Date().getTime();
        });

    },
    replot(){
        this.plot += 1
    },
    plotClick(clickData) {
      var table = "dependency";
      if (clickData.points[0].data.yaxis == "y2") {
        table = "dependent";
      }
      this.showTable(table, clickData.points[0].x);
    },
    clearGraph() {
      //this.traces = [];
      this.layout.datarevision = new Date().getTime();
    }
  },
  computed: {
    bgplay() {
      return `/ihr/widget/bgplay?asn=${this.asNumber}&date=${this.dateStr}`;
    },
    dateStr() {
      let year = this.details.date.getUTCFullYear();
      var day = this.details.date.getUTCDate();
      var month = this.details.date.getUTCMonth() + 1;
      var hours = this.details.date.getUTCHours();
      var minutes = this.details.date.getUTCMinutes();
      var seconds = this.details.date.getUTCSeconds();

      if (day < 10) day = "0" + day;
      if (month < 10) month = "0" + month;
      if (hours < 10) hours = "0" + hours;
      if (minutes < 10) minutes = "0" + minutes;
      if (seconds < 10) seconds = "0" + seconds;

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
    },
  },
  watch: {
    plot() {
      //this.clearGraph();
      this.apiCall();
      this.$nextTick(function() {
        this.loading = false;
      });
    }
  }
};
</script>

<style lang="stylus">
@import "~@/styles/charts/common.styl";
.bgplay-container {
  overflow: hidden;
  padding-top: 1100px;
  position: relative;
}

.bgplay-container iframe {
   border: 0;
   height: 100%;
   left: 0;
   position: absolute;
   top: 0;
   width: 100%;
}
</style>
