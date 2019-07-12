<template>
  <disco-chart :start-time="startTime" :end-time="endTime" :stream-name="Number(this.$route.params.asn)"/>
</template>

<script>
import DiscoChart from "@/views/charts/DiscoChart";

export default {
  components: {
    DiscoChart
  },
  data() {
    let today = new Date();
    return {
      startTime: new Date(today.setHours(0, 0, 0, 0)),
      endTime: new Date(today.setHours(23, 59, 59, 0))
    };
  }
};
</script>

<style>
</style>
