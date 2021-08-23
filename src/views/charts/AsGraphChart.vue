<template>
  <div class="IHR_chart">
      <q-btn @click='replot'>re-plot</q-btn>
      <div>{{ loadingMsg }}</div>
    <reactive-chart
      :layout="layout"
      :traces="tracesArray"
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

const LOADING = {
  BGPPLAY_LOADING: 'Downloading BGPlay data...',
  BGPPLAY_LOADED: 'Loaded BGPlay data!',
  COMPUTING: 'Computing graph...',
};

export default {
  mixins: [CommonChartMixin],
  components: {
  },
  props: {
    hegemonyValues: {
      type: Object,
      default: null 
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
      traces: {},
      layout: ASGRAPH_LAYOUT,
      minHegeThreshold: 0.01,
      loadingMsg: '',
      bgplayData: null,
      tracesArray: []
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
    newTrace(){
        return {
            type: "sankey",
            orientation: "h",
            valueformat: ".0f",
            valuesuffix: "%",
            node: {
                line: {
                    color: 'white',
                    width: 0,
                },
                pad: 20,
                label: [],
                color: [],
                x: [],
                y: []

            },

            link: {
                source: [],
                target: [],
                value: [],
                label: [],
                color: [],
            }
        } 
    },
    apiCall() {
        this.loadingMsg = LOADING.BGPPLAY_LOADING
        // Read bgplay graph 
        let ressources = Object.keys(this.hegemonyValues).slice(0,5).join(',') 
        ripeApi.bgplayData(ressources).then(res => {
            this.bgplayData = res
            this.loadingMsg = LOADING.BGPPLAY_LOADED
            this.makeSankey()
            this.$nextTick(function() {
                this.loading = false;
            });
        })
    },
    makeSankey() {
        this.loadingMsg = LOADING.COMPUTING
        // Initialisation
        this.traces = [this.newTrace()]
        Object.keys(this.hegemonyValues).slice(0,5).forEach( identifier  => {
            console.log(identifier)
            this.graph = {};
            var consumedHege = {};
            var hegemonyValues = this.hegemonyValues[identifier].hege
            if( !(identifier in hegemonyValues) ){
                hegemonyValues[identifier] = this.hegemonyValues[identifier].maxHege;
            }
            console.log(hegemonyValues)

            Object.keys(hegemonyValues).forEach( asn => consumedHege[asn] = {} );

            this.bgplayData.data.initial_state.forEach( route => {
              if( route.target_prefix == identifier || !identifier.includes('/') ){
                var prev_asn = 'Internet';

                    // if we are looking at a prefix, replace the origin AS by the monitored prefix
                if( route.path[route.path.length - 1].toString() != identifier.toString() 
                    && route.target_prefix == identifier){ 
                        route.path[route.path.length - 1] = identifier;
                    }

                route.path.forEach( asn => { 
                    if (asn in hegemonyValues && hegemonyValues[asn] > this.minHegeThreshold){ 
                        if( prev_asn != asn ){ 
                            if( !( prev_asn in this.graph ) ){ 
                                this.graph[prev_asn] = this.newCounter();
                            }
                            this.graph[prev_asn][asn] += 1;
                            // Keep track of unmeasured hegemony
                            consumedHege[asn][prev_asn] = hegemonyValues[prev_asn]
                        } 
                        prev_asn = asn;
                    }
                    else { 
                        prev_asn = 'Internet';
                    }
                })
              }
            })

            // Populate node labels
            hegemonyValues['Internet'] = 1.0;
            for( const asn in hegemonyValues ){ 
                this.traces[0].node.label.push(asn)
            }

            // order nodes per AS hegemony score and ends with monitored asn
            let sorted_nodes = Object.keys(consumedHege).filter(item => item.toString() !== identifier.toString())
            sorted_nodes = sorted_nodes.sort(this.sortNodes)
            sorted_nodes.push(identifier.toString())

            // push AS graph / AS hegemony to sankey
            sorted_nodes.forEach( source => {
                console.log(source)
                let source_idx = this.traces[0].node.label.indexOf(source); 
                console.log(consumedHege[source])
                for( const target in consumedHege[source] ){ 
                    console.log(target)
                    let total_count = Object.values(this.graph[target]).reduce((a, b) => a + b, 0)
                    let target_idx = this.traces[0].node.label.indexOf(target); 
                    let weight = hegemonyValues[target]* (this.graph[target][source]/total_count);
                    if( target == 'Internet' ){ 
                        // don't plot dep to Internet links
                        //if( source != this.identifiers ) continue
                        console.log('total')
                        console.log(total_count)
                        console.log('sum')

                        console.log('sum')
                        var sum = 0;
                        for ( const [asn, hege] of Object.entries( consumedHege[source]) ) if( asn!= target && hege*(this.graph[target][asn]/total_count)>=0.01) sum += hege;
                        weight = hegemonyValues[source] - sum;
                        console.log(weight)
                    }
                    else{
                        // Ignore small links
                        if( weight<0.01 ) {
                            continue;
                        }
                    }

                    // Add link no dep node
                    if( target == 'Internet' & source == identifier ){ 
                        let dep_idx = this.traces[0].node.label.length;
                        this.traces[0].node.label.push('No dependency')
                        this.traces[0].link.target.push(dep_idx);
                        this.traces[0].link.source.push(source_idx);
                        this.traces[0].link.value.push(100*weight);
                        this.traces[0].link.color.push( 'rgba(44, 160, 44, 0.1)' )
                        this.traces[0].link.target.push(target_idx);
                        this.traces[0].link.source.push(dep_idx);
                        this.traces[0].link.value.push(100*weight);
                        this.traces[0].link.color.push( 'rgba(44, 160, 44, 0.1)' )

                    }
                    else{
                        this.traces[0].link.target.push(target_idx);
                        this.traces[0].link.source.push(source_idx);
                        this.traces[0].link.value.push(100*weight);
                        // set link colors 
                        let link_color = 'rgba(214, 39, 40, 0.6)';
                        if( target == 'Internet'  )  link_color = 'rgba(44, 160, 44, 0.1)'
                        else{
                            if( this.hegemonyValues[target] < 0.5 ) link_color = 'rgba(255, 127, 14, 0.6)';
                            if( this.hegemonyValues[target] < 0.1 ) link_color = 'rgba(188, 189, 34, 0.6)';
                        }
                        this.traces[0].link.color.push(link_color)
                    }

                }
            })

            // set node colors
            this.traces[0].node.label.forEach( asn => { 
                let node_color = 'rgba(214, 39, 40, 1)';
                if( asn == 'No dependency' | asn == 'Internet') node_color =  'rgba(44, 160, 44, 0.1)'
                else if( asn == identifier ) node_color = 'rgba(31, 119, 180, 1)'
                else {
                    if( this.hegemonyValues[asn] < 0.5 ) node_color = 'rgba(255, 127, 14, 1)';
                    if( this.hegemonyValues[asn] < 0.1 ) node_color = 'rgba(188, 189, 34, 1)';
                }
                this.traces[0].node.color.push(node_color)
            })

            // add a node for dependent networks if there is any
            if( this.hegemonyValues[identifier].dependentAses > 0 ){
                let dep_idx = this.traces[0].node.label.length
                let asn_idx = this.traces[0].node.label.indexOf(identifier.toString()); 
                this.traces[0].node.label.push(`${this.dependentAses} dependent ASes`)
                this.traces[0].node.color.push('rgba(75,75,75,0.10)')
                this.traces[0].link.target.push(asn_idx);
                this.traces[0].link.source.push(dep_idx);
                this.traces[0].link.value.push(10);
                this.traces[0].link.color.push('rgba(255,255,255,0)')
                this.traces[0].link.target.push(asn_idx);
                this.traces[0].link.source.push(dep_idx);
                this.traces[0].link.value.push(80);
                this.traces[0].link.color.push('rgba(155,155,155,0.10)')
                this.traces[0].link.target.push(asn_idx);
                this.traces[0].link.source.push(dep_idx);
                this.traces[0].link.value.push(10);
                this.traces[0].link.color.push('rgba(255,255,255,0)')
            }       
        })

        this.loadingMsg = ''
        this.tracesArray = this.traces
        console.log(this.tracesArray)
        this.layout.datarevision = new Date().getTime();
    },
    sortNodes(a, b){ 
        if( a in this.hegemonyValues ){
            if(b in this.hegemonyValues ){
                return this.hegemonyValues[b]-this.hegemonyValues[a];
            }
            else{
                return -1
            }
        }
        else if( b in this.hegemonyValues ){
                return -1
        }
        else return 0
    },
    replot(){
        if( this.bgplayData != null){
            this.clearGraph()
            this.makeSankey()
        }
    },
    plotClick(clickData) {
      var table = "dependency";
      if (clickData.points[0].data.yaxis == "y2") {
        table = "dependent";
      }
      this.showTable(table, clickData.points[0].x);
    },
    clearGraph() {
      this.traces= {}
      this.layout.datarevision = new Date().getTime();
    },

  },
  computed: {
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
    console.log('watch plot')
        console.log(this.hegemonyValues)
      if (this.hegemonyValues == null || Object.keys(this.hegemonyValues).length == 0) return;
      this.apiCall();
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
