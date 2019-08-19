<script>
import ReactiveChart from "@/components/ReactiveChart";
import { Query } from "@/plugins/IhrApi";

const DEFAULT_DEBOUNCE = 800;


//remember to put ref="chart" into the charts!
export default {
 components: {
    ReactiveChart
  },
  props: {
    startTime: {
      type: Date,
      require: true
    },
    endTime: {
      type: Date,
      require: true
    },
    fetch: {
      type: Boolean,
      require: true
    }
  },
  data() {
    return {
      filters: [],
      debouncedApiCall: function(){}
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    relayout() {
      this.$refs.chart.relayout();
    }
  },
  watch: {
    startTime(oldValue, newValue) {
      this.filters.forEach((filter) => {
        filter.startTime(newValue, Query.GTE);
      });
      this.debouncedApiCall();
    },
    endTime(oldValue, newValue) {
      this.filters.forEach((filter) => {
        filter.endTime(newValue, Query.LTE);
      });
      this.debouncedApiCall();
    },
    fetch() {
      this.debouncedApiCall();
    }
  }
};

export { DEFAULT_DEBOUNCE };
</script>
