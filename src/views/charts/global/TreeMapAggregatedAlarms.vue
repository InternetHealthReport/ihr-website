<template>
    <div class="IHR_chart">
        <tree-map-aggregated-alarms-reactive :chart="chart" :loading="loadingVal" />
    </div>
</template>
  
<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as TreeMapAggregatedAlarmsDataModel from '@/models/TreeMapAggregatedAlarmsDataModel'
import TreeMapAggregatedAlarmsReactive from './TreeMapAggregatedAlarmsReactive'

export default {
  components: {
    TreeMapAggregatedAlarmsReactive
  },
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      data: [],
      chart: {
        uuid: 'treemap',
        traces: [],
        layout: {
          margin: { t: 70, b: 0, l: 0, r: 0 },
          title: 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity',
          height: 400
        }
      },
    }
  },
  methods: {
    etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap) {
      const alarmsCopied = AggregatedAlarmsUtils.deepCopy(alarms)
      const treeMapTrace = TreeMapAggregatedAlarmsDataModel.etl(alarmsCopied, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap)
      const isTreeMapTraceEmpty = AggregatedAlarmsUtils.isDictEmpty(treeMapTrace)
      if (isTreeMapTraceEmpty) {
        this.clearDataViz()
      } else {
        const chartTitle = countryName ? `Aggregated Alarms by ASN, Alarm Type, and Severity for ${countryName}` : 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity'
        this.initTreeMap([treeMapTrace], chartTitle)
      }
    },
    clearDataViz() {
      this.initTreeMap([], 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity')
    },
    initTreeMap(traces, chartTitle) {
      this.$set(this.chart, 'traces', traces)
      this.$set(this.chart.layout, 'title', chartTitle)
    }
  },
}

</script>

<style scoped>
.IHR_chart {
    height: 300px;
}
</style>