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
      const formattedData = this.formatChartData(this.localChartData)
      const groupedData = this.groupTopThreeAndExceptAsOthers(formattedData)
      const data = [
        {
          x: groupedData.labels,
          y: groupedData.data,
          type: 'bar',
        },
      ]
      const layout = {
        height: 400,
        width: 400,
        ...this.chartLayout,
      }
      Plotly.newPlot(this.$refs.chart, data, layout)
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }
      const map = {}
      arrayOfObjects.forEach(item => {
        item.tags.forEach(tag => {
          if (!map[tag]) {
            map[tag] = 1
          } else {
            map[tag]++
          }
        })
      })
      return [{ data: Object.values(map), labels: Object.keys(map) }]
    },
    groupTopThreeAndExceptAsOthers(formattedData) {
      // following is to clean the data to plot the chart (top three, and except as others)
      // mapping data and labels
      let arr = []
      for (let i = 0; i < formattedData[0].data.length; i++) {
        arr.push({ cc: formattedData[0].labels[i], data: formattedData[0].data[i] })
      }

      // sorting the arr (array) with the data property
      let sortedChartData = arr.slice().sort((a, b) => b.data - a.data)

      // grouping top three and except as others
      const topThree = sortedChartData.slice(0, 3)
      const othersSum = sortedChartData.slice(3).reduce((sum, obj) => sum + obj.data, 0)

      let chartValues = []
      let chartLabels = []
      for (let i = 0; i < topThree.length; i++) {
        chartValues.push(topThree[i].data)
        chartLabels.push(topThree[i].cc)
      }

      if (othersSum > 0) {
        chartValues.push(othersSum)
        chartLabels.push('Others')
      }

      return { labels: chartLabels, data: chartValues }
    },
  },
  watch: {
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
  },
}
</script>
