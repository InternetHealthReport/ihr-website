<template>
    <div>
        <q-spinner v-if="loading"
        color="primary"
        size="3em"
        :thickness="2"/>
        <div v-else :ref="chart.uuid" ></div>
    </div>
</template>

<script>

import Plotly from 'plotly.js/dist/plotly.min'

export default {
    props: ["chart", "clickFct", "loading"],
    data (){
        return {
            loadingClass: "ui active loader",
        }
    },
    mounted() {
        var graphDiv = this.$refs[this.chart.uuid];
        Plotly.plot(graphDiv, this.chart.traces, this.chart.layout, {responsive: true, displayModeBar: false});

        if(document.documentElement.clientWidth<576){
            Plotly.relayout(graphDiv, {showlegend:false})
        }

        // Plotly events
        if(this.clickFct != null){
            this.$refs[this.chart.uuid].on('plotly_click', this.clickFct); 
        }
    },

    watch: {
        chart: {
            handler: function() {
                Plotly.react(
                this.$refs[this.chart.uuid],
                this.chart.traces,
                this.chart.layout
                );
                if(this.chart.loading < 1){
                    this.loadingClass="ui active loader" 
                }
                else{
                    this.loadingClass="ui disabled loader" 
                }
            },
        deep: true
        }
    },
}

</script>
