<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :ref="myId" />
  </div>
</template>

<script>
import axios from 'axios'
import CommonChartMixin from '../../../views/charts/CommonChartMixin.vue'

export default {
  mixins: [CommonChartMixin],
  props: {
    ASN: {
      type: Number,
      required: true,
    },
  },
  data() {
    var layout = {
      yaxis: {
        title: this.$t('charts.speedtest.yaxis'),
        rangemode: 'tozero',
      },
    }
    return {
      networks: [],
      errorMsg: '',
      layout: layout,
      traces: [],
    }
  },
  methods: {
    apiCall() {
      let year = this.endTime.getFullYear()
      axios
        .get(`https://statistics.measurementlab.net/v0/asn/${this.ASN}/${year}/histogram_daily_stats.json`)
        .then(response => {
          this.networks = response.data
          this.getChart(this.networks)
        })
        .catch(error => {
          console.log(error)
          this.errorMsg = 'MLab API end point not working'
        })
    },
    getChart(networks) {
      let networkDates = []
      networks.forEach(network => {
        networkDates.push(network.date)
      })

      let networkDownload = []
      networks.forEach(network => {
        networkDownload.push(network.download_AVG)
      })

      let networkUpload = []
      networks.forEach(network => {
        networkUpload.push(network.upload_AVG)
      })

      this.traces = [
        {
          x: networkDates,
          y: networkDownload,
          mode: 'scatter',
          name: 'Download',
        },
        {
          x: networkDates,
          y: networkUpload,
          mode: 'scatter',
          name: 'Upload',
        },
      ]
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
</style>
