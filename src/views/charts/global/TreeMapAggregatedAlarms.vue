<template>
  <div class="IHR_chart">
    <button class="button" @click="onShowAllCountries" type="button" :disabled="countryClicked === null">{{
      showAllCountriesText }}</button>
    <tree-map-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
      @treemap-node-clicked="onTreemapNodeClicked" />
  </div>
</template>
  
<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as TreeMapAggregatedAlarmsDataModel from '@/models/TreeMapAggregatedAlarmsDataModel'
import TreeMapAggregatedAlarmsReactive from './TreeMapAggregatedAlarmsReactive'
import { AGGREGATED_ALARMS_TREEMAP_LAYOUT } from '../layouts'

export default {
  components: {
    TreeMapAggregatedAlarmsReactive
  },
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
    },
    countryClicked: {
      type: String,
      required: false,
      default: () => null
    },
    alarms: {
      type: Array,
      required: false,
      default: () => []
    },
    aggregatedAttrsZipped: {
      type: Array,
      required: false,
      default: () => []
    },
    alarmTypeTitlesMap: {
      type: Object,
      required: false,
      default: () => ({})
    },
    isASGranularity: {
      type: Boolean,
      required: false,
      default: () => false
    },
    severitiesSelectedList: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      data: [],
      chart: {
        uuid: 'treemap',
        traces: [],
        layout: {
          ...AGGREGATED_ALARMS_TREEMAP_LAYOUT,
          title: TreeMapAggregatedAlarmsDataModel.getChartTitle({}, [], null, null, false)
        }
      },
      treeMapTrace: null
    }
  },
  computed: {
    showAllCountriesText() {
      return this.isASGranularity ? 'Show All ASes' : 'Show All Countries'
    }
  },
  mounted() {
    const countryName = null; const legendSelected = null; const renderTreeMap = true;
    this.etl(this.alarms, this.aggregatedAttrsZipped, countryName, this.alarmTypeTitlesMap, legendSelected, this.severitiesSelectedList, this.isASGranularity, renderTreeMap)
  },
  methods: {
    etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, legend, severitiesSelectedList, isASGranularity, renderTreeMap=true) {
      if (!renderTreeMap) return this.initChartTitle([this.treeMapTrace], severitiesSelectedList, countryName, legend, isASGranularity)
      this.treeMapTrace = TreeMapAggregatedAlarmsDataModel.etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, legend, isASGranularity)
      const isTreeMapTraceEmpty = AggregatedAlarmsUtils.isDictEmpty(this.treeMapTrace)
      return isTreeMapTraceEmpty ? this.clearDataViz() : this.initTreeMap([this.treeMapTrace], severitiesSelectedList, countryName, legend, isASGranularity)
    },
    initTreeMap(traces, severitiesSelectedList, countryClicked, legendSelected, isASGranularity) {
      this.initChartTitle(traces, severitiesSelectedList, countryClicked, legendSelected, isASGranularity)
      this.$set(this.chart, 'traces', traces)
    },
    initChartTitle(traces, severitiesSelectedList, countryClicked, legendSelected, isASGranularity){
      const chartTitle = TreeMapAggregatedAlarmsDataModel.getChartTitle(traces[0], severitiesSelectedList, countryClicked, legendSelected, isASGranularity)
      this.$set(this.chart.layout, 'title', chartTitle)
      this.$set(this.chart.layout, 'datarevision', new Date().getTime())
    },
    clearDataViz() {
      this.initTreeMap([], [], null, null, false)
    },
    onTreemapNodeClicked(newPointClickedLabel) {
      this.$emit('treemap-node-clicked', newPointClickedLabel)
    },
    onShowAllCountries() {
      this.$emit('reset-granularity')
    }
  },
}

</script>

<style scoped>
.IHR_chart {
  height: 350px;
}

.button {
  margin: 0px 0px 15px 0px;
  width: 100%;
  text-align: center;
}
</style>
