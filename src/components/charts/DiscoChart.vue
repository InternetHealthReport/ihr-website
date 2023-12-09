<script setup>
import { DiscoEventQuery } from '@/plugins/IhrApi.js'
import { ref, inject, watch, onMounted } from 'vue'
import { DISCO_LAYOUT } from '@/plugins/layouts/layoutsChart.js'
import { DEFAULT_DISCO_AVG_LEVEL, DEFAULT_MIN_DISCO_DURATION } from '@/plugins/disco.js'
import i18n from '@/i18n'
import DiscoMap from '../maps/DiscoMap.vue'

const ihr_api = inject('ihr_api')

const { t } = i18n.global

const props = defineProps({
  minAvgLevel: {
    default: DEFAULT_DISCO_AVG_LEVEL
  },
  streamName: {
    type: Number,
    default: ''
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  fetch: {
    type: Boolean
  }
})

const emits = defineEmits({
  'prefix-details': (event) => {
    if (event !== null) {
      return true
    } else {
      console.warn('Event is missing!')
      return false
    }
  },
  'filteredRows': (filteredSearchRowValues) => {
    if (filteredSearchRowValues !== null) {
      return true
    } else {
      console.warn('FilteredSearchRowValues is missing')
      return false
    }
  }
})

const mapData = ref([])
const dataEvents = ref([])
const details = ref({
  activeTab: 'probes',
  tableVisible: false,
  data: [],
  eventid: null,
  probes: [],
  filter: null,
  loading: true,
})
const filters = ref([new DiscoEventQuery().streamName(props.streamName).timeInterval(props.startTime, props.endTime).orderedByTime()])
const traces = ref([
  {
    x: [],
    y: [],
    z: [],
    yaxis: 'y',
    name: '',
    showlegend: false,
    line: { shape: 'hv' },
  },
])
const layout = ref(DISCO_LAYOUT)
const loading = ref(false)

traces.value[0].name = layout.value.yaxis.title = t('charts.disconnections.table.yaxis')

const duration = (start, end, nonzero) => {
  const durationMin = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60))

  if (durationMin == 0) {
    return nonzero
  }

  return durationMin
}

const apiCall = () => {
  filters.value[0].streamName(props.streamName).timeInterval(props.startTime, props.endTime).avgLevel(props.minAvgLevel, DiscoEventQuery.GTE)
  loading.value = true
  ihr_api.disco_events(
    filters.value[0],
    result => {
      const events = []
      result.results.forEach(event => {
        event.duration = duration(event.starttime, event.endtime, 0)
        if (event.duration > DEFAULT_MIN_DISCO_DURATION || event.duration == 0) {
          events.push(event)
        }
      })
      dataEvents.value = events
      mapData.value = events
      loading.value = false
      // emits('disco-alarms-data-loaded', result.results)
    },
    error => {
      console.error(error) //FIXME do a correct alert
    }
  )
}

const filteredRows = () => {
  mapData.value = data[1]
  emits('filteredRows', data)
}

watch(() => props.minAvgLevel, () => {
  filters.value.forEach(filter => {
    filter.avgLevel(newValue, DiscoEventQuery.GTE)
  })
  apiCall()
})

watch(() => props.endTime, () => {
  apiCall()
})

onMounted(() => {
  apiCall()
})
</script>

<template>
  <div class="IHR_chart">
    <div>
      <DiscoMap :events="mapData" ref="ihrChartMap" :loading="loading" />
      <!-- <disco-alarms-table
        :start-time="startTime"
        :stop-time="endTime"
        :data="dataEvents"
        :loading="loading"
        :filter="filterValue"
        @filteredRows="filteredRows"
        @prefix-details="$emit('prefix-details', $event)"
      /> -->
    </div>
  </div>
</template>