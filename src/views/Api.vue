<template>
  <div>
    <network-delay-chart :start-time="interval.begin" :end-time="interval.end" :fetch="fetch"/>
    <q-btn @click="fetch=true">fetch</q-btn>
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
      interval: ChartInterval.today(),
      fetch: false
    }
  }
};
</script>

<style>
</style>
