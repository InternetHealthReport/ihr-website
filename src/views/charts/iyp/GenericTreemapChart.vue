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

    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }

      let handler = {
        get: function(target, name) {
          if(target.hasOwnProperty(name)) return target[name]
          // check if it is an object returned by cypher
          if(target.keys && target.keys.includes(name)) return target.get(name)
          return '';
        }
      };

      let emptyObj = new Proxy({}, handler);

      let ids = []
      let labels = []
      let parents = []
      let values = []
      let extras = []
      let parent_extra = {}
      let total = {child: 0, value: 0}
      let leafs = {}
      let ex_leaf_item = ''

      let root = this.config.root
      ids.push(root)
      labels.push(root)
      parents.push('')
      extras.push( emptyObj )
      values.push(0)
      parent_extra[root] = {'__sum_value': 0, '__sum_child': 0}

      const map = {}

      //let configKey = this.config.key
      let keys = this.config.keys
      let lastKey = keys[keys.length-1]
      arrayOfObjects.forEach(item => {

        let currentID = root
        let parentID =  ''
        let item_value = this.config.keyValue ? Number(item.get(this.config.keyValue)) : 1

        keys.forEach( key => {
          parentID = currentID
          currentID += item.get(key)

          // First time we see this key, add to the treemap
          if (!map[currentID]) {
            map[currentID] = true

            ids.push(currentID)
            labels.push(item.get(key))
            parents.push(parentID)

            if(key==lastKey){
              extras.push(new Proxy(item, handler))
              values.push(item_value)
              ex_leaf_item = item

              // Maintain stats to calculate percentage per nodes
              leafs[item.get(key)] = true
              total.child += 1
              total.value += item_value
              item['__sum_child'] = 1
              item['__sum_value'] = item_value

            }
            else{
              // Maintain stats to calculate percentage per nodes
              parent_extra[currentID] = {'__sum_value': item_value, '__sum_child': 1}
              extras.push(new Proxy(parent_extra[currentID], handler) )
              values.push(0)
            }
          }
          else{
            if(key!=lastKey){
              // Maintain stats to calculate percentage per nodes
              parent_extra[currentID].__sum_value += item_value
              parent_extra[currentID].__sum_child += 1
            }
          }
        })
      })

      // Update the total for all customdata and compute percentages
      for(let i=0; i < extras.length; i++){
        let item = extras[i]

        values[i] = item['__sum_value']

        item['__percent'] = 100*item['__sum_value']/total.value
        item['__total_child'] = total.child
        item['__total_value'] = total.value

        values[0] = item['__total_value']

        if( !leafs[labels[i]]  & labels[i]!=root ){
          if(this.config.show_percent){
            labels[i] = labels[i]+' ('+item['__percent'].toFixed(1)+'%)'
          }

          // Default customdata to empty strings to avoid displaying hovertemplate syntax
          Object.getOwnPropertyNames(ex_leaf_item).forEach( prop => {
            if( !item[prop]) item[prop] = '';
          })
        }
      }

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
