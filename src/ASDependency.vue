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
        <div class="ui row">
            <div v-html="detailTitle"></div>
        </div>
        <div v-if="showDetail">
            <div class="row">
                <div class="col-lg-1 col-m-0"></div>
                <div class="col-lg-10 col-m-12"> 
                    <table class="table"> 
                        <thead> 
                            <tr>
                            <th v-for="key in detailColumns"> {{key}} </th> 
                            </tr>
                        </thead>'; 
                        <tbody>
                            <tr v-for="entry in detailTable">
                                <td v-for="key in detailColumns" v-html="entry[key]"> </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="col-lg-1 col-m-0"></div>
            </div>
            <div class="row">
                <div class="col-lg-1 col-m-0"></div>
                <div class="col-lg-10 col-m-12"> <div v-html="detailFooter"></div> </div>
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
        detailTitle: "",
        detailUrl: "",
        detailBody: "",
        detailFooter: "",
        detailWidgetTitle: "",
        detailWidget: "",
        detailColumns: ["ASN", "Name", "ASHegemony"],
        detailTable: "",
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
        },
        this.traceIndexes = {},
        this.traceNextIndex = 1
    
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

        // Sort the values based on the dates
        //yvalues= xvalues.filter(v => yvalues.includes(v));
        //xvalues.sort();
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
        $("#cone_details_data").html('<span class="glyphicon glyphicon-refresh glyphicon-refresh-animate"></span> Loading...')
        $("#cone_details_title").html("");
        $("#cone_details_footer").html("");
        $("#cone_widget_title").html("");
        $("#cone_widget").html("");

        var pt = data.points[0];
        var date = pt.x //JSON.stringify(pt.x).replace('"','').replace('"','');
        //date = date.replace(" ", "+");
        //date = date.replace(":", "%3A");
        var title = "";
        var montitle = "";
        var body = "";
        var txt = "";
        var footer = "";
        

        console.log("after init")
        // Update query string
        //$.QueryString.hegemonydate = pt.x;
        //$.QueryString.hegemonyy = pt.yaxis._id;
        //history.replaceState({}, '', "?" + $.param($.QueryString)); 

    if(data.points[0].yaxis._id == 'y'){
        console.log("first if")
        title = "<h3>AS2500 dependencies ("+pt.x+")</h3><br>";
        montitle = "";
        body = "";
        var url =  'https://ihr.iijlab.net/ihr/api/hegemony/'
        var params = {
            originasn: this.originasn,
            timebin: date,
            af:this.af,
            format: 'json',
            ordering: '-hege'
            };
        this.$http.get( url, { params: params}).then(
            function(response){
            body = '<table class="table"> <thead> <tr> <th> ASN </th> <th> Name </th> <th> AS Hegemony </th> </tr></thead>'; 
            body += '<tbody>';
        for( i=0; i<response.data.results.length; i++){
            var alarm = response.data.results[i];
            if (alarm.asn == 2500){
                continue;
            }
            if(alarm.hege>=0.5){
                body += '<tr class="danger">';
            }
            else if(alarm.hege >= 0.25){
                body += '<tr class="warning">';
            }
            else{
                body += '<tr>';
            }
            body += '<td><a href="https://ihr.iijlab.net/ihr/'+alarm.asn+'/asn/">'+alarm.asn+'</a></td>';
            body += '<td><a href="https://ihr.iijlab.net/ihr/'+alarm.asn+'/asn/">'+alarm.asn_name+'</a></td>';
            body += '<td>'+alarm.hege.toFixed(4)+'</td>';
            body += '</tr>';

        }
        body += '</tbody>';
        body += '</table>';
        if (response.data.count == 0){
            txt = "No network found."
            footer = "";
        }
        else{
            txt = '';
            var nbASN = response.data.count-1;
            footer = "See the "+nbASN+" ASN here: <a href='"+url.replace("format=json", "format=api")+"'>ihr.iijlab.net/"+url.replace("format=json", "format=api")+"</a>";
        }

        console.log("before widget")
        // Widget
        var ts = new Date(pt.x+' GMT');
        montitle = "<h3>BGPlay for AS2500</h3><br>";
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
        $("#cone_details_title").html(title);
        $("#cone_details_data").html(txt+body);
        $("#cone_details_footer").html(footer);
        $("#cone_mon_title").html(montitle);
        }); 
    }else{

        console.log("in else");
        this.showDetail = true;
        // Update query string
        //$.QueryString.conedate = pt.x;
        //history.replaceState({}, '', "?" + $.param($.QueryString)); 
        
        this.detailTitle = "Networks dependent on AS"+this.originasn+" ("+pt.x+")";
        this.detailUrl =  'https://ihr.iijlab.net/ihr/api/hegemony/'
        this.detailTable = [];
            console.log("before getjson")
        var params = {
            asn: this.originasn,
            timebin: date,
            af:this.af,
            format: 'json',
            ordering: '-hege'
            };
        this.$http.get( this.detailUrl, { params: params}).then(
            function(response){
            console.log("in getjson")
                console.log(response.data)
                console.log(response)
            for( var i=0; i<response.data.results.length; i++){
                console.log(response.data.results[i])
                var alarm = response.data.results[i];
                if (alarm.originasn == 0 || alarm.originasn == this.originasn){
                    continue;
                }
                this.detailTable.push(
                    {ASN:'<a href="https://ihr.iijlab.net/ihr/'+alarm.originasn+'/asn/">'+alarm.originasn+'</a>',
                    Name: '<a href="https://ihr.iijlab.net/ihr/'+alarm.originasn+'/asn/">'+alarm.originasn_name+'</a></td>',
                    ASHegemony: alarm.hege.toFixed(3)}
                )

            }

            if (response.data.count == 0){
                // TODO
                var txt = "No network found."
                this.detailFooter = "";
            }
            else{
                var txt = '';
                var nbASN = response.data.count-2;
                this.detailFooter = "See the "+nbASN+" ASN here: <a href='"+url.replace("format=json", "format=api")+"'>ihr.iijlab.net/"+url.replace("format=json", "format=api")+"</a>";
            }

            });
        }
      }
  },
}
</script>

<style>
</style>
