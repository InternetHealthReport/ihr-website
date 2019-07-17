<template>
  <div>
    <h1 v-if="chartTitle">{{chartTitle}}</h1>
    <div ref="chart"></div>
  </div>
</template>
<script>
import Plotly from "plotly.js/dist/plotly.min";
/*
emitted events
  plotly-click: propagation of plotly onclick

  loading: emited (with false) when the plot has been rendered (for 2 way binding)
*/

export default {
  props: {
    layout: {
      type: Object,
      require: true
    },
    traces: {
      type: Array,
      require: true
    },
    chartTitle: {
      type: String,
      require: false,
      default: null
    }
  },
  data() {
    return {
    };
  },
  mounted() {
    var graphDiv = this.$refs["chart"];
    Plotly.plot(graphDiv, this.traces, this.layout, {
      responsive: true,
      displayModeBar: false
    });

    if (document.documentElement.clientWidth < 576) {
      Plotly.relayout(graphDiv, { showlegend: false });
    }

    graphDiv.on("plotly_click", eventData => {
      this.$emit("plotly-click", eventData);
    });
  },
  methods: {
    react() {
      Plotly.react(
        this.$refs["chart"],
        this.traces,
        this.layout
      );
      this.$emit("loaded");
    }
  },
  watch: {
    traces: {
      handler: function() { this.react() },
      deep: true
    },
    layout: {
      handler: function() { this.react() },
      deep: true
    }
  }
}
</script>
<style lang="stylus" scoped>

</style>

