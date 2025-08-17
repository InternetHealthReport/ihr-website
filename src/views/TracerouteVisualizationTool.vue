<script setup>
import { ref, onMounted } from 'vue'
import { QBadge } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import TracerouteMonitor from '@/components/TracerouteMonitor.vue'
import Tr from '@/i18n/translation'
import '@/styles/chart.css'
import Feedback from '@/components/Feedback.vue'

const route = useRoute()
const router = useRouter()
const measurementID = ref('')
const probeIDs = ref([])
const destinationIPs = ref([])
const startTime = ref('')
const stopTime = ref('')

const loadMeasurement = (measurementIDInput) => {
  if (measurementID.value == measurementIDInput) {
    return
  }

  // Update when value is changed
  measurementID.value = measurementIDInput

  // Clear the previous route values on loading a new measurement
  probeIDs.value = []
  destinationIPs.value = []
  startTime.value = ''
  stopTime.value = ''
  pushRoute()
}

const onUpdateProbesInRoute = (probeIds) => {
  probeIDs.value = probeIds
  pushRoute()
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
        'probe-ids': probeIDs.value.join(','),
        'destination-ips': destinationIPs.value.join(','),
        'start-time': startTime.value,
        'end-time': stopTime.value
      })
    })
  )
}

onMounted(() => {
  const tracerouteid = route.query['measurment']
  const probes = route.query['probe-ids']
  const destinations = route.query['destination-ips']
  const startTimeFromQuery = route.query['start-time']
  const stopTimeFromQuery = route.query['end-time']

  if (tracerouteid) {
    measurementID.value = tracerouteid
  }

  if (probes) {
    probeIDs.value = probes.split(',')
  }

  if (destinations) {
    destinationIPs.value = destinations.split(',')
  }

  if (startTimeFromQuery) {
    startTime.value = startTimeFromQuery
  }

  if (stopTimeFromQuery) {
    stopTime.value = stopTimeFromQuery
  }
})
</script>

<template>
  <div class="IHR_char-container">
    <h1 class="text-center q-pa-xl">
      Traceroute Monitor
    </h1>
    <TracerouteMonitor
      :atlas-measurement-i-d="measurementID"
      :probe-i-ds="probeIDs"
      :destination-i-ps="destinationIPs"
      :start-time="startTime"
      :stop-time="stopTime"
      :is-component="false"
      class="q-mb-lg q-mt-lg"
      @set-selected-probes="onUpdateProbesInRoute"
      @set-selected-destinations="onUpdateDestinationsInRoute"
      @set-selected-time-range="onUpdateTimeRangeInRoute"
      @load-measurement="loadMeasurement"
    />
  </div>
  <Feedback />
</template>

<style scoped>
.overflow-badge {
  width: 100%;
}
</style>
