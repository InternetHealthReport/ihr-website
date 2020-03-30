<script>
import { debounce } from "quasar";
import ReactiveChart from "@/components/ReactiveChart";
import { Query } from "@/plugins/IhrApi";
import networkName from "@/plugins/networkName"; 

const DEFAULT_DEBOUNCE = 50;

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
    },
    filter: {
      type: String,
      default: ""
    }
  },
  data() {
    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(
      () => {
        if (!this.fetch) return;
        this.loading = true;
        this.apiCall();
      },
      DEFAULT_DEBOUNCE,
      false
    );

    return {
      loading: true,
      noData: false,
      traces: undefined,
      filters: [],
      myId: `ihrChart${this._uid}`,
      debouncedApiCall: debouncedApiCall
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    prettyName(shortname){ 
        return networkName(shortname);
    },
    relayout() {
      this.$refs[this.myId].relayout();
    },
    filteredRows(val) {
      this.$emit("filteredRows", val);
    },
    updateQuery(field, value) {
      if ("URLSearchParams" in window) {
        var searchParams = new URLSearchParams(window.location.search);
        searchParams.set(field, value);
        var newRelativePathQuery =
          window.location.pathname + "?" + searchParams.toString();
        history.pushState(null, "", newRelativePathQuery);
      }
    }
  },
  computed: {
    filterValue() {
      return this.filter;
    }
  },
  watch: {
    loading(newValue) {
      this.$emit("loading", newValue);
    },
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
</script>
