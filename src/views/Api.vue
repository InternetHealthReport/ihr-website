<template>
  <div></div>
</template>
<script>
import ReactiveChart from "@/components/ReactiveChart";

export default {
  components: {
    ReactiveChart
  },
  data() {
    return {
      traces: [],
      layout: {
        hovermode: "closest",
        margin: { t: 0, b: 40, l: 100, r: 0 },
        height: 350,
        showlegend: true,
        legend: {
          x: 0,
          y: 1.2,
          orientation: "h"
        }
      }
    };
  }
};
</script>

<style>
</style>
