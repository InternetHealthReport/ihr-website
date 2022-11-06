<template>
  <div>
    <div style="width: 100%">
      <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :chartTitle="iodaChart" />
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import CommonChartMixin from '../../../views/charts/CommonChartMixin.vue'
import ReactiveChart from '../../../../src/components/ReactiveChart.vue'

export default {
  mixins: [CommonChartMixin],
  components: {
    ReactiveChart,
  },
  props: {
    ASN: {
      type: String,
    },
    year: {
      type: String,
    },
  },
  data() {
    var layout = {
      title: '',
      xaxis: {
        title: 'timestamp',
      },
      yaxis: {
        title: this.$t('speed-test'),
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
      axios
        .get(`https://statistics.measurementlab.net/v0/asn/${this.ASN}/${this.year}/histogram_daily_stats.json`)
        .then(response => {
          this.networks = response.data
          this.getChart(this.networks)
          console.log(this.networks)
          console.log('Method called')
        })
        .catch(error => {
          console.log(error)
          this.errorMsg = 'MLab API end point not working'
        })
    },
    getChart(networks) {
      console.log('network called')
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
  mounted: function () {
    this.apiCall()
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
</style>
