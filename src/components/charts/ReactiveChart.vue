<script setup>
import Plotly from 'plotly.js-dist'
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import { uid } from 'quasar'

const props = defineProps({
  layout: {
    type: Object,
    required: true,
  },
  traces: {
    type: Array,
    required: true,
  },
  chartTitle: {
    type: String,
    required: false,
    default: null,
  },
  noData: {
    required: false,
    default: false,
  },
  yMax: {
    type: Number,
    required: false,
    default: 0,
  },
  treemapNodeClicked: null
})

const emits = defineEmits({
  'plotly-click': (plotlyClickedData) => {
    if (plotlyClickedData) {
      return true
    } else {
      return false
    }
  },
  'loaded': () => {
    return false
  },
  'plotly-legend-click': (plotlyClickedLegend) => {
    if (plotlyClickedLegend) {
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
    source: new URL('@/assets/imgs/ihr_logo.png', import.meta.url).href,
    xanchor: 'right',
    xref: 'paper',
    yanchor: 'bottom',
    yref: 'paper',
    opacity: 0.2,
  },
]

const react = () => {
  if (!created.value) {
    console.error('SHOULD NEVER HAPPEN')
  }

  if (props.traces == undefined) {
    return
  }
  Plotly.react(myId.value, props.traces, layoutLocal.value)
  // emits('loaded')
}

const relayout = () => {
  Plotly.relayout(myId.value, {})
}

const init = () => {
  const graphDiv = myId.value
  Plotly.newPlot(graphDiv, props.traces, layoutLocal.value, {
    responsive: true,
    displayModeBar: 'hover',
  })

  if (document.documentElement.clientWidth < 576) {
    Plotly.relayout(graphDiv, { showlegend: false })
  }

  graphDiv.on('plotly_relayout', (event) => {
    let startDateTime = event['xaxis.range[0]'];
    let endDateTime = event['xaxis.range[1]'];
    if (startDateTime && endDateTime) {
      startDateTime += 'Z'
      endDateTime += 'Z'
      emits('plotly-time-filter', { startDateTime, endDateTime })
    }
  })

  graphDiv.on('plotly_click', (eventData) => {
    if (eventData && eventData.points ) {
      emits('plotly-click', eventData)
    }
  })

  graphDiv.on('plotly_legendclick', (eventData) => {
    if (eventData && eventData.node) {
      emits('plotly-legend-click', eventData)
    }
  })

  created.value = true
}

onMounted(() => {
  init()
})

watch(() => props.traces, () => {
  react()
}, {deep: true})
// watch(() => props.layout, () => {
//   react()
// })
watch(() => props.yMax, (newValue) => {
  const graphDiv = myId.value
  Plotly.relayout(graphDiv, 'yaxis.range', [0, newValue])
})
</script>

<template>
  <div>
    <h1 v-if="chartTitle">{{ chartTitle }}</h1>
    <div ref="myId"></div>
    <div v-show="noData" class="IHR_no-data">
      <div class="bg-white" style="text-align: center;">{{ noData }}</div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.IHR_
  &no-data
    position relative
    bottom 0
    left 0
    & > div:first-child
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      padding 16pt
      position relative
      font-weight: 500;
      top -250px
      left 0%
      &:first-letter
        text-transform uppercase
</style>