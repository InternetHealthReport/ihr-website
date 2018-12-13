<template>
    <div>
        <div v-if="showInput">
            <form v-on:submit.prevent="reset">
                <input v-model="originasn" placeholder="Origin ASN"> 
                <input v-model="starttime" placeholder="Start time"> 
                <input v-model="endtime" placeholder="End time"> 
                <button>Refresh</button>
            </form>
        </div>
        <reactive-chart :chart="chart" :clickFct="hegemonyPlotClick"></reactive-chart>
        <div v-if="showDetail">
            <div class="ui row">
                <h3 class="vue-title">
                <div v-html="tableTitle"></div>
                </h3>
            </div>
            <div class="row">
                <div class="col-lg-1 col-m-0"></div>
                <div class="col-lg-10 col-m-12"> 

                    <v-client-table :columns="tableColumns" :data="tableData" :options="tableOptions">
                        <a slot="originasn" slot-scope="props" target="_parent" :href="props.row.originasn">{{props.row.originasn}}</a>
                        <a slot="asn" slot-scope="props" target="_parent" :href="props.row.asn">{{props.row.asn}}</a>
                    </v-client-table>

                </div>
                <div class="col-lg-1 col-m-0"></div>
            </div>
            
            <div class="row">
                <div class="col-lg-12 col-m-12"><div id="detailWidgetTitle"></div> </div>
            </div>
            <div class="row">
                <div class="col-lg-12 col-m-12"><div id="detailWidget"></div> </div>
            </div>
        </div>
        <div v-else>
            <i>Click on the graph for more details.</i>
        </div>
    </div>
</template>

<script src="https://stat.ripe.net/widgets/widget_api.js"></script>
<script>
import { downloader } from './mixins/downloader'

