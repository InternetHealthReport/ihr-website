<template>
    <div>
        <div>
            <div v-if="showLocationInput">
                <form v-on:submit.prevent="addNewPair">
                    <input v-model="fromLocation" placeholder="Start location"> 
                    <input v-model="toLocation" placeholder="End location"> 
                    <button>Add</button>
                </form>
            </div>
            <p>Start time: {{ starttime }}, End time: {{ endtime }}</p>
        </div>
    <reactive-chart :chart="chart"></reactive-chart>
    </div>
</template>

<script>
export default {
  props: {
      showLocationInput: {
          type: Boolean,
          default: true,
      },
  },
  data () {
    return {
        apiPoint: 'https://ihr.iijlab.net/ihr/api/hegemony/',
        fromLocation: 0,
        toLocation: 0,
        starttime: "2018-08-16T07:30:00",
        endtime: "2018-08-18T07:30:00",
        af: 4,
        chart: {
            uuid: this._uid,
            traces: [],
            layout: {}
        },
    }
  },

  methods: {
    addNewPair: function(){
        console.log(this.fromLocation)
        console.log(this.toLocation)
        this.chart.traces.push(
            {
                x: [],
                y: [],
                line: {
                    width: 4,
                    shape: "dot"
                }
            })

        this.fetchHegemony(this.chart.traces.length-1, 1);

    },
    fetchHegemony: function(traceIndex, page){
        this.$http.get( this.apiPoint,
            {
            params: {
                format: "json", 
                page:page, 
                originasn: this.fromLocation, 
                asn: this.toLocation,  
                timebin__gte: this.starttime, 
                timebin__lte: this.endtime, 
                af:this.af
            }}).then(
            function(response) {
                var xvalues = this.chart.traces[traceIndex].x;
                var yvalues = this.chart.traces[traceIndex].y;

                for (var i=0; i< response.data.results.length; i++){
                    yvalues.push(response.data.results[i].hege)
                    xvalues.push(response.data.results[i].timebin)
                }

                // Sort the values based on the dates
                // yvalues= xvalues.filter(v => yvalues.includes(v));
                // xvalues.sort();
                this.chart.layout.datarevision = new Date().getTime();

                if(response.data.next){
                    this.fetchHegemony(traceIndex, page+1)
                }
            },
            function(err) {
                console.log("error happened");
                console.log(err)
            }
        )
    }
  },
  created: function(){
      if (this.startLocation && this.endLocation){
          this.addPair()
      }
  }
}
</script>

<style>
</style>
