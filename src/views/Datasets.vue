<template>
  <div>
    <h1>Datasets</h1>
    <button @click="getNetworks">Get Networks</button>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      networks: [],
    };
  },
  methods: {
    getNetworks() {
      axios
        .get(
          "https://statistics.measurementlab.net/v0/NA/US/US-MD/2020/histogram_daily_stats.json"
        )
        .then((response) => {
          console.log(response.data);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>

<style></style>
