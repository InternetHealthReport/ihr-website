<template>
  <div>
    <h1>Exploratory Dashboard</h1>
    <q-select v-model="datasetSelected" label="Select a Dataset" :options="datasets"></q-select>
    <q-select v-model="countrySelected" label="Select a country" :options="countries"></q-select>
    <q-select v-model="xSelected" label="Select X-axis" :options="xaxis"></q-select>
    <q-select v-model="ySelected" label="Select Y-axis" :options="yaxis"></q-select>
    <q-select v-model="yearSelected" label="Select Year" :options="years"></q-select>
    <button @click="getInfo(yearSelected)">Search</button>
  </div>
</template>

<script>
export default {
  name: 'Exploratory Dashboard',
  data() {
    var countries = ['India', 'Japan', 'Nepal', 'France']
    var datasets = ['D1', 'D2', 'D3']
    var xaxis = ['X1', 'X2', 'X3']
    var yaxis = ['Y1', 'Y2', 'Y3']
    var years = ['2019', '2020', '2021']
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
    }
  },
  methods: {
    getInfo(yearSelected) {
      console.log(yearSelected)
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
