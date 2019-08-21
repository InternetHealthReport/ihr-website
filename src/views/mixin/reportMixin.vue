<script>

import IntervalPicker, { ChartInterval } from "@/components/IntervalPicker";

export default {
  components: {
    IntervalPicker
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: true
    }
  },
  data() {
    let interval;
    try {
      interval = ChartInterval.getFromDuration(
        this.$route.query.date + "T00:00+00:00",
        this.$route.query.last
      );
    } catch (e) {
      if (!(e instanceof RangeError)) {
        throw e;
      }
      interval = ChartInterval.lastWeek(); //fallback to lastweek
    }
    return {
      interval: interval,
      fetch: false,
    }
  },
  mounted() {
    this.pushRoute();
  },
  methods: {
    resizeCharts() {
      setTimeout(() => {
        this.charRefs.forEach(chart => {
          this.$refs[chart].relayout();
        });
      }, 400);
    },
  },
  computed: {
    startTime() {
      return this.interval.begin;
    },
    endTime() {
      return this.interval.end;
    },
  },
  watch: {
    interval() {
      this.pushRoute();
    }
  }
};
</script>
<style lang="stylus">
@import '../../styles/quasar.variables';
.IHR_
  &last-element
    margin-bottom 80px

  &charts-title
    text-align center
    text-transform capitalize
    font-size 22pt

  &char-container
    width 90%
    margin 0 auto
</style>