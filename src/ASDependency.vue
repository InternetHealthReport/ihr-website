<template>
    <div>
        <h2 class="ui dividing header">AS Interdependence</h2>
        <div class="ui centered grid">
            <div v-if="showInput">
                <div class="row">
                    <div class="column">
                        <form v-on:submit.prevent="reset">
                            <input v-model="originasn" placeholder="Origin ASN"> 
                            <input v-model="starttime" placeholder="Start time"> 
                            <input v-model="endtime" placeholder="End time"> 
                            <button>Refresh</button>
                        </form>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="column">
                    <reactive-chart :chart="chart" :clickFct="hegemonyPlotClick"></reactive-chart>
                </div>
            </div>
            <div v-if="showDetail">
                <div class="row">
                    <div class="column">
                        <h3 class="vue-title">
                        <div v-html="tableConf.title"></div>
                        </h3>
                    </div>
                </div>
                <div class="row">
                    <div class="column">
                        <vuetable ref="vuetable"
                            api-url= "https://ihr.iijlab.net/ihr/api/hegemony/" 
                            :per-page="10"
                            :append-params="tableConf.queryparams" 
                            :fields="tableConf.fields"
                            :query-params="{sort: 'ordering', perPage: 'limit', page: 'page'}"
                            pagination-path="pagination"
                            @vuetable:pagination-data="onPaginationData"
                            @vuetable:loaded="onLoaded"
                            >
                        </vuetable>
                        <vuetable-pagination ref="pagination"
                            @vuetable-pagination:change-page="onChangePage">
						</vuetable-pagination>
                    </div>
                </div>
                
                <div class="row">
                    <div class="ui column">
                        <div id="detailWidgetTitle"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="ui column">
                        <div id="detailWidget"></div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="row">
                    <div class="column">
                        <i>Click on the graph for more details.</i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script src="https://stat.ripe.net/widgets/widget_api.js"></script>
<script>
import { downloader } from './mixins/downloader'
import Vuetable from 'vuetable-2/src/components/Vuetable'
import VuetablePagination from 'vuetable-2/src/components/VuetablePagination'

export default {
  components: {
    Vuetable,
    VuetablePagination
  },
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
        originasn: this.$route.params.asn, //this.asn,
        starttime: '2018-10-01T00:00',//this.startdate,
        endtime: '2018-10-03T00:00', //this.enddate,
        showInput: true,
        apiPointHegemony: 'hegemony/',
        apiPointHegemonyCone: 'hegemony_cone/',
        showDetail: false,
        ripe_widgets: false,
        detailWidgetTitle: "",
        detailWidget: "",
        tableConf: {
            title: "",
            fields:  [
                {
                    name: "originasn",
                    sortField: "originasn",
                    title: "ASN",
                    visible: false
                },
                {
                    name: "originasn_name",
                    sortField: "originasn_name",
                    title: "Name",
                    visible: false
                },
                {
                    name: "asn",
                    sortField: "asn",
                    title: "ASN",
                    visible: false
                },
                {
                    name: "asn_name",
                    title: "Name",
                    visible: false
                },
                {
                    name: "hege",
                    title: "AS Hegemony",
                    callback: "hegeCallback",
                    sortField: "hege"
                },
            ],
            queryparams: { },
            current_page: 1
        },

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
        this.tableConf.title = "AS"+this.originasn+" dependencies ("+pt.x+")";
        this.tableConf.fields[0].visible = false
        this.tableConf.fields[1].visible = false
        this.tableConf.fields[2].visible = true
        this.tableConf.fields[3].visible = true

        if(this.showDetail){
            this.$refs.vuetable.normalizeFields()
        }
        else{
            this.showDetail = true;
        }

        this.tableConf.queryparams = {
            originasn: this.originasn,
            timebin: date,
            af:this.af,
            format: 'json',
        };


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
        }else{

            this.tableConf.title = "Networks dependent on AS"+this.originasn+" ("+pt.x+")";
            this.tableConf.fields[0].visible = true
            this.tableConf.fields[1].visible = true
            this.tableConf.fields[2].visible = false
            this.tableConf.fields[3].visible = false

            if(this.showDetail){
                this.$refs.vuetable.normalizeFields()
            }
            else{
                this.showDetail = true;
            }
            this.tableConf.queryparams = {
                asn: this.originasn,
                timebin: date,
                af:this.af,
                format: 'json',
            };

        }
    },
    hegeCallback: function(value){
        return Number(value).toFixed(3)
    },
    transform: function(data) {
            var transformed = {}

            var per_page = 1000;
            var from = 1;
            var to = data.count;
            var curr_page = this.tableConf.current_page;
            if(curr_page > 1){
                from = (curr_page*per_page) + 1
                to = (curr_page+1)*per_page
            }
                
            transformed.pagination = {
                total: data.count,
                per_page: per_page,
                current_page: this.tableConf.current_page,
                last_page: Math.ceil(data.count/per_page),
                next_page_url: data.next,
                prev_page_url: data.previous,
                from: from,
                to: to, 
            }

            transformed.data = data.results 

            return transformed
    
    },
	onPaginationData: function(paginationData) {
			this.$refs.pagination.setPaginationData(paginationData)
			
	},
	onChangePage: function(page) {
        this.tableConf.current_page = page
        this.$refs.vuetable.changePage(page)
			
	},
    getSortParam: function(sortOrder) {
    return sortOrder.map(function(sort) {
        return (sort.direction === 'desc' ? '' : '-') + sort.field
        }).join(',')
    },
    onLoaded: function () {     
        this.loading = false;
        this.$refs.vuetable.refresh()

    }
  },
}
</script>

<style>
</style>
