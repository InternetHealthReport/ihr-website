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
      loading: true,
      noData: false,
      traces: undefined,
      filters: [],
      myId: `ihrChart${this._uid}`,
      debouncedApiCall: function() {}
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    relayout() {
      this.$refs[this.myId].relayout();
    }
  },
  watch: {
    startTime(newValue) {
      this.filters.forEach(filter => {
        filter.startTime(newValue, Query.GTE);
      });
      this.debouncedApiCall();
    },
    endTime(newValue) {
      this.filters.forEach(filter => {
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