export default {
  mixins: [downloader],
  props: {
      asn:{
          type: String,
      },
      af: {
          default: '4'
      },
      startdate: {
          type: String
      },
      enddate: {
          type: String
      }
  },
  data () {
    return {
        showInput: true,
        apiPointHegemony: 'hegemony/',
        apiPointHegemonyCone: 'hegemony_cone/',
        showDetail: false,
        ripe_widgets: false,
        tableTitle: "",
        tableUrl: "",
        detailWidgetTitle: "",
        detailWidget: "",
        tableColumns: [],
        tableData: [],
        tableOptions: {
            headings: {
                originasn: "ASN", 
                asn: "ASN", 
                originasn_name: "Name", 
                asn_name: "Name", 
                hege: "AS Hegemony"
            },
            sortable: ["hege", "originasn", "asn", "originasn_name", "asn_name"],
            filterable: ["originasn", "asn", "originasn_name", "asn_name"],
            orderBy: {column:"hege", ascending:false}
        },
        originasn: this.asn,
        starttime: this.startdate,
        endtime: this.enddate,

        chart: {
            uuid: this._uid,
            traces: [
                { // First trace is used for the hegemony cone
                    x: [],
                    y: [],
                    yaxis: 'y2',
                    name: 'Number of dependents',
                    showlegend: false
                }
            ],
            layout: {
                yaxis: {
                    title: "AS"+this.originasn+" dependencies",
                    domain: [0.55, 1],
                    autorange: true
                },
                yaxis2:{
                    title: 'Number of ASes<br>dependent on AS'+this.originasn,
                    domain: [0, 0.45],
                    autorange: true,
                },
                margin: {
                    t: 50,
                    b: 50,
                },
            } 
        },
        traceIndexes:{},
        traceNextIndex: 1
    }
  },

  mounted() {
    this.fetchHegemony();
    this.fetchHegemonyCone();
  },

  methods: {
    reset: function(){
        this.chart = {
            uuid: this._uid,
            traces: [
                { // First trace is used for the hegemony cone
                    x: [],
                    y: [],
                    yaxis: 'y2',
                    name: 'Number of dependents',
                    showlegend: false
                }
            ],
            layout: {
                yaxis: {
                    title: "AS"+this.originasn+" dependencies",
                    domain: [0.55, 1],
                    autorange: true
                },
                yaxis2:{
                    title: 'Number of ASes<br>dependent on AS'+this.originasn,
                    domain: [0, 0.45],
                    autorange: true,
                },
                margin: {
                    t: 50,
                    b: 50,
                },
            } 
        }
        this.traceIndexes = {}
        this.traceNextIndex = 1
        this.showDetail = false
    
        this.fetchHegemony();
        this.fetchHegemonyCone();
    },

    fetchHegemony: function(){
        this.apiGetData(
            "hegemony/",
            {
                originasn: this.originasn, 
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
                af:this.af
            },
            this.computeHegemonyTrace
        )
    },

    fetchHegemonyCone: function(){
        this.apiGetData(
            "hegemony_cone/",
            {
                asn: this.originasn, 
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
                af:this.af
            },
            this.computeHegemonyConeTrace
        )
    },

    computeHegemonyTrace: function(data){
        for (var i=0; i< data.results.length; i++){
            var resp = data.results[i];
            if(resp.asn == this.originasn){
                continue;
            }
            if(this.traceIndexes[resp.asn] === undefined){
                this.traceIndexes[resp.asn] = this.traceNextIndex++
                this.chart.traces.push({
                    x: [],
                    y: [],
                    name: resp.asn_name.split(" ")[0]+" AS"+resp.asn,
                })
            }
            var traceIndex = this.traceIndexes[resp.asn];
            this.chart.traces[traceIndex].y.push(resp.hege)
            this.chart.traces[traceIndex].x.push(resp.timebin)
        }
        this.chart.layout.datarevision = new Date().getTime();
    },
    
    computeHegemonyConeTrace: function(data){
        for (var i=0; i< data.results.length; i++){
            var resp = data.results[i];
            this.chart.traces[0].y.push(resp.conesize)
            this.chart.traces[0].x.push(resp.timebin)
        }
        this.chart.layout.datarevision = new Date().getTime();
    },
    
    hegemonyPlotClick: function(data){
        console.log("in the click fct!")
        $("#cone_widget_title").html("");
        $("#cone_widget").html("");

        var pt = data.points[0];
        var date = pt.x 
        var title = "";
        var txt = "";
        
        console.log("after init")

    if(data.points[0].yaxis._id == 'y'){
        console.log("first if")
        this.showDetail = true;
        this.tableTitle = "AS"+this.originasn+" dependencies ("+pt.x+")";
        this.tableUrl =  'https://ihr.iijlab.net/ihr/api/hegemony/'
        this.tableData = [];
        this.tableColumns = ["asn", "asn_name", "hege"]

        var params = {
            originasn: this.originasn,
            timebin: date,
            af:this.af,
            format: 'json',
            };
        this.$http.get( this.tableUrl, { params: params}).then(
            function(response){
                for( var i=0; i<response.data.results.length; i++){
                    var alarm = response.data.results[i];
                    if (alarm.asn == this.originasn){
                        continue;
                    }
                    this.tableData.push(alarm)
                }

                if (response.data.count == 0){
                    // TODO
                    txt = "No network found."
                }

                console.log("before widget")
                // Widget
                var ts = new Date(pt.x+' GMT');
                //montitle = "<h3>BGPlay for AS2500</h3><br>";
                if(this.ripe_widgets){
                    ripestat.init(
                        "bgplay",
                        {
                            "unix_timestamps":"TRUE",
                            "ignoreReannouncements":"true",
                            "resource":"AS2500",
                            "starttime":(ts.getTime()/1000)-1800,
                            "endtime":(ts.getTime()/1000)+1800,
                            "rrcs":"0,13,16",
                            "type":"bgp"
                        },
                        "cone_widget",
                        {
                            "size": "fit", 
                            "show_controls":"yes",
                            "disable":["footer-buttons","logo"]
                        }
                    );
                }
            }); 
    }else{

        this.showDetail = true;
        this.tableTitle = "Networks dependent on AS"+this.originasn+" ("+pt.x+")";
        this.tableUrl =  'https://ihr.iijlab.net/ihr/api/hegemony/'
        this.tableData = [];
        this.tableColumns = ["originasn", "originasn_name", "hege"]

        var params = {
            asn: this.originasn,
            timebin: date,
            af:this.af,
            format: 'json',
            };
        this.$http.get( this.tableUrl, { params: params}).then(
            function(response){
                for( var i=0; i<response.data.results.length; i++){
                    var alarm = response.data.results[i];
                    if (alarm.originasn == 0 || alarm.originasn == this.originasn){
                        continue;
                    }
                    this.tableData.push(alarm)
                }

                if (response.data.count == 0){
                    // TODO
                    var txt = "No network found."
                }

            });
        }
      }
  },
}
</script>

<style>
</style>
