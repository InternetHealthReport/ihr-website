<template>
  <div class="IHR_chart">
    <world-map-aggregated-alarms-reactive :chart="chart" :loading="loadingVal"
      @plotly-click="plotlyClickedData = $event" />
  </div>
</template>

<script>
import * as AggregatedAlarmsUtils from '@/models/AggregatedAlarmsUtils'
import * as WorldMapAggregatedAlarmsDataModel from '@/models/WorldMapAggregatedAlarmsDataModel'
import WorldMapAggregatedAlarmsReactive from './WorldMapAggregatedAlarmsReactive'

export default {
  components: {
    WorldMapAggregatedAlarmsReactive,
  },
  props: {
    loadingVal: {
      type: Boolean,
      required: true,
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
            title: 'Alarm Counts',
            len: 0.9,
          }
        },
      ],
      layout: {
        hovermode: 'closest',
        margin: { t: 80, b: 10, l: 80, r: 80 },
        title: 'Aggregated Alarms by Countries',
        geo: {
          showframe: false,
          showcoastlines: false,
          showland: true,
          landcolor: 'rgb(215, 215, 215)',
          countrycolor: 'rgb(235, 235, 235)',
          showcountries: true,
        },
        height: 400
      },
    }

    return {
      chart: chart,
      plotlyClickedData: null,
    }
  },
  watch: {
    plotlyClickedData: {
      handler: function (newPlotlyClickedData) {
        if (newPlotlyClickedData && !this.loadingVal) {
          let countryIsoCode3Clicked = newPlotlyClickedData.points[0].location
          this.$emit('country-clicked', countryIsoCode3Clicked)
        }
      }
    },
  },
  methods: {
    etl(alarms, alarmCountsSelected, alarmTypeTitlesMap) {
      const alarmsCopied = AggregatedAlarmsUtils.deepCopy(alarms)
      const worldMapTrace = WorldMapAggregatedAlarmsDataModel.etl(alarmsCopied, alarmCountsSelected, alarmTypeTitlesMap)
      const isWorldMapTraceEmpty = AggregatedAlarmsUtils.isDictEmpty(worldMapTrace)
      if (isWorldMapTraceEmpty) {
        this.clearDataViz()
      } else {
        Object.assign(this.chart.traces[0], worldMapTrace)
      }
    },

    clearDataViz() {
      Object.assign(this.chart.traces[0], { locations: [] })
    },
  }
}

</script>

<style scoped>
.IHR_chart {
  height: 300px;
}
</style>