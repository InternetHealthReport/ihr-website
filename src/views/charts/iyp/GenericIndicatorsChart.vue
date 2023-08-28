<template>
  <div ref="chart"></div>
</template>

<script>
import Plotly from 'plotly.js-dist'

export default {
  props: {
    chartData: {
      type: Array,
      default: () => [],
    },
    chartLayout: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      localChartData: [],
    }
  },
  mounted() {
    if (this.chartData && this.chartData.length > 0) {
      this.localChartData = this.chartData
      this.renderChart()
    }
  },
  methods: {
    renderChart() {
      let myPlot = this.$refs.chart
      let data = this.formatChartData(this.localChartData)
      let layout = {
        width: 600,
        height: 400,
        margin: { t: 25, r: 25, l: 25, b: 25 },
      }

      Plotly.newPlot(myPlot, data, layout)
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let data = [
        {
          type: 'indicator',
          mode: 'number',
          value: this.localChartData[0].rank.low,
          title: {
            text: this.localChartData[0].name,
          },
          domain: { x: [0, 0.5], y: [0.5, 1] },
        },
        {
          type: 'indicator',
          mode: 'number',
          value: this.localChartData[1].rank.low,
          title: {
            text: this.localChartData[1].name,
          },
          domain: { x: [0.6, 1], y: [0, 1] },
        },
        {
          type: 'indicator',
          mode: 'number',
          value: this.localChartData[2].rank.low,
          title: {
            text: this.localChartData[2].name,
          },
          domain: { x: [0, 0.5], y: [0, 0.5] },
        },
      ]

      return data
    },
  },
  chartData: {
    handler() {
      console.log('Yep, watching!')

      if (this.chartData && this.chartData.length > 0) {
        this.localChartData = this.chartData
        this.renderChart()
      }
    },
    deep: true,
  },
}
</script>
