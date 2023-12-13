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
    config: {
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

      var data = []

      if( this.config.groupKey ){

        // find all different values for the groupping field
        var group_values = []
        this.localChartData.forEach( item => {
          if(!group_values.includes(item.get(this.config.groupKey))) group_values.push(item.get(this.config.groupKey));
        })

        console.log( group_values)

        group_values.forEach( group => {

          const filtData = this.localChartData.filter((item) => item.get(this.config.groupKey) == group);

          const formattedData = this.formatChartData(filtData)
          const groupedData = this.groupTopThreeAndExceptAsOthers(formattedData)

          data.push(
            {
              name: group,
              x: groupedData.labels,
              y: groupedData.data,
              type: 'bar',
            }
          )

        })

      }
      else{
        const formattedData = this.formatChartData(this.localChartData)
        const groupedData = this.groupTopThreeAndExceptAsOthers(formattedData)

        data.push(
          {
            x: groupedData.labels,
            y: groupedData.data,
            type: 'bar',
          }
        )
      }

      const layout = {
        ...this.chartLayout,
      }

      this.actualChartLayout = layout
      this.actualChartData = data
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }
      const map = {}
      let prefix = this.config.xlabel_prefix ? this.config.xlabel_prefix : ''
      arrayOfObjects.forEach(item => {
        let keys = item.get(this.config.key)
        if( !Array.isArray(keys) ) keys = [keys]

        keys.forEach(  key => {
          let value = this.config.value? item.get(this.config.value): 1
          if (!map[prefix+String(key)]) {
            map[prefix+String(key)] = value
          } else {
            map[prefix+String(key)] += value
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
