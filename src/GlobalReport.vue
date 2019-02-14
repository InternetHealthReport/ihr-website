<template>
    <div class="ui centered grid">
        <div class="row">
            <div class="twelve wide column">
                <h1 class="ui centered header">
                    <div class="content">
                        Global Report ({{ endtime }})
                    </div>
                    <div class="sub header">
                    </div>
                </h1>
            </div>
        </div>

        <div class="row">
            <div class="twelve wide column">
                <h2 class="ui dividing header">
                    <div class="content">
                        Delay Changes
                    </div>
                    <h4 class="ui top right floated header">
                        <div class="sub header">
                            <i class="ui question icon link" @click=""></i>
                            <i :class="sections.delay.class" @click="switchSection('delay')"></i>

                        </div>
                    </h4>
                </h2>
                <div v-show="sections.delay.show">
                    <reactive-chart :chart="chartDelay" :clickFct="plotClickDelay"></reactive-chart>
                    <div :class="[{'vuetable-wrapper ui segment ': true}, tableDelay.loading]">
                            <div class="ui placeholder segment basic padded">
                                <div class="column">
                                    <vuetable ref="vuetabledelay"
                                    class="vuetable ui table very basic"
                                        :api-url="tableDelay.apiurl" 
                                        :per-page="10"
                                        :append-params="tableDelay.queryparams" 
                                        :fields="tableDelay.fields"
                                        :query-params="{sort: 'ordering', perPage: 'limit', page: 'page'}"
                                        :sort-order="[{ field: 'deviation', direction: 'desc' }]"
                                        :detail-row-component="tableDelay.detailRow"
                                        :track-by="tableDelay.id"
                                        pagination-path="pagination"
                                        @vuetable:pagination-data="onPaginationData"
                                        @vuetable:loaded="onLoaded"
                                        @vuetable:loading="onLoading"
                                        @vuetable:cell-clicked="onCellClickedDelay"
                                        >
                                        <template slot="asn" slot-scope="props">
                                            <div @click="onCellClickedDelay(props.rowData, props.rowField, props.rowIndex)">  
                                                    <router-link :to="{name: 'asn', params: { asn: props.rowData.asn }}">
                                                        {{ printAsn(props.rowData.asn) }} {{ props.rowData.asn_name.split(" ")[0] }}
                                                    </router-link>
                                            </div>
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
        </div>

        <div class="row">
            <div class="twelve wide column">
                <h2 class="ui dividing header">
                    <div class="content">
                        Network Disconnections
                    </div>
                    <h4 class="ui top right floated header">
                        <div class="sub header">
                            <i class="ui question icon link" @click=""></i>
                            <i :class="sections.disco.class" @click="switchSection('disco')"></i>

                        </div>
                    </h4>
                </h2>
                <div v-show="sections.disco.show">
                   
                </div>
            </div>
        </div>

        <div class="row">
        </div>
    </div>
</template>

<script>
import { downloader } from './mixins/downloader'
import Vuetable from 'vuetable-2/src/components/Vuetable'
import VuetablePagination from 'vuetable-2/src/components/VuetablePagination'
import ReactiveChart from './ReactiveChart.vue'

