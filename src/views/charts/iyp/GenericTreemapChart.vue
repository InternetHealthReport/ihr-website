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
    config: {
      type: Object,
      required: false,
      default: () => ({}),
    },
  },
  data() {
    return {
      localChartData: [],
      chartWidth: 0,
    }
  },
  mounted() {
    if (this.chartData && this.chartData.length > 0) {
      this.localChartData = this.chartData
      this.renderChart()
    }
    this.chartWidth = this.$refs.chart.offsetWidth
  },
  methods: {
    renderChart() {
      const formattedData = this.formatChartData(this.localChartData)
      let data = [
        {
          type: 'treemap',
          labels: formattedData[0].labels,
          parents: formattedData[0].parents,
          branchvalues: 'total',
        },
      ]

      if (this.config.key === 'cc' && this.config.values) {
        data[0].values = formattedData[0].values
      }

      const layout = {
        ...this.chartLayout,
      }

      // if (formattedData[0].labels.length > 100) {
      //   layout.width = '1000'
      //   layout.height = '750'
      // } else {
      //   layout.width = '700'
      // }

      Plotly.newPlot(this.$refs.chart, data, layout, { responsive: true })
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      const map = {}
      let configKey = this.config.key
      arrayOfObjects.forEach(item => {
        let key = ''
        if (configKey == 'cc') {
          key = item.cc
        } else if (configKey == 'domainName') {
          key = item.domainName.split('.').pop()
        }

        if (!map[key]) {
          map[key] = [{ child: configKey === 'cc' ? item.asn.low : item.domainName, value: configKey === 'cc' ? item.hegemonyScore : '' }]
        } else {
          map[key].push({ child: configKey === 'cc' ? item.asn.low : item.domainName, value: configKey === 'cc' ? item.hegemonyScore : '' })
        }
      })

      let labels = []
      let parents = []
      let values = []

      let root = this.config.root
      labels.push(root)
      parents.push('')

      let keys = Object.keys(map)

      // calculating root sum
      if (configKey == 'cc' && this.config.values) {
        let rootSum = 0
        keys.forEach(key => {
          let sum = 0
          map[key].forEach(item => {
            sum += item.value
          })
          rootSum += sum
        })
        values.push(rootSum)
      }

      // calculating sum for one level deeper
      keys.forEach(key => {
        labels.push(key)
        parents.push(root)

        if (configKey == 'cc' && this.config.values) {
          let sum = 0
          map[key].forEach(item => {
            sum += item.value
          })

          values.push(sum)
        }
      })

      // Generating labels, parents, and values
      for (const [key, value] of Object.entries(map)) {
        value.forEach(item => {
          labels.push(item.child)
          parents.push(key)
          if (configKey == 'cc' && this.config.values) {
            values.push(item.value)
          }
        })
      }

      return [{ labels, parents, values }]
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
