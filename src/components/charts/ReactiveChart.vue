<script setup>
import Plotly from 'plotly.js-dist'
import { ref, onMounted, watch } from 'vue'
import { uid, QBadge, QMenu, QList, QItem, QItemSection, QItemLabel } from 'quasar'

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
const dropdownCVD = ref(false)
const supportedCVDPlots = ['treemap', 'pie', 'heatmap', 'bar', 'box', 'scatter', 'scatterpolar']

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

const colorPalettes = {
  protanopia: [
    '#ffe41c',
    '#aabdff',
    '#3c360f',
    '#c8b317',
    '#19376a',
    '#8f8c8b',
    '#d7c997',
    '#648ceb',
    '#505b80',
    '#7e711b',
    '#000000',
    '#0060c7',
    '#a18e21',
    '#bbb3a4',
    '#c7ccee',
    '#ffefb1',
    '#4a4100',
    '#8e91a7',
    '#0079fc',
    '#686566'
  ],
  deuteranopia: [
    '#ffd592',
    '#b0bcf9',
    '#c09300',
    '#679bf2',
    '#ffeafd',
    '#f6c600',
    '#918694',
    '#674f00',
    '#253d60',
    '#6f6367',
    '#557dc2',
    '#ddb69e',
    '#004b84',
    '#987648',
    '#000000',
    '#bab4d9',
    '#0068b5',
    '#423100',
    '#cfa36c',
    '#8894ca'
  ],
  tritanopia: [
    '#fd6e74',
    '#cbefff',
    '#bfa9b6',
    '#cc1600',
    '#228791',
    '#67656c',
    '#660b00',
    '#79eeff',
    '#173033',
    '#ffc0cd',
    '#67becd',
    '#ff4346',
    '#36aebb',
    '#ed656c',
    '#4d717a',
    '#d46269',
    '#845c63',
    '#98b3c2',
    '#cf818b',
    '#6a6168'
  ]
}

const colorPalettesScaling = {
  protanopia: {
    light: '#ffffe0',
    medium: '#ffe41c',
    dark: '#d4af37'
  },
  deuteranopia: {
    light: '#ffffdb',
    medium: '#ffd592',
    dark: '#c2955c'
  },
  tritanopia: {
    light: '#fffcff',
    medium: '#fd6e74',
    dark: '#a84348'
  }
}

const addCustomModebarButton = () => {
  const graphDiv = myId.value
  if (!graphDiv) return
  Plotly.newPlot(graphDiv, props.traces, layoutLocal.value, {
    modeBarButtonsToAdd: [
      {
        name: 'cvd-dropdown',
        title: 'CVD Palette',
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M512 256c0 .9 0 1.8 0 2.7c-.4 36.5-33.6 61.3-70.1 61.3L344 320c-26.5 0-48 21.5-48 48c0 3.4 .4 6.7 1 9.9c2.1 10.2 6.5 20 10.8 29.9c6.1 13.8 12.1 27.5 12.1 42c0 31.8-21.6 60.7-53.4 62c-3.5 .1-7 .2-10.6 .2C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256zM128 288a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm0-96a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM288 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm96 96a32 32 0 1 0 0-64 32 32 0 1 0 0 64z"/></svg>'
        },
        click: () => {
          dropdownCVD.value = !dropdownCVD.value
        }
      }
    ]
  })
}

const updateColors = (paletteKey) => {
  return props.traces.map((trace, index) => {
    const colorsArray = colorPalettes[paletteKey]
    const color = colorPalettes[paletteKey][index % colorPalettes[paletteKey].length]
    if (trace.type === supportedCVDPlots[0]) {
      const firstNode = trace.ids[0]
      let childIndex = 0
      return {
        ...trace,
        marker: {
          ...trace.marker,
          colors: trace.ids.map((id, i) => {
            const parent = trace.parents[i]
            if (!parent) {
              return 'rgba(0,0,0,0)'
            }
            if (parent === firstNode) {
              const colorIndex = childIndex % colorPalettes[paletteKey].length
              childIndex++
              return colorPalettes[paletteKey][colorIndex]
            }
            return null
          })
        }
      }
    } else if (trace.type === supportedCVDPlots[1]) {
      return {
        ...trace,
        marker: {
          ...trace.marker,
          colors: colorsArray.slice(0, trace.labels?.length || colorsArray.length)
        }
      }
    } else if (trace.type === supportedCVDPlots[2]) {
      return {
        ...trace,
        colorscale: [
          [0, colorPalettesScaling[paletteKey].light],
          [0.5, colorPalettesScaling[paletteKey].medium],
          [1, colorPalettesScaling[paletteKey].dark]
        ],
        reversescale: false
      }
    } else {
      return {
        ...trace,
        marker: { ...trace.marker, color },
        line: { ...trace.line, color }
      }
    }
  })
}

const isCvdSupported = () => {
  let notSupported = true
  const plotTypes = new Set(props.traces.map((trace) => trace.type))
  plotTypes.delete(undefined)
  supportedCVDPlots.forEach((traceType) => {
    if (plotTypes.has(traceType)) {
      notSupported = false
    }
  })
  return notSupported
}

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
  if (paletteKey === 'default') {
    Plotly.react(myId.value, props.traces, layoutLocal.value)
  } else {
    Plotly.react(myId.value, updateColors(paletteKey), layoutLocal.value)
  }
  dropdownCVD.value = false
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
    <div ref="myId"></div>
    <div v-if="noData" class="IHR_no-data">
      <div class="bg-white" style="text-align: center">
        {{ noData }}
      </div>
    </div>
    <QMenu v-if="dropdownCVD" anchor="top right" self="top right" :offset="[10, -60]">
      <QList>
        <QItem clickable @click="onCvdDropdown('default')">
          <QItemSection>
            <QItemLabel class="text-weight-medium q-pb-xs"> Default </QItemLabel>
            <QItemLabel class="text-caption" lines="2">
              Plotly's built-in continuous color scales
            </QItemLabel>
          </QItemSection>
        </QItem>
        <QItem clickable @click="onCvdDropdown('protanopia')" :disable="isCvdSupported()">
          <QItemSection>
            <QBadge color="red" label="Experimental" style="width: fit-content" />
            <QItemLabel class="text-weight-medium q-pb-xs"> Protanopia </QItemLabel>
            <QItemLabel class="text-caption" lines="2"> Custom continuous color scales </QItemLabel>
          </QItemSection>
        </QItem>
        <QItem clickable @click="onCvdDropdown('deuteranopia')" :disable="isCvdSupported()">
          <QItemSection>
            <QBadge color="red" label="Experimental" style="width: fit-content" />
            <QItemLabel class="text-weight-medium q-pb-xs"> Deuteranopia </QItemLabel>
            <QItemLabel class="text-caption" lines="2"> Custom continuous color scales </QItemLabel>
          </QItemSection>
        </QItem>
        <QItem clickable @click="onCvdDropdown('tritanopia')" :disable="isCvdSupported()">
          <QItemSection>
            <QBadge color="red" label="Experimental" style="width: fit-content" />
            <QItemLabel class="text-weight-medium q-pb-xs"> Tritanopia </QItemLabel>
            <QItemLabel class="text-caption" lines="2"> Custom continuous color scales </QItemLabel>
          </QItemSection>
        </QItem>
      </QList>
    </QMenu>
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
