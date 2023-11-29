<template>
  <div class="IHR_chart">
    <world-map-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
      @worldmap-country-clicked="onCountryClicked" />
  </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as WorldMapAggregatedAlarmsDataModel from '@/models/WorldMapAggregatedAlarmsDataModel'
import WorldMapAggregatedAlarmsReactive from './WorldMapAggregatedAlarmsReactive'
import { AGGREGATED_ALARMS_WORLDMAP_LAYOUT } from '../layouts'
export default {
  components: {
    WorldMapAggregatedAlarmsReactive,
  },
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
    },
    alarms: {
      type: Array,
      required: false,
      default: () => []
    },
    alarmCountsSelected: {
      type: Array,
      required: false,
      default: () => []
    },
    alarmTypeTitlesMap: {
      type: Object,
      required: false,
      default: () => {}
    }
  },
  emits: {
    'country-clicked': function (countryIsoCode3Clicked) {
      if (countryIsoCode3Clicked) {
        return true;
      } else {
        return false;
      }
    },
  },

  data() {
    let chart = {
      uuid: 'world-map',
      traces: [
        {
          type: 'choropleth',
          locations: [],
          z: [],
          text: [],
          name: '',
          customdata: [],
          hovertemplate: '',
          colorscale: 'Viridis',
          showscale: true,
          marker: {
            line: {
              color: 'rgb(255,255,255)',
              width: 1,
            },
          },
          hoverlabel: {
            bgcolor: 'white',
          },
          colorbar: {
            title: 'Alarm Density',
            len: 0.9,
          }
        },
      ],
      layout: {
        ...AGGREGATED_ALARMS_WORLDMAP_LAYOUT,
        title: WorldMapAggregatedAlarmsDataModel.getChartTitle()
      },
    }

    return {
      chart: chart,
      plotlyClickedData: null,
    }
  },
  watch: {
    plotlyClickedData: {
      handler: function (plotlyClickedPoint) {
        if (plotlyClickedPoint && !this.loadingVal) {
          let countryIsoCode3Clicked = plotlyClickedPoint.location
          this.$emit('country-clicked', countryIsoCode3Clicked)
        }
      }
    },
  },
  mounted(){
    this.etl(this.alarms, this.alarmCountsSelected, this.alarmTypeTitlesMap)
  },
  methods: {
    etl(alarms, alarmCountsSelected, alarmTypeTitlesMap) {
      const worldMapTrace = WorldMapAggregatedAlarmsDataModel.etl(alarms, alarmCountsSelected, alarmTypeTitlesMap)
      const isWorldMapTraceEmpty = AggregatedAlarmsUtils.isDictEmpty(worldMapTrace)
      if (isWorldMapTraceEmpty) {
        this.clearDataViz()
      } else {
        const chartTitle = WorldMapAggregatedAlarmsDataModel.getChartTitle(worldMapTrace, alarms)
        this.initWorldMap(worldMapTrace, chartTitle)
      }
    },
    initWorldMap(trace, chartTitle) {
      Object.assign(this.chart.traces[0], trace)
      this.$set(this.chart.layout, 'title', chartTitle)
      this.$set(this.chart.layout, 'datarevision', new Date().getTime())
    },
    clearDataViz() {
      const emptyWorldMapTrace = { locations: [], text: [], z: [], customdata: [], hovertemplate: '' }
      const chartTitle = WorldMapAggregatedAlarmsDataModel.getChartTitle()
      this.initWorldMap(emptyWorldMapTrace, chartTitle)
    },
    onCountryClicked(newCountryClicked) {
      this.$emit('worldmap-country-clicked', newCountryClicked)
    }
  }
}

</script>

<style scoped>
.IHR_chart {
  height: 300px;
}

.reset-granularity {
  flex: 1;
  text-align: center;
  color: #283237;
}
</style>