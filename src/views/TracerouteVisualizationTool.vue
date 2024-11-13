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

const loadMeasurement = () => {
  measurementID.value = measurementIDInput.value
  pushRoute()
}

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        measurment: measurementID.value,
        probeids: probeIDs.value.join(','),
        destinationips: destinationIPs.value.join(',')
      })
    })
  )
}

onMounted(() => {
  const tracerouteid = route.query.measurment
  const probes = route.query.probeids
  const destinations = route.query.destinationips

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
})
</script>

<template>
  <div class="IHR_char-container q-ma-md">
    <h1>Traceroute Monitor</h1>
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
      :open-options="true"
      class="traceroute-monitor"
    />
  </div>
  <Feedback />
</template>

<style scoped>
.traceroute-monitor {
  margin-bottom: 20px;
}
</style>
