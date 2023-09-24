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
      let layout = {
        xaxis: {
          title: {
            text: 'Rank',
          },
          type: 'log',
          autorange: false,
          rangemode: 'tozero',
        },
        yaxis: {
          title: {
            text: 'No. of Top-level Domains',
          },
        },
        hovermode: 'closest',
        ...this.chartLayout,
      }

      this.actualChartData = data
      this.actualChartLayout = layout

      // Reference: https://plotly.com/javascript/hover-events/
      // myPlot
      //   .on('plotly_hover', function (data) {
      //     let infotext = data.points.map(function (d) {
      //       return `.${d.data.domains[d.pointIndex]}`
      //     })

      //     hoverInfo.innerHTML = infotext.join('<br/>')
      //   })
      //   .on('plotly_unhover', function (data) {
      //     hoverInfo.innerHTML = ''
      //   })
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let ccMap = {}
      this.localChartData.forEach(i => {
        let topLevelDomain = i.domainName.split('.').pop()
        if (!ccMap[topLevelDomain]) {
          ccMap[topLevelDomain] = [i]
        } else {
          ccMap[topLevelDomain].push(i)
        }
      })

      let plot = {}
      for (const [key, value] of Object.entries(ccMap)) {
        let count = value.length
        const y = Array(count).fill(count)
        const x = value.map(val => val.rank.low)
        const domains = value.map(val => val.domainName)
        plot[key] = { x, y, domains }
      }

      let data = []
      for (const [key, value] of Object.entries(plot)) {
        data.push({
          x: value.x,
          y: value.y,
          text: value.domains,
          hovertemplate: '<b>%{x}</b> ' + '%{text}',
          type: 'scatter',
          name: '.' + key,
          mode: 'markers',
          marker: { size: 12 },
        })
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
