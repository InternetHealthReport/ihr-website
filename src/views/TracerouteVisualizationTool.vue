<script setup>
import { ref, onMounted } from "vue"
import { QInput, QIcon, QBtn } from "quasar"
import { useRoute, useRouter } from "vue-router"
import TracerouteMonitor from "@/components/TracerouteMonitor.vue"
import Tr from '@/i18n/translation'

const route = useRoute()
const router = useRouter()
const measurementID = ref("")
const measurementIDInput = ref("")

const loadMeasurement = () => {
  measurementID.value = measurementIDInput.value
  pushRoute()
}

const pushRoute = () => {
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      measurment: measurementID.value,
    })
  }))
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
  <div class="IHR_char-container">
    <h1>Traceroute Monitor</h1>
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
      class="traceroute-monitor"
    />
  </div>
</template>

<style scoped>
.traceroute-monitor{
  margin-bottom: 20px;
}
</style>
