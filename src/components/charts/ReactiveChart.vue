<script setup>
import Plotly from 'plotly.js-dist'
import { ref, onMounted, watch } from 'vue'
import { uid } from 'quasar'
import { set, get } from 'idb-keyval'

// Define props (no changes made to existing props)
const props = defineProps({
  layout: { type: Object, required: true },
  traces: { type: Array, required: true },
  chartTitle: { type: String, default: null },
  noData: { required: false, default: false },
  yMax: { type: Number, default: 0 }
})

// Define event emits (kept unchanged)
const emits = defineEmits(['plotly-click', 'loaded', 'plotly-legend-click', 'plotly-time-filter', 'plotly-relayout'])

const created = ref(false)
const myId = ref(`ihrReactiveChart${uid()}`)
const layoutLocal = ref({ ...props.layout })

// Updated color palettes for different CVD modes (new feature)
const colorPalettes = {
  None: null, // Uses default Plotly colors
  Protanopia: ['#ffe41c', '#aabdff', '#3c360f', '#c8b317', '#19376a', '#8f8c8b', '#d7c997', '#648ceb', '#505b80', '#7e711b'],
  Deuteranopia: ['#ffd592', '#b0bcf9', '#c09300', '#679bf2', '#ffeafd', '#f6c600', '#918694', '#674f00', '#253d60', '#6f6367'],
  Tritanopia: ['#fd6e74', '#cbefff', '#bfa9b6', '#cc1600', '#228791', '#67656c', '#660b00', '#79eeff', '#173033', '#ffc0cd']
}

const selectedMode = ref('None')

// Dropdown visibility toggle
const showDropdown = ref(false)

// Function to render the Plotly chart (unchanged, just uses updated `layoutLocal` and `props.traces`)
const react = () => {
  if (!created.value) {
    console.error('SHOULD NEVER HAPPEN')
  }
  // Use props.traces instead of sampleTraces
  Plotly.react(myId.value, props.traces, props.layout)
}

// Initialize the chart
const init = () => {
  const graphDiv = myId.value

  // Load the selected mode from IndexedDB (if any)
  get('colorVisionMode').then((mode) => {
    if (mode && colorPalettes[mode] !== undefined) {
      selectedMode.value = mode
    }
    react() // Apply color mode changes right here
  })

  // Make sure `props.traces` is passed to the plot function
  Plotly.newPlot(graphDiv, props.traces, props.layout, {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToAdd: [
      {
        name: 'Color Mode',
        icon: Plotly.Icons.pencil,
        click: () => {
          showDropdown.value = !showDropdown.value
        }
      }
    ]
  })

  created.value = true
}

onMounted(() => {
  init()
})

// Watch for changes in `selectedMode` to update color in the traces
watch(selectedMode, (newMode) => {
  const colors = colorPalettes[newMode]
  props.traces.forEach((trace, index) => {
    if (colors) {
      trace.marker = { color: colors[index % colors.length] }
      trace.line = { color: colors[index % colors.length] }
    } else {
      // Reset to default Plotly colors when "None" mode is selected
      trace.marker = { color: undefined }
      trace.line = { color: undefined }
    }
  })
  react() // Apply changes when mode is updated
  set('colorVisionMode', newMode) // Save the selected mode to IndexedDB
  showDropdown.value = false // Hide the dropdown after selection
})
</script>

<template>
  <div>
    <h3 v-if="chartTitle">{{ chartTitle }}</h3>
    <div ref="myId" />
    <div v-if="noData" class="IHR_no-data">
      <div class="bg-white" style="text-align: center">{{ noData }}</div>
    </div>

    <!-- Dropdown for color mode selection with border styling -->
    <q-select
      v-if="showDropdown"
      v-model="selectedMode"
      :options="Object.keys(colorPalettes)"
      label="Select Color Mode"
      dense
      stack-label
      :hide-dropdown-icon="true"
      :style="{
        position: 'absolute',
        top: '45px',
        left: '15px',
        zIndex: 1000,
        width: '200px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        backgroundColor: '#fff'
      }"
    />
  </div>
</template>

<style scoped>
.IHR_no-data {
  position: relative;
  bottom: 0;
  left: 0;
}
.IHR_no-data > div:first-child {
  box-shadow:
    0 3px 6px rgba(0, 0, 0, 0.16),
    0 3px 6px rgba(0, 0, 0, 0.23);
  padding: 1.25rem;
  position: relative;
  font-weight: 500;
  top: -250px;
  left: 0%;
}
</style>
