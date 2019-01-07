    <template>
        <div>
            <div class="ui centered equal width grid">
                <div class="column">
                    <reactive-chart :chart="chart" :clickFct="plotClick"></reactive-chart>
                </div>
                <div class="equal width row">
                <div v-if="table.show">
                    <div :class="[{'vuetable-wrapper ui segment raised': true}, table.loading]">
                            <div class="ui top attached label">
                                {{  table.title }} 
                            </div>
                            <i class="ui top right attached label close icon link" @click="closeDetail"></i>
                            <div class="ui placeholder segment basic padded">
                                <div class="column">
                                    <vuetable ref="vuetable"
                                    class="vuetable ui table very basic"
                                        :api-url="table.apiurl" 
                                        :per-page="10"
                                        :append-params="table.queryparams" 
                                        :fields="table.fields"
                                        :query-params="{sort: 'ordering', perPage: 'limit', page: 'page'}"
                                        :sort-order="[{ field: 'deviation', direction: 'desc' }]"
                                        :detail-row-component="table.detailrow"
                                        :track-by="table.id"
                                        pagination-path="pagination"
                                        @vuetable:pagination-data="onPaginationData"
                                        @vuetable:loaded="onLoaded"
                                        @vuetable:loading="onLoading"
                                        @vuetable:cell-clicked="onCellClicked"
                                        >
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
                <div v-else>
                    <div class="column">
                        <i>Click on a graph for more details.</i>
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
import ReactiveChart from './ReactiveChart.vue'

export default {
  components: {
    Vuetable,
    VuetablePagination,
    "reactive-chart": ReactiveChart,
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
        table: {
            title: 0,
            show: false,
            loading: '',
            apiurl: "",
            type: 0,
            id: "",
            detailRow: "",
            fields:  [
                {
                    name: "link",
                    sortField: "link",
                    type: 0,
                    visible: false
                },
                {
                    name: "deviation",
                    callback: "printFloat",
                    sortField: "deviation",
                    type: 0,
                    visible: false
                },
                {
                    name: "diffmedian",
                    title: "Delay Change",
                    callback: "printFloat",
                    sortField: "diffmedian",
                    type: 0,
                    visible: false
                },
                {
                    name: "nbprobes",
                    title: "#Probes",
                    sortField: "nbprobes",
                    type: 0,
                    visible: false
                },
                {
                    name: "ip",
                    title: "Reported IP",
                    type: 1,
                    visible: false
                },
                {   
                    name: "previoushop",
                    title: "Usual preceding IP",
                    type: 1,
                    visible: false
                },
                {
                    name: "correlation",
                    callback: "printFloat",
                    type: 1,
                    visible: false
                },
                {
                    name: "responsibility",
                    callback: "printFloat",
                    type: 1,
                    visible: false
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
    this.fetchDelay();
    this.fetchForwarding();
  },

  methods: {
    initialChart: function(){
        return {
            uuid: this._uid,
            loading: 0,
            traces: [
                { 
                    x: [],
                    y: [],
                    yaxis: 'y',
                    name: 'Delay',
                    showlegend: false
                },
                { 
                    x: [],
                    y: [],
                    yaxis: 'y2',
                    name: 'Forwarding',
                    showlegend: false
                }
            ],
            layout: {
                yaxis: {
                    title: "Delay Change Level",
                    domain: [0.55, 1],
                    autorange: true,
                    automargin: true,
                },
                yaxis2:{
                    title: "Forwarding Change Level",
                    domain: [0, 0.45],
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
    reset: function(){
        this.chart = this.initialChart() 
        this.traceIndexes = {}
        this.traceNextIndex = 1
        this.table.show = false
    
        this.fetchDelay();
        this.fetchForwarding();
    },

    fetchDelay: function(){
        this.apiGetData(
            "delay/",
            {
                asn: this.asn, 
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
                af:this.af
            },
            this.computeTrace0
        )
    },

    fetchForwarding: function(){
        this.apiGetData(
            "forwarding/",
            {
                asn: this.asn, 
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
                af:this.af
            },
            this.computeTrace1
        )
    },
      //TODO clean this up
    computeTrace0: function(data){
        for (var i=0; i< data.results.length; i++){
            var resp = data.results[i];
            this.chart.traces[0].y.push(resp.magnitude)
            this.chart.traces[0].x.push(resp.timebin)
        }
        this.chart.layout.datarevision = new Date().getTime();
        this.chart.loading += 0.5
    },
    computeTrace1: function(data){
        for (var i=0; i< data.results.length; i++){
            var resp = data.results[i];
            this.chart.traces[1].y.push(resp.magnitude)
            this.chart.traces[1].x.push(resp.timebin)
        }
        this.chart.layout.datarevision = new Date().getTime();
        this.chart.loading += 0.5
    },
    
    
    plotClick: function(data){
        var pt = data.points[0];
        
        if(data.points[0].yaxis._id == 'y'){
            // Update the table
            this.table.title = "Delay anomalies ("+pt.x+")";
            this.table.type = 0
            this.table.id = "link"
            this.table.apiurl = "https://ihr.iijlab.net/ihr/api/delay_alarms/" 
            this.table.detailrow = "detail-link"
            this.table.queryparams = {
                asn: this.asn,
                timebin: pt.x,
                af:this.af,
                format: 'json',
            };

            this.tableRefresh()

        }else{
            // Update the table
            this.table.title = "Forwarding anomalies ("+pt.x+")";
            this.table.type = 1
            this.table.id = "ip"
            this.table.apiurl = "https://ihr.iijlab.net/ihr/api/forwarding_alarms/" 
            this.table.detailrow = "detail-forwarding"
            this.table.queryparams = {
                asn: this.asn,
                timebin: pt.x,
                af:this.af,
                format: 'json',
            };

            this.tableRefresh()
        }

    },
    printFloat: function(value){
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
    onCellClicked: function(data, field, event) {
        if(this.table.type == 0){
            this.$refs.vuetable.toggleDetailRow(data.link)
        }   
        else{
            this.$refs.vuetable.toggleDetailRow(data.ip)
        }
    },
    tableHideColumns: function() {

        for(var i=0; i<this.table.fields.length; i++){
            if(this.table.type == this.table.fields[i].type){
                this.table.fields[i].visible = true
            }
            else{
                this.table.fields[i].visible = false
            }
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
        this.table.show = false
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
