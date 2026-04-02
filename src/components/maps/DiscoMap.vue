<script setup>
import getCountryName from '@/plugins/countryName'
import { ref, watch, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { LMap, LTileLayer, LCircleMarker, LTooltip } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'

const { t } = useI18n()

const props = defineProps({
  events: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: true
  },
  yMax: {
    type: Number,
    default: 1
  }
})

const probes = ref([])
const noData = ref(t('loading'))
const zoom = ref(2)

const updateProbes = () => {
  probes.value = []
  props.events.forEach((event) => {
    let label = ''
    if (event.streamtype == 'asn') {
      label = 'AS' + event.streamname
    } else if (event.streamtype == 'country') {
      label = getCountryName(event.streamname)
    } else {
      label = event.streamname
    }
    event.discoprobes.forEach((newProbe) => {
      var start = new Date(newProbe.starttime)
      var end = new Date(newProbe.endtime)
      if (start.getTime() == end.getTime()) {
        end = new Date(event.endtime)
      }
      probes.value.push({
        label: label,
        level: newProbe.level,
        lon: newProbe.lon,
        lat: newProbe.lat,
        id: newProbe.probe_id,
        startTime: start,
        endTime: end
      })
    })
  })
  noData.value = probes.value.length === 0 && !props.loading ? t('noOutage') : false
}

const dateFormatter = (datetime) => {
  const dt = new Date(datetime)
  const options = {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }
  return dt.toLocaleDateString(undefined, options)
}

watch(
  () => props.events,
  () => {
    updateProbes()
  }
)

const traces = computed(() => {
  return probes.value.map((prob) => {
    let color = prob.level - 6
    const durationHour = Math.ceil(Math.abs(prob.endTime - prob.startTime) / (1000 * 60 * 60))
    let durationMin = Math.ceil(Math.abs(prob.endTime - prob.startTime) / (1000 * 60))
    let durationLabel = `${durationHour} hours`
    if (durationHour <= 1) {
      durationLabel = `${durationMin} min.`
    }
    if (durationMin == 0) {
      durationLabel = 'Unk.'
    }
    const probeText = `<b>${prob.label}</b><br> PB${prob.id}<br> ${dateFormatter(
      prob.startTime
    )}<br> Duration: ${durationLabel}<br> Deviation: ${prob.level}`
    if (durationMin == 0) {
      durationMin = 30
    }
    const size = Math.min(durationMin / 2, 30)
    const red = Math.min(255, 255 * (color / 5))
    const green = 255 - Math.min(255, 255 * (color / 5))
    const blue = 255 - Math.min(255, 255 * (color / 5))
    color = `rgba(${red},${green},${blue},0.2)`
    return {
      lat: prob.lat,
      lon: prob.lon,
      text: probeText,
      size: size,
      color: color
    }
  })
})
</script>

<template>
  <div style="height: 600px">
    <LMap
      v-model:zoom="zoom"
      :center="[0, 0]"
      :use-global-leaflet="false"
      :options="{ attributionControl: false, worldCopyJump: true, minZoom: 2 }"
      @ready="(map) => nextTick(() => map.invalidateSize())"
    >
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
        class="grayscale-tiles"
      ></LTileLayer>
      <LCircleMarker
        v-for="trace in traces"
        :lat-lng="[trace.lat, trace.lon]"
        :radius="trace.size"
        :color="trace.color"
        :fillOpacity="1"
      >
        <LTooltip><div v-html="trace.text" style="text-align: left"></div></LTooltip>
      </LCircleMarker>
    </LMap>
  </div>
</template>

<style scoped>
:deep(.leaflet-tile-pane) {
  filter: grayscale(100%) brightness(1.1);
}
</style>
