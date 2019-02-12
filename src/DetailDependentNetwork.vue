<template>
    <div class="ui attached segment padded">
        <div class="ui slider checkbox">
            <input type="checkbox" name="all-dependencies" v-model="allDependencies">
            <label>Show all dependencies of {{rowData.originasn_name}}</label>
        </div>
        <reactive-chart :chart="chart"></reactive-chart>
    </div>
</template>

<script>
import { downloader } from './mixins/downloader'
import ReactiveChart from './ReactiveChart.vue'

export default {
    components: {
        "reactive-chart": ReactiveChart,
    },
    mixins: [downloader],
    props: {
        rowData: {
            type: Object,
            required: true
        },
        rowIndex: {
            type: Number
        }
    },
    data() {
        return {
            chart: this.initialChart(),
            traceIndexes:{},
            traceNextIndex: 0,
            allDependencies: false
        }
    },
    mounted() {
       this.fetchHegemony() 
    },
    methods: {
        initialChart: function(){
            return {
                uuid: this._uid,
                traces: [],
                loading: 0,
                layout: {
                    yaxis: {
                        title: "AS"+this.rowData.originasn+" dependencies",
                        range: [0, 1.1],
                    },
                    showlegend: false,
                    height: 250,
                    margin: {
                        t: 50,
                        b: 50,
                    },
                } 
            }
        },

        fetchHegemony: function(){
            var params = {
                    originasn: this.rowData.originasn, 
                    timebin__gte: this.rowData.starttime, 
                    timebin__lte: this.rowData.endtime, 
                    af:this.rowData.af
                }
            if(!this.allDependencies){
                params.asn = this.rowData.asn
            }

            this.apiGetData(
                "hegemony/",
                params,
                this.computeHegemonyTrace
            )
        },

        computeHegemonyTrace: function(data){
            for (var i=0; i< data.results.length; i++){
                var resp = data.results[i];
                if(resp.asn == this.rowData.originasn){
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
            this.chart.loading = 1;
        },
        reset: function(){
            this.chart = this.initialChart() 
            this.traceIndexes = {}
            this.traceNextIndex = 0
        
            this.fetchHegemony()
        },
    
    },
    watch: {
        allDependencies: function(){
            this.reset()
        }
    }
  }
  </script>
