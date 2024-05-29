<script setup>
import { ref, onMounted, inject } from 'vue';
const atlas_api = inject('atlas_api');
const measurementID = ref('');
const measurementResult = ref(null);

const loadMeasurement = async () => {
  if (measurementID.value.trim()) {
    measurementResult.value = await atlas_api.getMeasurementDataById(measurementID.value);
  }
};

onMounted(() => {
  // Pre-load any initial data or setups here
});

</script>

<template>
  <div>
    <h1>[GSoC24] Traceroute visualization</h1>
    <input v-model="measurementID" placeholder="Enter Measurement ID" @keyup.enter="loadMeasurement">
    <button @click="loadMeasurement">Confirm</button>
    <pre v-if="measurementResult">{{ measurementResult }}</pre>
  </div>
</template>

<style lang="stylus" scoped>
</style>
