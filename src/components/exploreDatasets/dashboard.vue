<template>
  <div>
    <h1>M Lab dataset</h1>
    <q-select v-model="datasetSelected" label="Select a Dataset" :options="datasets"></q-select>
    <q-select v-model="countrySelected" label="Select a country" :options="countries"></q-select>
    <q-select v-model="xSelected" label="Select X-axis" :options="xaxis"></q-select>
    <q-select v-model="ySelected" label="Select Y-axis" :options="yaxis"></q-select>
    <q-select v-model="yearSelected" label="Select Year" :options="years"></q-select>
    <button @click="search(yearSelected)">Search</button>
    <!-- <div v-for="network in networks" :key="network.id">
      <h3>{{ network.date }} - {{ network.dl_LOG_AVG_rnd1 }}</h3>
    </div> -->
    <reactive-chart :layout="layout" :traces="traces" :no-data="noData" :chartTitle="MLab" />
  </div>
</template>

<script>
import axios from 'axios'
import ReactiveChart from '../ReactiveChart.vue'
import { NET_DELAY_LAYOUT } from '../../views/charts/layouts'
export default {
  name: 'Exploratory Dashboard',
  components: {
    ReactiveChart,
  },
  data() {
    var countries = ['India', 'Japan', 'Nepal', 'France']
    var datasets = ['D1', 'D2', 'D3']
    var xaxis = ['X1', 'X2', 'X3']
    var yaxis = ['Y1', 'Y2', 'Y3']
    var years = ['2019', '2020', '2021']
    // change the layout according to the map
    var layout = {
      title: 'Line and Scatter Plot',
    }
    return {
      countries: countries,
      countrySelected: null,
      datasets: datasets,
      datasetSelected: null,
      xaxis: xaxis,
      xSelected: null,
      yaxis: yaxis,
      ySelected: null,
      years: years,
      yearSelected: null,
      networks: [],
      errorMsg: '',
      layout: layout,
      traces: [],
    }
  },
  methods: {
    search(yearSelected) {
      this.getInfo(yearSelected)
      console.log('******************SEARCH FUNCTION IS CALLED**********')
    },
    getInfo(yearSelected) {
      console.log(yearSelected)
      console.log('******************GET INFO FUNCTION IS CALLED**********')
      axios
        .get('https://statistics.measurementlab.net/v0/NA/US/US-MD/2020/histogram_daily_stats.json')
        .then(response => {
          // console.log(response.data)
          this.networks = response.data
          this.getChart(this.networks)
        })
        .catch(error => {
          console.log(error)
          this.errorMsg = 'MLab API end point not working'
        })
    },
    getChart(networks) {
      console.log('******************GET CHART FUNCTION IS CALLED**********')
      console.log(networks[0].date)
      let arr1 = []
      networks.forEach(network => {
        arr1.push(network.date)
      })
      let arr2 = []
      networks.forEach(network => {
        arr2.push(network.bucket_max)
      })
      this.traces = [
        {
          x: arr1,
          y: arr2,
          mode: 'scatter',
        },
      ]
      console.log(this.networks.date)
      // this.traces = [
      //   {
      //     x: [1, 2, 3, 4],
      //     y: [16, 5, 11, 9],
      //     mode: 'scatter',
      //   },
      // ]
      console.log(this.traces.x)
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
