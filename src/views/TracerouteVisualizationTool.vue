<script setup>
import { ref, onMounted } from 'vue'
import { QInput, QIcon, QBtn } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import TracerouteMonitor from '@/components/TracerouteMonitor.vue'
import Tr from '@/i18n/translation'
import '@/styles/chart.css'
import Feedback from '@/components/Feedback.vue'

const route = useRoute()
const router = useRouter()
const measurementID = ref('')
const measurementIDInput = ref('')
const probeIDs = ref([])
const destinationIPs = ref([])
const isProbesOverflow = ref(false)
const startTime = ref(0)
const stopTime = ref(0)

const loadMeasurement = () => {
  if(measurementID.value == measurementIDInput.value) {
    return
  }

  // Update when value is changed
  measurementID.value = measurementIDInput.value
  
  // Clear the previous route values on loading a new measurement
  probeIDs.value.length = 0
  destinationIPs.value.length = 0
  pushRoute()
}

const onUpdateProbesInRoute = (probeIds) => {
  probeIDs.value = probeIds
  pushRoute()
}

const onProbesOverflow = (showAlert) => {
  isProbesOverflow.value = showAlert
}

const onUpdateTimeRangeInRoute = ({ startTime: startTimeInput, stopTime: endTimeInput }) => {
  startTime.value = startTimeInput
  stopTime.value = endTimeInput
  pushRoute()
}

const onUpdateDestinationsInRoute = (destinationIps) => {
  destinationIPs.value = destinationIps
  pushRoute()
}

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        measurment: measurementID.value,
        probeids: probeIDs.value.join(','),
        destinationips: destinationIPs.value.join(','),
        starttime: startTime.value,
        stoptime: stopTime.value,
      })
    })
  )
}

onMounted(() => {
  const tracerouteid = route.query.measurment
  const probes = route.query.probeids
  const destinations = route.query.destinationips
  const startTimeFromQuery = route.query.starttime
  const stopTimeFromQuery = route.query.stoptime

  if (tracerouteid) {
    measurementIDInput.value = tracerouteid
    measurementID.value = tracerouteid
  }

  if (probes) {
    probeIDs.value = probes.split(',')
  }

  if (destinations) {
    destinationIPs.value = destinations.split(',')
  }

  if(startTimeFromQuery) {
    startTime.value = startTimeFromQuery
  }

  if(stopTimeFromQuery) {
    stopTime.value = stopTimeFromQuery
  }
})
</script>

<template>
  <div class="IHR_char-container q-ma-md">
    <h1>Traceroute Monitor</h1>
    <p v-if="isProbesOverflow" class="probes-overflow">
      The selected measurement: {{measurementID}} is a large measurement. Few points to be noted aboot a large measurement:<br />
      - There are more than 1000 probes in a measurement, Currently the app limits the number to 1000. <br />
      - Updating the RTT chart's time slider will make the app try to load a larger amount of data, resulting in latency. 
    </p>
    <QInput
      v-model="measurementIDInput"
      placeholder="Enter RIPE ATLAS traceroute measurement ID"
      @keyup.enter="loadMeasurement"
    >
      <template #prepend>
        <QIcon name="web" />
      </template>
      <QBtn round dense flat :ripple="false" no-caps size="22px" @click="loadMeasurement">
        <QIcon name="search" />
      </QBtn>
    </QInput>
    <TracerouteMonitor
      :atlas-measurement-i-d="measurementID"
      :probe-i-ds="probeIDs"
      :destination-i-ps="destinationIPs"
      :start-time="startTime"
      :stop-time="stopTime"
      :open-options="true"
      class="traceroute-monitor"
      @set-selected-probes="onUpdateProbesInRoute"
      @set-selected-destinations="onUpdateDestinationsInRoute"
      @set-selected-time-range="onUpdateTimeRangeInRoute"
      @probes-overflow="onProbesOverflow"
    />
  </div>
  <Feedback />
</template>

<style scoped>
.traceroute-monitor {
  margin-bottom: 20px;
}
.probes-overflow {
  color: red;
}
</style>
