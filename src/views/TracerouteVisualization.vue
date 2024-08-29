<script setup>
import { ref, onMounted } from "vue"
import { QInput, QIcon, QBtn } from "quasar"
import { useRoute } from "vue-router"
import TracerouteMonitor from "@/components/TracerouteMonitor.vue"

const route = useRoute()
const measurementID = ref("")
const measurementIDInput = ref("")

const loadMeasurement = () => {
  measurementID.value = measurementIDInput.value
}

onMounted(() => {
  const tracerouteid = route.query.measurment
  if (tracerouteid) {
    measurementIDInput.value = tracerouteid
    measurementID.value = tracerouteid
  }
})
</script>

<template>
  <div class="main-container">
    <h1>Traceroute Visualization</h1>
    <QInput v-model="measurementIDInput" @keyup.enter="loadMeasurement" placeholder="Enter RIPE ATLAS traceroute measurement ID">
      <template v-slot:prepend>
        <QIcon name="web" />
      </template>
      <QBtn round dense flat :ripple="false" no-caps size="22px" @click="loadMeasurement">
        <QIcon name="search" />
      </QBtn>
    </QInput>
    <TracerouteMonitor
      :atlasMeasurementID="measurementID"
      :openOptions="true"
    />
  </div>
</template>

<style scoped>
.main-container {
    padding: 2em;
}
</style>
