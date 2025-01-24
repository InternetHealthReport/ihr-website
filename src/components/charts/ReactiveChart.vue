<script setup>
import Plotly from 'plotly.js-dist'
import { ref, onMounted, watch } from 'vue'
import { uid } from 'quasar'

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

const relayout = () => {
  Plotly.relayout(myId.value, {})
}

const init = () => {
  const graphDiv = myId.value
  Plotly.newPlot(graphDiv, props.traces, layoutLocal.value, {
    responsive: true,
    displayModeBar: 'hover'
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
