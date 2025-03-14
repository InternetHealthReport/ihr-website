<script setup>
import Plotly from 'plotly.js-dist'
import { ref, onMounted, watch} from 'vue'
import { uid } from 'quasar'
const dropdown = ref(false)
const props = defineProps({
  layout: {
    type: Object,
    required: true
  },
  traces: {
    type: Array,
    required: true
  },
  chartTitle: {
    type: String,
    required: false,
    default: null
  },
  noData: {
    required: false,
    default: false
  },
  yMax: {
    type: Number,
    required: false,
    default: 0
  },
  treemapNodeClicked: null,
  newPlot: {
    type: Boolean,
    default: false
  },
  shapes: {
    type: Array
  }
})
const colorPalettes = {
  default: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
    '#8c564b', '#e377c2','#7f7f7f','#bcbd22', '#17becf'
  ],
  protanopia: [
    '#ffe41c', '#aabdff', '#3c360f', '#c8b317', '#19376a',
    '#8f8c8b', '#d7c997', '#648ceb', '#505b80', '#7e711b'
  ],
  deuteranopia: [
    '#ffd592', '#b0bcf9', '#c09300', '#679bf2', '#ffeafd',
    '#f6c600', '#918694', '#674f00', '#253d60', '#6f6367'
  ],
  tritanopia: [
    '#fd6e74', '#cbefff', '#bfa9b6', '#cc1600', '#228791',
    '#67656c', '#660b00', '#79eeff', '#173033', '#ffc0cd'
  ]
}
const addCustomModebarButton = () => {
  const graphDiv = myId.value
  if (!graphDiv) return
  Plotly.newPlot(graphDiv, props.traces, layoutLocal.value, {
    displayModeBar: true,
    modeBarButtonsToAdd: [{
      name: 'cvd-dropdown',
      title: 'Toggle CVD Colors',
      icon: Plotly.Icons.pencil,
      click: () => {
        dropdown.value = !dropdown.value
      }
    }]
  })
}
const updateColors = (paletteKey) => {
  return props.traces.map((trace, index) => {
    const colorsArray = colorPalettes[paletteKey]
    const color = colorPalettes[paletteKey][index % colorPalettes[paletteKey].length]
    if (trace.type === 'treemap') {
      const firstNode = trace.ids[0]
      let childIndex = 0
      return {
        ...trace,
        marker: { 
          ...trace.marker, 
          colors: trace.ids.map((id, i) => {
            const parent = trace.parents[i]
            if (!parent) {
              return "rgba(0,0,0,0)"
            }
            if(parent === firstNode){
              const colorIndex = childIndex % colorPalettes[paletteKey].length
              childIndex++
              return colorPalettes[paletteKey][colorIndex]
            }
            return null
          }),
        }
      }
    } else if (trace.type === 'pie') {
      return {
        ...trace,
        marker: { 
          ...trace.marker, 
          colors: colorsArray.slice(0, trace.labels?.length || colorsArray.length)
        },
      }
    } else {
      return {
        ...trace,
        marker: { ...trace.marker, color },
        line: { ...trace.line, color },
      }
    }
  })
}
const emits = defineEmits({
  'plotly-click': (plotlyClickedData) => {
    if (plotlyClickedData) {
      return true
    } else {
      return false
    }
  },
  loaded: () => {
    return false
  },
  'plotly-legend-click': (plotlyClickedLegend) => {
    if (plotlyClickedLegend) {
      return true
    } else {
      return false
    }
  },
  'plotly-time-filter': (plotlyClickedLegend) => {
    if (plotlyClickedLegend) {
      return true
    } else {
      return false
    }
  },
  'plotly-relayout': (plotlyRelayout) => {
    if (plotlyRelayout) {
      return true
    } else {
      return false
    }
  }
})
const created = ref(false)
const myId = ref(`ihrReactiveChart${uid()}`)
const layoutLocal = ref(props.layout)
layoutLocal.value['images'] = [
  {
    x: 0.98,
    y: 0.92,
    sizex: 0.1,
    sizey: 0.1,
    source: '/imgs/ihr_logo.png',
    xanchor: 'right',
    xref: 'paper',
    yanchor: 'bottom',
    yref: 'paper',
    opacity: 0.2
  }
]
const react = () => {
  if (!created.value) {
    console.error('SHOULD NEVER HAPPEN')
  }
  if (props.traces == undefined) {
    return
  }
  if (props.newPlot) {
    Plotly.newPlot(myId.value, props.traces, layoutLocal.value)
  } else {
    Plotly.react(myId.value, props.traces, layoutLocal.value)
  }
  // emits('loaded')
}
const onCvdDropdown = async (paletteKey) => {
  if(paletteKey=='default'){
    Plotly.react(myId.value, props.traces, layoutLocal.value)
  }
  else{
    Plotly.react(myId.value, updateColors(paletteKey), layoutLocal.value)
  }
  dropdown.value=false
}
const relayout = () => {
  Plotly.relayout(myId.value, {})
}
const init = () => {
  const graphDiv = myId.value
  Plotly.newPlot(graphDiv, props.traces, layoutLocal.value, {
    responsive: true,
    displayModeBar: 'hover'
  }).then(() => {
    addCustomModebarButton()
  })
  if (document.documentElement.clientWidth < 576) {
    Plotly.relayout(graphDiv, { showlegend: false })
  }
  graphDiv.on('plotly_relayout', (event) => {
    let startDateTime = event['xaxis.range[0]']
    let endDateTime = event['xaxis.range[1]']
    if (startDateTime && endDateTime) {
      startDateTime += 'Z'
      endDateTime += 'Z'
      startDateTime = new Date(startDateTime)
      endDateTime = new Date(endDateTime)
      emits('plotly-time-filter', { startDateTime, endDateTime })
    }
    emits('plotly-relayout', event)
  })
  graphDiv.on('plotly_click', (eventData) => {
    if (eventData && eventData.points) {
      emits('plotly-click', eventData)
    }
  })
  graphDiv.on('plotly_legendclick', (eventData) => {
    if (eventData) {
      const legend = eventData.node.textContent
      const opacityStyle = eventData.node.getAttribute('style')
      const opacityMatch = opacityStyle.match(/opacity:\s*([^;]+);/)
      if (opacityMatch && legend !== 'All') {
        const opacity = Number(opacityMatch[1])
        const result = { legend, opacity }
        emits('plotly-legend-click', result)
      }
    }
  })
  created.value = true
}
onMounted(() => {
  init()
})
watch(
  () => props.traces,
  () => {
    react()
  },
  { deep: true }
)
watch(
  () => props.layout,
  () => {
    layoutLocal.value = Object.assign(layoutLocal.value, props.layout)
    if (layoutLocal.value['title'] !== undefined) {
      delete layoutLocal.value['title']
    }
  }
)
watch(
  () => props.yMax,
  (newValue) => {
    const graphDiv = myId.value
    Plotly.relayout(graphDiv, 'yaxis.range', [0, newValue])
  }
)
watch(
  () => props.shapes,
  (newValue) => {
    const graphDiv = myId.value
    Plotly.relayout(graphDiv, 'shapes', newValue)
  }
)
</script>

<template>
  <div>
    <h3 v-if="chartTitle">
      {{ chartTitle }}
    </h3>
    <div ref="myId" />
    <div v-if="noData" class="IHR_no-data">
      <div class="bg-white" style="text-align: center">
        {{ noData }}
      </div>
    </div>
    <q-menu v-if="dropdown" anchor="top right" self="top right" :offset="[10,-50]">
      <q-list>
        <q-item clickable @click="onCvdDropdown('default')">
          <q-item-section>Default</q-item-section>
        </q-item>
        <q-item clickable @click="onCvdDropdown('protanopia')">
          <q-item-section>Protanopia</q-item-section>
        </q-item>
        <q-item clickable @click="onCvdDropdown('deuteranopia')">
          <q-item-section>Deuteranopia</q-item-section>
        </q-item>
        <q-item clickable @click="onCvdDropdown('tritanopia')">
          <q-item-section>Tritanopia</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
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
.IHR_no-data > div:first-child:first-letter {
  text-transform: uppercase;
}
</style>