<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :noData="noData" :chartTitle="iodaChart" />
  </div>
</template>

<script>
import axios from 'axios'
import ReactiveChart from '../../components/ReactiveChart.vue'
export default {
  name: 'Ioda Chart',
  components: {
    ReactiveChart,
  },
  props: {
    ASN: String,
    StartTime: String,
    EndTime: String,
  },
  data() {
    var layout = {
      title: '',
      xaxis: {
        title: 'Timeline',
      },
      yaxis: {
        title: 'Metadata access',
      },
    }
    return {
      layout: layout,
      errorMsg: '',
      traces: [],
    }
  },
  methods: {
    getInfo(ASN, StartTime, EndTime) {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      axios
        .get(
          `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=ping-slash24`
        )
        .then(response => {
          this.networks = response.data
          const networksData = this.networks.data
          for (const networkLayer of networksData) {
            for (const network of networkLayer) {
              this.getChart(network)
              console.log(network)
            }
          }
        })
        .catch(error => {
          console.log(error)
          this.errorMsg = 'Ioda API end point is not working'
        })
    },
    getChart(network) {
      let networkDates = []
      let networkStart = network.from
      let networkEnd = network.until
      let networkStep = network.nativeStep
      // neglecting from and until timestamps
      while (networkStart < networkEnd) {
        networkStart += networkStep
        networkDates.push(networkStart)
      }

      let readableDate = []
      for (let unixDate in networkDates) {
        var newDate = new Date()
        newDate.setTime(unixDate * 1000)
        let dateString = newDate.toUTCString()

        readableDate.push(dateString)
      }

      // storing network Values
      let networkValues = network.values
      console.log(networkValues)
      const highestValue = Math.max(...networkValues)

      let normalizedNetworkValues = []
      for (const val of networkValues) {
        console.log(val, val / highestValue, highestValue)
        let normalizedVal = (val / highestValue) * 100
        normalizedNetworkValues.push(normalizedVal)
      }
      // building the trace
      this.traces = [
        {
          x: readableDate,
          y: normalizedNetworkValues,
          mode: 'Scatter',
          name: 'Ping-Slash 24',
        },
      ]
    },
  },
  mounted: function () {
    this.getInfo(this.ASN, this.StartTime, this.EndTime)
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
