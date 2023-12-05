<script setup>
// import { DiscoEventQuery } from '@/plugins/IhrApi.js'
// import { ref, inject } from 'vue'
// import { DISCO_LAYOUT } from '@/plugins/layouts/layoutsChart.js'
import { DEFAULT_DISCO_AVG_LEVEL, DEFAULT_MIN_DISCO_DURATION } from '@/plugins/disco.js'

// const ihr_api = inject('ihr_api')

// const props = defineProps({
//   minAvgLevel: {
//     default: DEFAULT_DISCO_AVG_LEVEL
//   },
//   streamName: {
//     type: Number,
//     required: true,
//     default: ''
//   }
// })

// const emits = defineEmits({
//   'prefix-details': (event) => {
//     if (event !== null) {
//       return true
//     } else {
//       console.warn('Event is missing!')
//       return false
//     }
//   },
//   'filteredRows': (filteredSearchRowValues) => {
//     if (filteredSearchRowValues !== null) {
//       return true
//     } else {
//       console.warn('FilteredSearchRowValues is missing')
//       return false
//     }
//   }
// })

// const mapData = ref([])
// const dataEvents = ref([])
// const details = ref({
//   activeTab: 'probes',
//   tableVisible: false,
//   data: [],
//   eventid: null,
//   probes: [],
//   filter: null,
//   loading: true,
// })
// const filters = ref(filter)
// const traces = ref([
//   {
//     x: [],
//     y: [],
//     z: [],
//     yaxis: 'y',
//     name: '',
//     showlegend: false,
//     line: { shape: 'hv' },
//   },
// ])
// const layout = ref(DISCO_LAYOUT)
</script>

<template>
  <!-- <div class="IHR_chart">
    <div>
      <disco-map :events="mapData" ref="ihrChartMap" :loading="loading" />
      <disco-alarms-table
        :start-time="startTime"
        :stop-time="endTime"
        :data="dataEvents"
        :loading="loading"
        :filter="filterValue"
        @filteredRows="filteredRows"
        @prefix-details="$emit('prefix-details', $event)"
      />
    </div>
  </div> -->
</template>