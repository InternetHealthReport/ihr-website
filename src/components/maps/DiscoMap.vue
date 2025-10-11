<script setup>
import ReactiveChart from '../charts/ReactiveChart.vue'
import { COMMON_FEATURE } from '@/plugins/layouts/layoutsChart.js'
import getCountryName from '@/plugins/countryName'
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'

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

const layout = ref({
  ...COMMON_FEATURE,
  geo: {
    showframe: false,
    showcoastlines: false,
    showland: true,
    landcolor: 'rgb(215, 215, 215)',
    countrycolor: 'rgb(235, 235, 235)',
    showcountries: true
  }
})
const probes = ref([])
const noData = ref(t('loading'))

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
  let latitudes = []
  let longitudes = []
  let sizes = []
  let colors = []
  let text = []
  probes.value.forEach((prob) => {
    latitudes.push(prob.lat)
    longitudes.push(prob.lon)
    let color = prob.level - 6
    let durationHour = Math.ceil(Math.abs(prob.endTime - prob.startTime) / (1000 * 60 * 60))
    let durationMin = Math.ceil(Math.abs(prob.endTime - prob.startTime) / (1000 * 60))
    let durationLabel = `${durationHour} hours`
    if (durationHour <= 1) {
      durationLabel = `${durationMin} min.`
    }
    if (durationMin == 0) {
      durationLabel = 'Unk.'
    }
    let probeText = `<b>${prob.label}</b><br> PB${prob.id}<br> ${dateFormatter(
      prob.startTime
    )}<br> Duration: ${durationLabel}<br> Deviation: ${prob.level}`
    text.push(probeText)
    if (durationMin == 0) {
      durationMin = 30
    }
    sizes.push(Math.min(durationMin / 2, 30))
    const red = Math.min(255, 255 * (color / 5))
    const green = 255 - Math.min(255, 255 * (color / 5))
    const blue = 255 - Math.min(255, 255 * (color / 5))
    colors.push(`rgba(${red},${green},${blue},0.1)`)
  })
  return [
    {
      type: 'scattergeo',
      mode: 'markers',
      lat: latitudes,
      lon: longitudes,
      hoverinfo: 'text',
      text: text,
      marker: {
        size: sizes,
        color: colors,
        line: {
          color: 'black',
          width: 1
        }
      },
      name: 'world events'
    }
  ]
})
</script>

<template>
  <div class="IHR_disco-chart">
    <ReactiveChart
      :layout="layout"
      :traces="traces"
      :no-data="noData"
      :disable-c-v-d="true"
      :y-max="yMax"
    />
  </div>
</template>
