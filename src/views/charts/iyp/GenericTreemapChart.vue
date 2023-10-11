<template>
  <ReactiveChart
    :layout="actualLayout"
    :traces="actualData"
    :chart-title="actualLayout && actualLayout.title"
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
      required: false,
      default: () => ({}),
    },
  },
  data() {
    return {
      localChartData: [],
      actualData: [],
      actualLayout: {},
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
      let textinfo =  this.config.textinfo ? this.config.textinfo : "label"
      let hovertemplate = this.config.hovertemplate ? this.config.hovertemplate : "%{label}<br>%{value}<extra></extra>"

      let data = [
        {
          type: 'treemap',
          labels: formattedData[0].labels,
          parents: formattedData[0].parents,
          values: formattedData[0].values,
          customdata: formattedData[0].extras,
          branchvalues: 'total',
          textinfo: textinfo,
          hovertemplate: hovertemplate
        },
      ]

      const layout = {
        ...this.chartLayout,
      }

      this.actualData = data
      this.actualLayout = layout

      // ReactiveChart component will take care of width and height
      // To enlarge the chart if length of the data increases
      // if (formattedData[0].labels.length > 100) {
      //   layout.width = '1000'
      //   layout.height = '750'
      // } else {
      //   layout.width = '700'
      // }
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let handler = {
        get: function(target, name) {
          return target.hasOwnProperty(name) ? target[name] : '';
        }
      };

      let emptyObj = new Proxy({}, handler);

      const map = {}
      let configKey = this.config.key
      arrayOfObjects.forEach(item => {
        let key = item[configKey]

        if (!map[key]) {
          map[key] = [{ child: item[this.config.key1], value: this.config.keyValue ? Number(item[this.config.keyValue]) : 1, extra: item }]
        } else {
          map[key].push({ child: item[this.config.key1], value: this.config.keyValue ? Number(item[this.config.keyValue]) : 1, extra: item })
        }
      })

      let labels = []
      let parents = []
      let values = []
      let extras = []

      let root = this.config.root
      labels.push(root)
      parents.push('')
      extras.push( emptyObj )

      let keys = Object.keys(map)

      // calculating root sum
      let rootSum = 0
      keys.forEach(key => {
        let sum = 0
        map[key].forEach(item => {
          sum += item.value
        })
        rootSum += sum
      })
      values.push(rootSum)

      // calculating sum for one level deeper
      keys.forEach(key => {
        labels.push(key)
        parents.push(root)
        extras.push( emptyObj )

          let sum = 0
          map[key].forEach(item => {
            sum += item.value
          })

          values.push(sum)
      })

      // Generating labels, parents, and values
      for (const [key, value] of Object.entries(map)) {
        value.forEach(item => {
          labels.push(item.child)
          parents.push(key)
          values.push(item.value)
          extras.push(item.extra)
        })
      }

      console.log(labels)
      console.log(parents)
      console.log(values)
      console.log(extras)

      return [{ labels, parents, values, extras }]
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
