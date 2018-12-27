<template>
    <div>
        <div :ref="chart.uuid"></div>
    </div>
</template>

<script>

import Plotly from 'plotly.js/dist/plotly.min'

export default {
    props: ["chart", "clickFct"],

    mounted() {
        Plotly.plot(this.$refs[this.chart.uuid], this.chart.traces, this.chart.layout, {responsive: true, displayModeBar: false});
        if(document.documentElement.clientWidth<576){
            Plotly.relayout(this.$refs[this.chart.uuid], {showlegend:false})
            console.log("tried to relayout")
        }
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
        },
        deep: true
        }
    },
}

</script>
