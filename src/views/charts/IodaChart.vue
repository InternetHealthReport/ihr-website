<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :noData="noData" :chartTitle="iodaChart" />
  </div>
</template>

<script>
import axios from 'axios'
import ReactiveChart from '../../components/ReactiveChart.vue'
import CommonChartMixin from './CommonChartMixin'
export default {
  name: 'Ioda Chart',
  mixins: [CommonChartMixin],
  components: {
    ReactiveChart,
  },
  props: {
    ASN: String,
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
    getPingSlashData: (ASN, StartTime, EndTime) => {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      return axios
        .get(
          `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=ping-slash24`
        )
        .then(response => {
          let networks = response.data
          const networksData = networks.data
          return networksData[0][0]
        })
    },
    getBgpData: (ASN, StartTime, EndTime) => {
      const startDate = new Date(StartTime)
      const startUnixTimeStamp = Math.floor(startDate.getTime() / 1000)
      const endDate = new Date(EndTime)
      const endUnixTimeStamp = Math.floor(endDate.getTime() / 1000)
      return axios
        .get(
          `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/asn/${ASN}?from=${startUnixTimeStamp}&until=${endUnixTimeStamp}&datasource=bgp`
        )
        .then(response => {
          let bgpNetworks = response.data
          const bgpNetworksData = bgpNetworks.data
          return bgpNetworksData[0][0]
        })
    },
    apiCall() {
      const pingPromise = this.getPingSlashData(this.ASN, this.startTime, this.endTime)

      console.log(this.startTime)
      console.log(this.endTime)
      let pingDataDates = []
      let pingDates = []
      let pingDataValues = []
      let normalizedpingDataValues = []
      pingPromise.then(pingData => {
        let pingDataStart = pingData.from
        let pingDataEnd = pingData.until
        let pingDataStep = pingData.nativeStep

        // neglecting from and until timestamps
        while (pingDataStart < pingDataEnd) {
          pingDataStart += pingDataStep
          pingDataDates.push(pingDataStart)
        }

        for (let unixDate of pingDataDates) {
          var newDate = new Date()
          newDate.setTime(unixDate * 1000)
          pingDates.push(newDate)
        }

        // storing pingData Values
        pingDataValues = pingData.values
        console.log(pingData)
        // normalizing the data
        const highestValue1 = Math.max(...pingDataValues)

        for (const val of pingDataValues) {
          let normalizedVal = (val / highestValue1) * 100
          normalizedpingDataValues.push(normalizedVal)
        }
      })

      let bgpDataDates = []
      let bgpDates = []
      let bgpDataValues = []
      let normalizedbgpDataValues = []
      const bgpPromise = this.getBgpData(this.ASN, this.startTime, this.endTime)
      bgpPromise.then(bgpData => {
        let bgpDataStart = bgpData.from
        let bgpDataEnd = bgpData.until
        let bgpDataStep = bgpData.nativeStep

        // neglecting from and until timestamps
        while (bgpDataStart < bgpDataEnd) {
          bgpDataStart += bgpDataStep
          bgpDataDates.push(bgpDataStart)
        }

        for (let unixDate of bgpDataDates) {
          var newDate = new Date()
          newDate.setTime(unixDate * 1000)
          bgpDates.push(newDate)
        }

        // storing bgpData Values
        bgpDataValues = bgpData.values

        // normalizing the data
        const highestValue2 = Math.max(...bgpDataValues)

        for (const val of bgpDataValues) {
          let normalizedVal = (val / highestValue2) * 100
          normalizedbgpDataValues.push(normalizedVal)
        }
      })

      Promise.all([pingPromise, bgpPromise]).then(
        // building the trace
        (this.traces = [
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
        ])
      )

      this.layout.datarevision = new Date().getTime()
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
