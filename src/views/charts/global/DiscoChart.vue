<template>
  <div class="IHR_chart">
    <div>
        <disco-map :events="dataEvents" ref="ihrChartMap" />
        <disco-alarms-table 
        :start-time="startTime"
        :stop-time="endTime"
        :data="dataEvents"
        :loading="loading"
        :filter='filterValue'
        @filteredRows="filteredRows"
        @prefix-details="$emit('prefix-details', $event)"
        />
    </div>
  </div>
</template>


<script>
import Vue from "vue";
import NetworkDisco, { push0 } from "../DiscoChart";
import DiscoMap from "./DiscoMap.vue";
import DiscoAlarmsTable from "../tables/DiscoAlarmsTable.vue";
import { DiscoEventQuery } from "@/plugins/query/IhrQuery";
import DiscoChartVue from "../DiscoChart.vue";

const DEFAULT_DISCO_AVG_LEVEL = 8;
//under this gap 2 consecutive event are considered like 1 that change value

//utility functions

/**
 * Push a non event into the graph at position time
 */


export default {
  extends: NetworkDisco,
  components: {
    DiscoAlarmsTable,
    DiscoMap,
  },
  props: {
    minAvgLevel: {
      required: true,
      default: DEFAULT_DISCO_AVG_LEVEL
    }
  },
  beforeCreate() {
    Vue.delete(this.$options.props, "streamName");
  },
  beforeMount() {
    this.filters[0].streamName().avgLevel(this.minAvgLevel, DiscoEventQuery.GTE);
    this.traces = [];
    /*
    this.layout.showlegend = false;
    delete this.layout.legend;
    */
  },
  methods: {
    apiCall() {
      this.loading = true;
      this.$ihr_api.disco_events(
        this.filters[0],
        result => {
          this.dataEvents = result.results;
	      this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
        }
      );
    },
    filteredRows(data){
        this.$emit('filteredRows', data);
    }
  },
  watch: {
    minAvgLevel(newValue) {
      this.filters.forEach((filter) => {
        filter.avgLevel(this.minAvgLevel, DiscoEventQuery.GTE);
      });
      this.debouncedApiCall();
    },
  }
};

export {DEFAULT_DISCO_AVG_LEVEL};
</script>
