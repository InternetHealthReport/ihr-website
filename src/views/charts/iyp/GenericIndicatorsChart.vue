<template>
  <ReactiveChart
    :layout="actualChartLayout"
    :traces="actualChartData"
    :chart-title="actualChartLayout && actualChartLayout.title"
    :not-from-iyp-views="false"
  />
</template>

<script>
import ReactiveChart from '@/components/ReactiveChart'

export default {
  components: {
    ReactiveChart,
  },
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
      actualChartData: [],
      actualChartLayout: {},
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
      let data = this.formatChartData(this.localChartData)

      // ReactiveChart component will take care of width, height, and margin
      // let layout = {
      //   width: this.localChartData.length == 1 ? 400 : 600,
      //   height: this.localChartData.length == 1 ? 150 : 400,
      //   margin: this.localChartData.length == 1 ? { t: 25, b: 0, l: 30, r: 0 } : { t: 25, r: 25, l: 25, b: 25 },
      // }

      let layout = {
        ...this.chartLayout,
      }

      this.actualChartData = data
      this.actualChartLayout = layout
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let data = []
      if (arrayOfObjects.length === 1) {
        data = [
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[0].get('rank'),
            title: {
              text: `<span style='font-size:1rem'>${arrayOfObjects[0].get('name')}</span>`,
            },
            domain: { x: [0, 0.5], y: [0.5, 1] },
          },
        ]
      } else {
        console.log(arrayOfObjects[0])
        data = [
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[0].get('rank').low,
            title: {
              text: arrayOfObjects[0].get('name'),
            },
            domain: { x: [0, 0.5], y: [0.5, 1] },
          },
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[1].get('rank').low,
            title: {
              text: arrayOfObjects[1].get('name'),
            },
            domain: { x: [0.6, 1], y: [0, 1] },
          },
          {
            type: 'indicator',
            mode: 'number',
            value: arrayOfObjects[2].get('rank').low,
            title: {
              text: arrayOfObjects[2].get('name'),
            },
            domain: { x: [0, 0.5], y: [0, 0.5] },
          },
        ]
      }

      return data
    },
  },
  watch: {
    chartData: {
      handler() {
        if (this.chartData && this.chartData.length > 0) {
          this.localChartData = this.chartData
          this.renderChart()
        }
      },
      deep: true,
    },
  },
}
</script>
