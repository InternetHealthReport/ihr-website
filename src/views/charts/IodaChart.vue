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
    async getChart() {
      const pingData = await this.getPingSlashData(this.ASN, this.StartTime, this.EndTime)
      const bgpData = await this.getBgpData(this.ASN, this.StartTime, this.EndTime)

      let pingDataDates = []
      let pingDataStart = pingData.from
      let pingDataEnd = pingData.until
      let pingDataStep = pingData.nativeStep

      // neglecting from and until timestamps
      while (pingDataStart < pingDataEnd) {
        pingDataStart += pingDataStep
        pingDataDates.push(pingDataStart)
      }

      let pingDates = []
      for (let unixDate of pingDataDates) {
        var newDate = new Date()
        newDate.setTime(unixDate * 1000)
        let dateString = newDate.toUTCString()
        pingDates.push(dateString)
      }

      // storing pingData Values
      let pingDataValues = pingData.values

      // normalizing the data
      const highestValue1 = Math.max(...pingDataValues)
      let normalizedpingDataValues = []
      for (const val of pingDataValues) {
        let normalizedVal = (val / highestValue1) * 100
        normalizedpingDataValues.push(normalizedVal)
      }

      let bgpDataDates = []
      let bgpDataStart = bgpData.from
      let bgpDataEnd = bgpData.until
      let bgpDataStep = bgpData.nativeStep

      // neglecting from and until timestamps
      while (bgpDataStart < bgpDataEnd) {
        bgpDataStart += bgpDataStep
        bgpDataDates.push(bgpDataStart)
      }

      let bgpDates = []
      for (let unixDate of bgpDataDates) {
        var newDate = new Date()
        newDate.setTime(unixDate * 1000)
        let dateString = newDate.toUTCString()

        bgpDates.push(dateString)
      }

      // storing bgpData Values
      let bgpDataValues = bgpData.values

      // normalizing the data
      const highestValue2 = Math.max(...bgpDataValues)
      let normalizedbgpDataValues = []
      for (const val of bgpDataValues) {
        let normalizedVal = (val / highestValue2) * 100
        normalizedbgpDataValues.push(normalizedVal)
      }

      // building the trace
      this.traces = [
        {
          x: pingDates,
          y: normalizedpingDataValues,
          mode: 'Scatter',
          name: 'Ping',
        },
        {
          x: bgpDates,
          y: normalizedbgpDataValues,
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