export default {
    components: {
        Vuetable,
        VuetablePagination,
        "reactive-chart": ReactiveChart,
    },
    mixins: [downloader],
    props: {
    },

    data () {
        return {
            tableDelay: {
                show: true,
                loading: '',
                apiurl: "https://ihr.iijlab.net/ihr/api/delay_alarms/",
                id: "link",
                detailRow: "detail-link",
                fields:  [
                    {
                        name: "__slot:asn",
                        title: "Network",
                        callback: "printAsn",
                    },
                    {
                        name: "timebin",
                        title: "Time (UTC)",
                        callback: "printDate"
                    },
                    {
                        name: "link",
                        callback: "printLink"
                    },
                    {
                        name: "deviation",
                        callback: "printFloat",
                    },
                    {
                        name: "diffmedian",
                        title: "Delay Change",
                        callback: "printFloat",
                    },
                    {
                        name: "nbprobes",
                        title: "#Probes",
                    },
                ],
                queryparams: {
                    nbprobes__gte: 10,
                    deviation__gte: 150,
                    diffmedian__lte: 300,
                    diffmedian__gte: 15,
                },
                current_page: 1
            },

            sections: {
                delay: {
                    class: "ui chevron up icon link",
                    show: true
                },
                disco: {
                    class: "ui chevron up icon link",
                    show: true
                },
            },

            starttime: '',
            endtime: '',

            traceIndexes:{},
            traceNextIndex: 0,
            chartDelay: this.initialDelayChart()
        }
    },

    created() {
        this.updateDate()
        this.tableRefresh()
    },

    methods: { 
        switchSection: function(section){
            this.sections[section].show = !this.sections[section].show
            if(this.sections[section].show){
                this.sections[section].class =  "ui chevron up icon link"
            }
            else{
                this.sections[section].class =  "ui chevron down icon link"
            }
        },
        initialDelayChart (){
            return {
                uuid: this._uid,
                loading: 0,
                traces: [
                ],
                layout: {
                    hovermode:'closest',
                    yaxis: {
                        title: "Delay Change Level",
                        autorange: true,
                        automargin: true,
                    },
                    margin: {
                        t: 50,
                        b: 50,
                    },
                } 
            }
        },
        fetchDelay: function(asn){
            this.apiGetData(
                "delay/",
                {
                    asn: asn, 
                    timebin__gte: this.starttime+"T00:00", 
                    timebin__lte: this.endtime+"T23:59", 
                    af: 4
                },
                this.computeTraceDelay
            )
        },
        computeTraceDelay: function(data){
            var asn = data.results[0].asn
            var traceIndex = this.traceIndexes[asn];
            if(traceIndex != undefined){
                for (var i=0; i< data.results.length; i++){
                    var resp = data.results[i];
                    this.chartDelay.traces[traceIndex].y.push(resp.magnitude)
                    this.chartDelay.traces[traceIndex].x.push(resp.timebin)
                }
                this.chartDelay.layout.datarevision = new Date().getTime();
                this.chartDelay.loading += 0.5
            }
        },

        tableRefresh: function(){
            this.tableDelay.queryparams.timebin__gte = this.starttime+"T00:00"
            this.tableDelay.queryparams.timebin__lte = this.endtime+"T23:59"
            if (this.tableDelay.show){
                this.$nextTick(() => {
                this.$refs.vuetabledelay.refresh();
                });
            }
            else{
                this.table.show = true;
            }
        },
        updateDate(){
            if(this.starttime == ''){
                if (this.$route.query.date && this.$route.query.last){
                    // get date from the url parameters
                    var last = parseInt(this.$route.query.last)
                    var endDate = new Date(this.$route.query.date)
                    var startDate = new Date(this.$route.query.date)
                    endDate.setDate(endDate.getDate() + 1)
                    startDate.setDate(endDate.getDate() - last)

                    this.starttime = startDate.toJSON().slice(0,10)
                    this.endtime = endDate.toJSON().slice(0,10) 
                }
                else{
                    // Display latest results
                    var today = new Date();
                    today.setDate(today.getDate());
                    var yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);

                    this.starttime = yesterday.toJSON().slice(0,10)
                    this.endtime = today.toJSON().slice(0,10) 
                }
            }
        },
        printDate: function(value){
            var d = new Date(value);
            var options = {year:'numeric', month:'numeric', day:'numeric', hour: '2-digit', minute:'2-digit', second: undefined}
            return d.toLocaleString("ja", options)
        },
        printLink: function(value){
            var ips = value.split(",")
            return ips[0].slice(1)+" - "+ips[1].slice(0,-1)
        },
        printFloat: function(value){
            return Number(value).toFixed(3)
        },
        printAsn: function(value){
            if(value == 0){
                return ""
            }
            else if(value > 0){
                return "AS"+value
            }
            else{
                return "IX"+(-value)
            }
        },
        transform: function(data) {
                var transformed = {}
                var per_page = 1000;
                var from = 1;
                var to = data.count;
                var curr_page = this.tableDelay.current_page;
                if(curr_page > 1){
                    from = (curr_page*per_page) + 1
                    to = (curr_page+1)*per_page
                }
                    
                transformed.pagination = {
                    total: data.count,
                    per_page: per_page,
                    current_page: this.tableDelay.current_page,
                    last_page: Math.ceil(data.count/per_page),
                    next_page_url: data.next,
                    prev_page_url: data.previous,
                    from: from,
                    to: to, 
                }

                var ids = new Set()
                transformed.data = [] 
                var added = 0
                for (var i=0; i < data.results.length & added <10 ; i++) {
                    if(ids.has(data.results[i][this.tableDelay.id])){continue}
                    ids.add(data.results[i][this.tableDelay.id])

                    // Add corresponding graph
                    var resp = data.results[i]
                    if(resp.asn != 0 & this.traceIndexes[resp.asn] === undefined){
                        this.traceIndexes[resp.asn] = this.traceNextIndex++
                        this.chartDelay.traces.push({
                            x: [],
                            y: [],
                            name: this.printAsn(resp.asn)+" "+resp.asn_name.split(" ")[0],
                        })

                        this.fetchDelay(resp.asn)
                    }
                    
                    transformed.data.push(data.results[i])
                    added += 1
                }

                return transformed
        
        },
        onPaginationData: function(paginationData) {
                this.$refs.pagination.setPaginationData(paginationData)
                
        },
        onChangePage: function(page) {
            this.tableDelay.current_page = page
            this.$refs.vuetabledelay.changePage(page)
                
        },
        getSortParam: function(sortOrder) {
        return sortOrder.map(function(sort) {
            return (sort.direction === 'desc' ? '-' : '') + sort.field
            }).join(',')
        },
        onLoading: function () {     
            this.tableDelay.loading = 'loading';
        },
        onLoaded: function () {     
            this.tableDelay.loading = '';
        },
        onCellClickedDelay: function(data, field, event) {
            this.$refs.vuetabledelay.toggleDetailRow(data.link)
        },
        plotClickDelay: function(data){
            var label = data.points[0].data.name.split(" ")[0];
            var asn = label.slice(2) 
            if(label.startsWith("IX")){
                asn = -asn
            }
           
            this.$router.push({ name: 'asn', params: { asn: asn } })
            
        },
    },
  }
</script>

<style>
</style>
