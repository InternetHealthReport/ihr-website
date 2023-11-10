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
      let textinfo =  this.config.textinfo ? this.config.textinfo : 'label'
      let hovertemplate = this.config.hovertemplate ? this.config.hovertemplate : '%{label}<br>%{value}<extra></extra>'

      let data = [
        {
          type: 'treemap',
          ids: formattedData[0].ids,
          labels: formattedData[0].labels,
          parents: formattedData[0].parents,
          values: formattedData[0].values,
          customdata: formattedData[0].extras,
          branchvalues: 'remainder',
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

      let ids = []
      let labels = []
      let parents = []
      let values = []
      let extras = []

      let root = this.config.root
      ids.push(root)
      labels.push(root)
      parents.push('')
      extras.push( emptyObj )
      values.push(0)

      const map = {}

      //let configKey = this.config.key
      let keys = this.config.keys
      let lastKey = keys[keys.length-1]
      arrayOfObjects.forEach(item => {

        let currentID = root
        let parentID =  ''

        keys.forEach( key => {
          parentID = currentID
          currentID += item[key]

          // First time we see this key, add to the treemap
          if (!map[currentID]) {
            map[currentID] = true

            ids.push(currentID)
            labels.push(item[key])
            parents.push(parentID)

            if(key==lastKey){

              extras.push(item)
              values.push(this.config.keyValue ? Number(item[this.config.keyValue]) : 1)

            }
            else{
              extras.push( emptyObj )
              values.push(0)
            }
          }
        })
      })

      return [{ ids, labels, parents, values, extras }]
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
