<template>
  <div>
    <h1>M Lab dataset</h1>
    <q-select v-model="datasetSelected" label="Select a Dataset" :options="datasets"></q-select>
    <q-select v-model="countrySelected" label="Select a country" :options="countries"></q-select>
    <q-select v-model="xSelected" label="Select X-axis" :options="xaxis"></q-select>
    <q-select v-model="ySelected" label="Select Y-axis" :options="yaxis"></q-select>
    <q-select v-model="yearSelected" label="Select Year" :options="years"></q-select>
    <button @click="search(yearSelected)">Search</button>
    <div v-for="network in networks" :key="network.id">
      <h3>{{ network.date }} - {{ network.dl_LOG_AVG_rnd1 }}</h3>
    </div>
    <reactive-chart :layout="layout" :traces="traces" @plotly-click="showTable" :ref="myId" :no-data="noData" :yMax="yMax" />
  </div>
</template>

<script>
import axios from 'axios'
import ReactiveChart from '../ReactiveChart.vue'
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
    //var layout = NET_DELAY_LAYOUT
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
    }
  },
  methods: {
    search(yearSelected) {
      this.getInfo(yearSelected)
    },
    getInfo(yearSelected) {
      console.log(yearSelected)
      axios
        .get('https://statistics.measurementlab.net/v0/NA/US/US-MD/2020/histogram_daily_stats.json')
        .then(response => {
          console.log(response.data)
          this.networks = response.data
        })
        .catch(error => {
          console.log(error)
          this.errorMsg = 'MLab API end point not working'
        })
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
