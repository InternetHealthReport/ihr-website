<template>
  <div>
    <h1 v-if="chartTitle">{{chartTitle}}</h1>
    <div :ref="myId"></div>
  </div>
</template>
<script>
import Plotly from 'plotly.js-dist';
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
      created: false,
      myId: `ihrReactiveChart${this._uid}`,
    };
  },
  mounted() {
    var graphDiv = this.$refs[this.myId];
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

    this.created = true;
  },
  methods: {
    react() {
      if(!this.created)
        console.error("SHOULD NEVER HAPPEN")

      if(this.traces == undefined)
        return;
      Plotly.react(
        this.$refs[this.myId],
        this.traces,
        this.layout
      );
      this.$emit("loaded");
    },
    relayout() {
      Plotly.relayout(this.$refs[this.myId], {});
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

