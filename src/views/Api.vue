<template>
  <div>
    <network-delay-chart :start-time="interval.begin" :end-time="interval.end" 
        startPointName="2914"/>
  </div>
</template>
<script>
import NetworkDelayChart from "@/views/charts/NetworkDelayChart";
import NetworkEdgeSearchBar from "@/components/search_bar/NetworkEdgeSearchBar";
import { ChartInterval } from "@/components/IntervalPicker"

export default {
  components: {
    NetworkDelayChart,
    NetworkEdgeSearchBar
  }
  ,data() {
    return {
      interval: ChartInterval.lastDays(3),
      fetch: false
    }
  }
};
</script>

<style>
</style>
