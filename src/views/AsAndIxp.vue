<template>
  <div>
    <as-interdependencies
      :start-time="startTime"
      :end-time="endTime"
      :asn="Number(this.$route.params.asn)"/>
    <disco-chart
      :start-time="startTime"
      :end-time="endTime"
      :stream-name="Number(this.$route.params.asn)"
    />
    <div class="IHR_last-element">&nbsp;</div>
    <q-page-sticky position="bottom" class="IHR_time-filter" expand>
      <interval-picker v-model="interval" white/>
    </q-page-sticky>
  </div>
</template>

<script>
import IntervalPicker, {ChartInterval} from "@/components/IntervalPicker";
import AsInterdependencies from "@/views/charts/AsInterdependencies";
import DiscoChart from "@/views/charts/DiscoChart";
import { DiscoEventQuery } from "@/plugins/IhrApi";

export default {
  components: {
    AsInterdependencies,
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

<style lang="stylus" scoped>
@import '../styles/quasar.variables'

.IHR_
  &time-filter
    background-color $secondary
    padding 8px 0px

    & > *:first-child
      width 100%
  
  &last-element
    margin-bottom 40px
</style>
