    <template>
        <div>
            <div class="ui centered one column grid">
                <div class="column">
                    <reactive-chart :chart="chart" :clickFct="plotClick"></reactive-chart>
                </div>
                <div class="twelve wide column">
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
      streamname:{
          type: Number,
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
            id: "",
            detailRow: "",
            fields:  [
                {
                    name: "starttime",
                    title: "Disconnection Time",
                    callback: "printDate",
                    sortField: "starttime",
                },
                {
                    name: "endtime",
                    title: "Reconnection Time",
                    callback: "printDate",
                    sortField: "endtime",
                },
                {
                    name: "probe_id",
                    title: "Atlas Probe ID",
                },
                {
                    name: "prefixv4",
                    title: "IP Prefix",
                },
                {
                    name: "level",
                    title: "Severity",
					sortField: "level",
                },
            ],
            queryparams: { },
            current_page: 1,
        },
        chart: this.initialChart()
    }
  },

  mounted() {
    this.fetchDisco();
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
                    z: [],
                    yaxis: 'y',
                    name: 'Disconnection Level',
                    showlegend: false,
                    line: {shape: 'hv'},
                },
            ],
            layout: {
                yaxis: {
                    title: "Disconnection Level",
                    domain: [0, 10],
                    autorange: "reversed",
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
        this.table.show = false
        this.fetchDisco();
    },

    fetchDisco: function(){
        this.apiGetData(
            "disco_events/",
            {
                streamname: this.streamname, 
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
            },
            this.computeTrace
        )
    },

    computeTrace: function(data){
        this.chart.traces[0].x.push(this.starttime)
        this.chart.traces[0].y.push(0)
        this.chart.traces[0].z.push(0)

        for (var i=0; i< data.results.length; i++){
            var ev = data.results[i];
            this.chart.traces[0].x.push(ev.starttime)
            this.chart.traces[0].y.push(ev.avglevel)
            this.chart.traces[0].z.push(ev.id)

            this.chart.traces[0].x.push(ev.endtime)
            this.chart.traces[0].y.push(0)
            this.chart.traces[0].z.push(ev.id)
        }
        this.chart.traces[0].x.push(this.endtime)
        this.chart.traces[0].y.push(0)
        this.chart.traces[0].z.push(0)

        this.chart.layout.datarevision = new Date().getTime();
        this.chart.loading = 1
    },
    
    plotClick: function(data){
        var pt = data.points[0];
        var eventid = pt.data.z[pt.pointNumber]
        
        // Update the table
        this.table.title = "Disconnected probes on ("+pt.x+")"
		this.table.apiurl = "https://ihr.iijlab.net/ihr/api/disco_probes/"
        //this.table.detailrow = "detail-link"
        this.table.queryparams = {
            event: eventid,
            format: 'json',
        };

        this.tableRefresh()

    },
    printFloat: function(value){
        return Number(value).toFixed(3)
    },
    printDate: function(value){
        var dt = value.split("T")
        return dt[0]+" "+dt[1].slice(0,-1)
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

            var ids = new Set()
            transformed.data = data.results
            //for (var i=0; i < data.results.length; i++) {
                //if(ids.has(data.results[i][this.table.id])){continue}
                //ids.add(data.results[i][this.table.id])
                //if(data.results[i].originasn != 0){
                    //if (data.results[i].originasn != data.results[i].asn){
                        //transformed.data.push(data.results[i])
                    //}
                //}
            //}

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
    },
    onCellClicked: function(data, field, event) {
        if(this.table.id === "link"){
            this.$refs.vuetable.toggleDetailRow(data.link)
        }   
        else{
            this.$refs.vuetable.toggleDetailRow(data.ip)
        }
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
