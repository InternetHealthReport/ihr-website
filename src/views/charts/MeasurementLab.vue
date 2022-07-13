<template>
  <div>
    <h1>M Lab dataset</h1>
    <button @click="getInfo(Year)">Get Chart</button>
    <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :chartTitle="MLab" />
    <!-- <h1>Start date is: {{Year}} {{AS}}</h1> -->
  </div>
</template>

<script>
import axios from 'axios'
import ReactiveChart from '../../components/ReactiveChart.vue'
export default {
  name: 'Measurement Lab Network',
  components: {
    ReactiveChart,
  },
  props:{
    AS:String,
    Year:String,
  },
  data() {
    var layout = {
      title: 'Line and Scatter Plot',
    }
    return {
      networks: [],
      errorMsg: '',
      layout: layout,
      traces: [],
    }
  },
  methods: {
    getInfo(Year) {
      axios
        .get(`https://statistics.measurementlab.net/v0/NA/US/US-MD/${Year}/histogram_daily_stats.json`)
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
      let networkBuckets = []
      networks.forEach(network => {
        networkBuckets.push(network.bucket_max)
      })
      this.traces = [
        {
          x: networkDates,
          y: networkBuckets,
          mode: 'box',
        },
      ]
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>