<template>
    <div>
        <div class="ui centered grid">
            <div class="row">
                <div class="column">
                    <reactive-chart :chart="chart" :clickFct="plotClick"></reactive-chart>
                </div>
            </div>
            <div v-if="table.show">
                <div class="row">
                    <div class="column">
                        <div :class="[{'vuetable-wrapper ui basic segment': true}, table.loading]">
                            <div class="extra content">
                                 <h3 class="ui left floated header">
                                    {{  table.title }} 
                                </h3>
                                <div class="ui right floated header" >
                                    <button class="ui grey icon button basic small" v-on:click="closeDetail">
                                        <i class="close icon" ></i>
                                    </button>
                                </div>
                            </div>
                            <div class="content">

                                    <vuetable ref="vuetable"
                                        api-url= "https://ihr.iijlab.net/ihr/api/hegemony/" 
                                        :per-page="10"
                                        :append-params="table.queryparams" 
                                        :fields="table.fields"
                                        :query-params="{sort: 'ordering', perPage: 'limit', page: 'page'}"
                                        :sort-order="[{ field: 'hege', direction: 'desc' }]"
                                        pagination-path="pagination"
                                        @vuetable:pagination-data="onPaginationData"
                                        @vuetable:loaded="onLoaded"
                                        @vuetable:loading="onLoading"
                                        >
                                        <template slot="originasn" slot-scope="props">   
                                            <router-link :to="{name: 'asn', params: { asn: props.rowData.originasn }}">
                                                AS{{ props.rowData.originasn }} {{ props.rowData.originasn_name }}
                                            </router-link>
                                        </template>
                                        <template slot="asn" slot-scope="props">  
                                            <router-link :to="{name: 'asn', params: { asn: props.rowData.asn }}">
                                                AS{{ props.rowData.asn }} {{ props.rowData.asn_name }}
                                            </router-link>
                                        </template>
                                    </vuetable>
                                    <vuetable-pagination ref="pagination"
                                        @vuetable-pagination:change-page="onChangePage">
                                    </vuetable-pagination>
                                </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-else>
                <div class="row">
                    <div class="column">
                        <i>Click on the graphs for more details.</i>
                    </div>
                </div>
            </div>
            <div v-show="bgplay.show">    
                <div class="row">
                    <div class="column">
                        <div id="hege_bgplay"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { downloader } from './mixins/downloader'
import Vuetable from 'vuetable-2/src/components/Vuetable'
import VuetablePagination from 'vuetable-2/src/components/VuetablePagination'

export default {
  components: {
    Vuetable,
    VuetablePagination,
  },
  mixins: [downloader],
  props: {
      asn:{
          type: Number,
      },
      af: {
          default: '4'
      },
      starttime: {
          type: String,
          default: "2018-01-01T00:00"
      },
      endtime: {
          type: String,
          default: "2018-01-03T00:00"
      }
  },
  data () {
    return {
        bgplay: {
            show: false
        },
        table: {
            title: 0,
            show: false,
            loading: '',
            type: "originasn",
            fields:  [
                {
                    name: "__slot:originasn",
                    title: "Autonomous System",
                    visible: true
                },
                {
                    name: "__slot:asn",
                    title: "Autonomous System",
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

        chart: this.initialChart(),
        traceIndexes:{},
        traceNextIndex: 1
    }
  },

  mounted() {
    this.fetchHegemony();
    this.fetchHegemonyCone();
  },

  methods: {
    initialChart: function(){
        return {
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
                    title: "AS"+this.asn+" dependencies",
                    domain: [0.55, 1],
                    autorange: true
                },
                yaxis2:{
                    title: 'Number of ASes<br>dependent on AS'+this.asn,
                    domain: [0, 0.45],
                    autorange: true,
                },
                margin: {
                    t: 50,
                    b: 50,
                },
            } 
        }
    },
    reset: function(){
        this.chart = this.initialChart()
        this.traceIndexes = {}
        this.traceNextIndex = 1
        this.table.show = false
        this.bgplay.show = false
    
        this.fetchHegemony();
        this.fetchHegemonyCone();
    },

    fetchHegemony: function(){
        this.apiGetData(
            "hegemony/",
            {
                originasn: this.asn, 
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
                asn: this.asn, 
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
            if(resp.asn == this.asn){
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
    
    plotClick: function(data){
        var pt = data.points[0];
        
        if(data.points[0].yaxis._id == 'y'){
            // Update the table
            this.table.title = "AS"+this.asn+" dependencies ("+pt.x+")";
            this.table.type = 0
            this.table.queryparams = {
                originasn: this.asn,
                timebin: pt.x,
                af:this.af,
                format: 'json',
            };

            this.tableRefresh()

            // BGPlay Widget
            var ts = new Date(pt.x+' GMT');
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
                "hege_bgplay",
                {
                    "size": "fit", 
                    "show_controls":"yes",
                    "disable":["footer-buttons","logo"]
                }
            );
            this.bgplay.show = true;

        }else{
            // Update the table
            this.bgplay.show = false;
            this.table.title = "Networks dependent on AS"+this.asn+" ("+pt.x+")";
            this.table.type = 1
            this.table.queryparams = {
                asn: this.asn,
                timebin: pt.x,
                af:this.af,
                format: 'json',
            };

            this.tableRefresh()
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
            var curr_page = this.table.current_page;
            if(curr_page > 1){
                from = (curr_page*per_page) + 1
                to = (curr_page+1)*per_page
            }
                
            transformed.pagination = {
                total: data.count,
                per_page: per_page,
                current_page: this.table.current_page,
                last_page: Math.ceil(data.count/per_page),
                next_page_url: data.next,
                prev_page_url: data.previous,
                from: from,
                to: to, 
            }

            transformed.data = [] 
            for (var i=0; i < data.results.length; i++) {
                if(data.results[i].originasn != 0){
                    if (data.results[i].originasn != data.results[i].asn){
                        transformed.data.push(data.results[i])
                    }
                }
            }

            return transformed
    
    },
	onPaginationData: function(paginationData) {
			this.$refs.pagination.setPaginationData(paginationData)
			
	},
	onChangePage: function(page) {
        this.table.current_page = page
        this.$refs.vuetable.changePage(page)
			
	},
    getSortParam: function(sortOrder) {
    return sortOrder.map(function(sort) {
        return (sort.direction === 'desc' ? '-' : '') + sort.field
        }).join(',')
    },
    onLoading: function () {     
        this.table.loading = 'loading';
    },
    onLoaded: function () {     
        this.table.loading = '';
        this.tableHideColumns();
    },
    tableHideColumns: function() {

        if(this.table.type == 0){
            this.table.fields[0].visible = false
            this.table.fields[1].visible = true
        }
        else{
            this.table.fields[0].visible = true
            this.table.fields[1].visible = false
        }
        this.$refs.vuetable.normalizeFields()
    },
    tableRefresh: function(){
        if (this.table.show){
            this.$nextTick(() => {
            this.$refs.vuetable.refresh();
            });
        }
        else{
            this.table.show = true;
        }
    },

    closeDetail: function(){
        console.log("clicked on the button")
        this.table.show = false
        this.bgplay.show = false
    }
        
  },
    watch: {
        $route (to,from){
            this.reset()
        }
    }
}
</script>

<style>
</style>
