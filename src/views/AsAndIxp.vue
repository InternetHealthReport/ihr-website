<template>
  <div>
    <interval-picker v-model="interval"/>
    <disco-chart
      :start-time="startTime"
      :end-time="endTime"
      :stream-name="Number(this.$route.params.asn)"
    />
  </div>
</template>

<script>
import IntervalPicker, {ChartInterval} from "@/components/IntervalPicker";
import DiscoChart from "@/views/charts/DiscoChart";
import { DiscoEventQuery } from "@/plugins/IhrApi";

export default {
  components: {
    DiscoChart,
    IntervalPicker
  },
  data() {
    let today = new Date();
    return {
      interval: ChartInterval.today()
    };
  },
  methods: {
  },
  computed: {
    startTime() {
      return this.interval.begin;
    },
    endTime() {
      return this.interval.end;
    }
  }
};
</script>

<style>
</style>
