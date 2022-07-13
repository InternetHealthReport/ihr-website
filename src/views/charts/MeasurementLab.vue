<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :chartTitle="MLab" />
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
      title: 'Measurement lab dataset of time vs timeline',
      xaxis:{
        title:"Timeline",
      },
      yaxis:{
        title:"Bucket Max"
      }
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
 mounted:function(){
    this.getInfo(this.Year);
 }
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>