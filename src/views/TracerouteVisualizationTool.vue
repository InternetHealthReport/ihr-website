<script setup>
import { ref, onMounted } from 'vue'
import { QInput, QBtn, QCard, QCardSection, QCardActions, QBadge } from 'quasar'
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
const startTime = ref('')
const stopTime = ref('')

const loadMeasurement = () => {
  if (measurementID.value == measurementIDInput.value) {
    return
  }

  // Update when value is changed
  measurementID.value = measurementIDInput.value

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
    measurementIDInput.value = tracerouteid
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
    <h1 class="text-center q-pa-xl">Traceroute Monitor</h1>
    <QCard>
      <QCardSection>
        <div class="row justify-end">
          <div class="col q-mr-md">
            <QInput
              v-model="measurementIDInput"
              outlined
              placeholder="RIPE ATLAS traceroute measurement ID"
              :dense="true"
              color="accent"
            />
          </div>
          <div class="col-auto">
            <QBtn label="Load" color="primary" @click="loadMeasurement" />
          </div>
        </div>
      </QCardSection>
    </QCard>
    <QBadge v-if="isProbesOverflow" color="red" class="q-mt-lg overflow-badge">
      <div class="text-body2">
        <div class="text-weight-bold">
          RIPE ATLAS Measurement ID
          <QBadge color="primary" class="text-weight-bold">{{ measurementID }}</QBadge>
        </div>
        This measurement is a large one. Here are a few important points to note about large
        measurements:
        <ul>
          <li>
            There are more than 1,000 probes involved in this measurement. Currently, the
            application limits the number of probes displayed to 1,000.
          </li>
          <li>
            Updating the RTT chart's time slider will prompt the application to load a larger amount
            of data, which may result in increased latency.
          </li>
        </ul>
      </div>
    </QBadge>
    <TracerouteMonitor
      :atlas-measurement-i-d="measurementID"
      :probe-i-ds="probeIDs"
      :destination-i-ps="destinationIPs"
      :start-time="startTime"
      :stop-time="stopTime"
      :open-options="true"
      class="q-mb-lg q-mt-lg"
      @set-selected-probes="onUpdateProbesInRoute"
      @set-selected-destinations="onUpdateDestinationsInRoute"
      @set-selected-time-range="onUpdateTimeRangeInRoute"
      @probes-overflow="onProbesOverflow"
    />
  </div>
  <Feedback />
</template>

<style scoped>
.overflow-badge {
  width: 100%;
}
</style>
