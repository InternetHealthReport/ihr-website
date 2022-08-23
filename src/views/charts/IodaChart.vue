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
      xaxis: {},
      yaxis: {
        title: 'Rechability of /24s (%)',
      },
    }
    return {
      layout: layout,
      errorMsg: '',
      traces: [],
    }
  },
  methods: {
    getPingSlashData: async (ASN, StartTime, EndTime) => {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      const response = await axios.get(
        `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=ping-slash24`
      )
      let networks = response.data
      const networksData = networks.data

      for (const networkLayer of networksData) {
        for (const network of networkLayer) {
          return network
        }
      }
    },
    getBgpData: async (ASN, StartTime, EndTime) => {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      const response = await axios.get(
        `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=bgp`
      )
      let bgpNetworks = response.data
      const bgpNetworksData = bgpNetworks.data
      for (const networkLayer of bgpNetworksData) {
        for (const network of networkLayer) {
          return network
        }
      }
    },
    getBgpData: async (ASN, StartTime, EndTime) => {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      const response = await axios.get(
        `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=bgp`
      )
      let bgpNetworks = response.data
      const bgpNetworksData = bgpNetworks.data
      for (const networkLayer of bgpNetworksData) {
        for (const network of networkLayer) {
          return network
        }
      }
    },
    async getChart() {
      const network1 = await this.getPingSlashData(this.ASN, this.StartTime, this.EndTime)
      const network2 = await this.getBgpData(this.ASN, this.StartTime, this.EndTime)
      let network1Dates = []
      let network1Start = network1.from
      let network1End = network1.until
      let network1Step = network1.nativeStep
      // neglecting from and until timestamps
      while (network1Start < network1End) {
        network1Start += network1Step
        network1Dates.push(network1Start)
      }

      let readableDate1 = []
      for (let unixDate in network1Dates) {
        var newDate = new Date()
        newDate.setTime(unixDate * 1000)
        let dateString = newDate.toUTCString()

        readableDate1.push(dateString)
      }

      // storing network1 Values
      let network1Values = network1.values

      // normalizing the data
      const highestValue1 = Math.max(...network1Values)
      let normalizedNetwork1Values = []
      for (const val of network1Values) {
        let normalizedVal = (val / highestValue1) * 100
        normalizedNetwork1Values.push(normalizedVal)
      }

      let network2Dates = []
      let network2Start = network2.from
      let network2End = network2.until
      let network2Step = network2.nativeStep
      // neglecting from and until timestamps
      while (network2Start < network2End) {
        network2Start += network2Step
        network2Dates.push(network2Start)
      }

      let readableDate2 = []
      for (let unixDate in network2Dates) {
        var newDate = new Date()
        newDate.setTime(unixDate * 1000)
        let dateString = newDate.toUTCString()

        readableDate2.push(dateString)
      }

      // storing network2 Values
      let network2Values = network2.values

      // normalizing the data
      const highestValue2 = Math.max(...network2Values)
      let normalizedNetwork2Values = []
      for (const val of network2Values) {
        let normalizedVal = (val / highestValue2) * 100
        normalizedNetwork2Values.push(normalizedVal)
      }

      // building the trace
      this.traces = [
        {
          x: readableDate1,
          y: normalizedNetwork1Values,
          mode: 'Scatter',
          name: 'Ping',
        },
        {
          x: readableDate2,
          y: normalizedNetwork2Values,
          mode: 'Scatter',
          name: 'BGP',
        },
      ]
    },
  },
  mounted: function () {
    this.getChart()
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
