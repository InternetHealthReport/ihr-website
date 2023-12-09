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
      // formattedData will have data and labels
      let formattedData = this.formatChartData(this.localChartData)
      let groupedData = this.groupTopThreeAndExceptAsOthers(formattedData)

      const data = [
        {
          values: groupedData.chartValues,
          labels: groupedData.chartLabels,
          type: 'pie',
        },
      ]

      // ReactiveChart component will take care of width and height
      // const layout = {
      //   height: 400,
      //   width: 400,
      //   ...this.chartLayout,
      // }

      const layout = {
        'max-width': 400,
        ...this.chartLayout,
      }

      this.actualChartData = data
      this.actualChartLayout = layout
      // console.log(this.actualChartLayout)
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }
      const map = {}
      arrayOfObjects.forEach(item => {
        const countryCode = item.get('cc')
        if (!map[countryCode]) {
          map[countryCode] = 1
        } else {
          map[countryCode]++
        }
      })
      const totalCount = Object.values(map).reduce((sum, count) => sum + count, 0)
      const percentages = Object.values(map).map(count => (count / totalCount) * 100)
      const labels = Object.keys(map)
      return [{ data: percentages, labels }]
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
      const topThree = sortedChartData.slice(0, 5)
      const othersSum = sortedChartData.slice(5).reduce((sum, obj) => sum + obj.data, 0)

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

      return { chartLabels, chartValues }
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
