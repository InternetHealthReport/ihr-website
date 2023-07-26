<template>
  <div>
    <q-tabs
      class="table-card text-grey bg-grey-2"
      v-model="activeTab"
      indicator-color="secondary"
      active-color="primary"
      align="justify"
      narrow-indicator
    >
      <q-tab name="chart" label="CHART"></q-tab>
      <q-tab name="data" label="DATA"></q-tab>
      <q-tab name="api" label="API"></q-tab>
    </q-tabs>
    <q-tab-panels v-model="activeTab" animated>
      <q-tab-panel name="chart">
        <div ref="chartContainer">
          <div ref="chart"></div>
        </div>
      </q-tab-panel>
      <q-tab-panel name="data">
        <q-table :data="data" :columns="columns">
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                class="cursor-pointer"
                v-for="column in columns"
                :props="props"
                :key="column.name"
                @click.native="routeToEntity(column.name, props.row)"
              >
                {{ column.format(column.field(props.row)) }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>
      <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
        <p>{{ cypherQuery }}</p>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<script>
import Plotly from 'plotly.js-dist'

export default {
  props: {
    columns: {
      type: Array,
    },
    data: {
      type: Array,
    },
    cypherQuery: {
      type: String,
    },
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
      activeTab: 'chart',
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
    routeToEntity(entity, data) {
      console.log(entity)
      console.log(data)

      if (entity == 'ASN') {
        console.log(data.asn)
        this.routeToASN(data.asn)
      } else if (entity == 'Prefix') {
        const [host, prefixLength] = data.prefix.split('/')
        this.routeToPrefix(host, prefixLength)
      } else if (entity == 'IXP') {
        console.log(data.id)
        this.routeToIXP(data.id)
      } else if (entity == 'CC') {
        this.routeToCountry(data.cc)
      }
    },
    routeToASN(asn) {
      console.log(asn.low)
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: asn.low },
      })
    },
    routeToPrefix(host, prefixLength) {
      this.$router.push({
        name: 'iyp_prefix',
        params: { host: host, prefix_length: prefixLength },
      })
    },
    routeToIXP(id) {
      this.$router.push({
        name: 'iyp_ixp',
        params: { id: id },
      })
    },
    routeToCountry(cc) {
      this.$router.push({
        name: 'iyp_country',
        params: { cc: cc },
      })
    },
    renderChart() {
      let formattedData = this.formatChartData(this.localChartData)

      let arr = []
      for (let i = 0; i < formattedData[0].data.length; i++) {
        arr.push({ cc: formattedData[0].labels[i], data: formattedData[0].data[i] })
      }

      let sortedChartData = arr.slice().sort((a, b) => b.data - a.data)
      console.log(sortedChartData)

      const topThree = sortedChartData.slice(0, 10)
      const othersSum = sortedChartData.slice(10).reduce((sum, obj) => sum + obj.data, 0)

      let chartValues = []
      let chartLabels = []
      for (let i = 0; i < topThree.length; i++) {
        chartValues.push(topThree[i].data)
        chartLabels.push(topThree[i].cc)
      }
      chartValues.push(othersSum)
      chartLabels.push('Others')

      console.log(chartValues)
      console.log(chartLabels)

      // const sum = formattedData[0].data.reduce((acc, curr) => acc + curr, 0)
      // console.log(sum)

      const data = [
        {
          values: chartValues,
          labels: chartLabels,
          type: 'pie',
        },
      ]
      const layout = {
        height: 400,
        width: 400,
        ...this.chartLayout,
      }

      // Rendering the chart
      Plotly.newPlot(this.$refs.chart, data, layout)
    },
    formatChartData(arrayOfObjects) {
      if (!arrayOfObjects || arrayOfObjects.length === 0) {
        return []
      }
      const map = {}
      arrayOfObjects.forEach(item => {
        const countryCode = item.cc
        if (!map[countryCode]) {
          map[countryCode] = 1
        } else {
          map[countryCode]++
        }
      })
      console.log(map)
      const totalCount = Object.values(map).reduce((sum, count) => sum + count, 0)
      const percentages = Object.values(map).map(count => (count / totalCount) * 100)
      const labels = Object.keys(map)
      return [{ data: percentages, labels }]
    },
    createDiv() {
      const newDiv = document.createElement('div')
      newDiv.setAttribute('ref', 'chart')

      this.$nextTick(() => {
        const container = this.$refs.chartContainer
        container.appendChild(newDiv)
      })
    },
  },
  watch: {
    chartData: {
      handler() {
        console.log('Yep, watching')

        if (this.chartData && this.chartData.length > 0) {
          this.localChartData = this.chartData
          this.renderChart()
        }
      },
      deep: true,
    },
    activeTab: {
      handler() {
        console.log('Change of Tab')
        // if (this.activeTab == 'chart') {
        //   // this.createDiv()
        //   this.renderChart()
        // }
      },
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
</style>
