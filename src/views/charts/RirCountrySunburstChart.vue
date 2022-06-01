<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :chartTitle="chartTitle" />
  </div>
</template>

<script>
import CommonChartMixin from './CommonChartMixin'
import { RIR_COUNTRY_SUNBURST_LAYOUT } from './layouts'

const colors = new Map([
  ['ARIN', '#e41a1c'],
  ['RIPE NCC', '#377eb8'],
  ['APNIC', '#4daf4a'],
  ['AFRINIC', '#984ea3'],
  ['LACNIC', '#ff7f00'],
  ['Other', '#8C564B'],
])

export default {
  name: 'RirCountrySunburstChart',
  mixins: [CommonChartMixin],
  props: {
    data: {
      type: Array,
      require: true,
    },
  },
  data() {
    return {
      traces: [],
      layout: { ...RIR_COUNTRY_SUNBURST_LAYOUT, sunburstcolorway: [] },
      chartTitle: null,
    }
  },
  watch: {
    data(newData) {
      const labels = ['Total']
      const parents = ['']
      const values = [0]
      const hovertext = ['']
      var total = 0
      var rir_values = []
      for (const [label, parent, value, htext] of newData) {
        labels.push(label)
        parents.push(parent)
        values.push(value)
        hovertext.push(htext)
        if (parent != 'Total') {
          total += value
        } else {
          rir_values.push([value, label])
        }
      }
      // We need to know the order of the RIRs to assign the colorway in the correct order...
      rir_values.sort(function (a, b) {
        return b[0] - a[0]
      })
      for (const rir of rir_values) {
        this.layout.sunburstcolorway.push(colors.get(rir[1]))
      }
      values[0] = total
      if (total == 0) {
        this.noData = 'No data available.'
      }
      this.traces = [{ type: 'sunburst', labels, parents, values, hovertext, branchvalues: 'total' }]
    },
  },
}
</script>
