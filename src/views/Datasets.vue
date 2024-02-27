<template>
  <div>
    <h1>Datasets</h1>
    <button @click="getNetworks">Get Networks</button>
    <h3 v-if="errorMsg">{{ errorMsg }}</h3>
    <div v-for="network in networks" :key="network.id">
      <h3>{{ network.date }} - {{ network.country_code }}</h3>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      networks: [],
      errorMsg: "",
    };
  },
  methods: {
    getNetworks() {
      axios
        .get(
          "https://statttistics.measurementlab.net/v0/NA/US/US-MD/2020/histogram_daily_stats.json"
        )
        .then((response) => {
          console.log(response.data);
          this.networks = response.data;
        })
        .catch((error) => {
          console.log(error);
          this.errorMsg = "MLab API end point not working";
        });
    },
  },
};
</script>

<style></style>
