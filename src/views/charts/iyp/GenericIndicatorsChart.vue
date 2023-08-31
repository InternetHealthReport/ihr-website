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
        width: this.localChartData.length == 1 ? 400 : 600,
        height: this.localChartData.length == 1 ? 150 : 400,
        margin: this.localChartData.length == 1 ? { t: 25, b: 0, l: 30, r: 0 } : { t: 25, r: 25, l: 25, b: 25 },
      }

      Plotly.newPlot(myPlot, data, layout)
    },
    formatChartData(arrayOfObjects) {
      console.log(arrayOfObjects)
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let data = []
      if (arrayOfObjects.length === 1) {
        data = [
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[0].rank.low,
            title: {
              text: `<span style='font-size:1rem'>${arrayOfObjects[0].name}</span>`,
            },
            domain: { x: [0, 0.5], y: [0.5, 1] },
          },
        ]
      } else {
        data = [
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[0].rank.low,
            title: {
              text: arrayOfObjects[0].name,
            },
            domain: { x: [0, 0.5], y: [0.5, 1] },
          },
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[1].rank.low,
            title: {
              text: arrayOfObjects[1].name,
            },
            domain: { x: [0.6, 1], y: [0, 1] },
          },
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[2].rank.low,
            title: {
              text: arrayOfObjects[2].name,
            },
            domain: { x: [0, 0.5], y: [0, 0.5] },
          },
        ]
      }

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
