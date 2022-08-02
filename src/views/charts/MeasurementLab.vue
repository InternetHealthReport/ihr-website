<template>
  <div>
    <reactive-chart
     :layout="layout" 
     :traces="traces" 
     :no-data="noData" 
     :chartTitle="MLab"
    />
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
    ASN:String,
    Year:String,
  },
  data() {
    var layout = {
     // title: 'Measurement lab dataset of time vs timeline',
      xaxis:{
        title:"Timeline",
      },
      yaxis:{
        title:"Download and Upload Speed comparison"
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
    getInfo(Year,ASN) {
      axios
        .get(`https://statistics.measurementlab.net/v0/asn/${ASN}/${Year}/histogram_daily_stats.json`)
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
      networks.forEach(network =>{
        networkUpload.push(network.upload_AVG)
      })

      this.traces = [
        {
          x: networkDates,
          y: networkDownload,
          mode: 'scatter',
          name:'Download'
        },
        {
          x: networkDates,
          y: networkUpload,
          mode: 'scatter',
          name:'Upload'
        },
      ]
    },
  },
 mounted:function(){
    this.getInfo(this.Year,this.ASN);
 }
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>