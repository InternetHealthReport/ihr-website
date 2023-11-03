<template>
  <div>
    <h1 v-if="chartTitle">{{ chartTitle }}</h1>
    <div :ref="myId"></div>
    <div v-show="noData" class="IHR_no-data">
      <div class="bg-white" style="text-align: center;">{{ noData }}</div>
    </div>
  </div>
</template>
<script>
import Plotly from 'plotly.js-dist'

export default {
  props: {
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
    treemapNodeClicked: null,
  },
  emits: {
    'plotly-click': function (plotlyClickedData) {
      if (plotlyClickedData) {
        return true;
      } else {
        return false;
      }
    },
    'loaded': function () {
      return false
    }
  },
  data() {
    return {
      created: false,
      myId: `ihrReactiveChart${this._uid}`,
      layoutLocal: this.layout,
    }
  },
  created() {
    this.layoutLocal['images'] = [
      {
        x: 0.98,
        y: 0.92,
        sizex: 0.1,
        sizey: 0.1,
        source: require('@/assets/imgs/ihr_logo.png'),
        xanchor: 'right',
        xref: 'paper',
        yanchor: 'bottom',
        yref: 'paper',
        opacity: 0.2,
      },
    ]
  },
  mounted() {
    var graphDiv = this.$refs[this.myId]
    Plotly.plot(graphDiv, this.traces, this.layoutLocal, {
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
        this.$emit('plotly-time-filter', { startDateTime, endDateTime })
      }
    })

    graphDiv.on('plotly_click', (eventData) => {
      if (eventData && eventData.points ) {
        const point = eventData.points[0]
        this.$emit('plotly-click', point)
      }
    })

    graphDiv.on('plotly_legendclick', (eventData) => {
      if (eventData) {
        const legend = eventData.node.textContent
        const opacityStyle = eventData.node.getAttribute('style');
        const opacityMatch = opacityStyle.match(/opacity:\s*([^;]+);/);
        if (opacityMatch && legend !== 'All') {
          const opacity = Number(opacityMatch[1]);
          const result = { legend, opacity }
          this.$emit('plotly-legend-click', result);
        }
      }
    })



    this.created = true
  },
  methods: {
    react() {
      if (!this.created) console.error('SHOULD NEVER HAPPEN')

      if (this.traces == undefined) return
      Plotly.react(this.$refs[this.myId], this.traces, this.layoutLocal)
      this.$emit('loaded')
    },
    relayout() {
      Plotly.relayout(this.$refs[this.myId], {})
    },
  },
  watch: {
    traces: {
      handler: function () {
        this.react()
      },
      deep: true,
    },
    layout: {
      handler: function () {
        this.react()
      },
      deep: true,
    },
    yMax(newValue) {
      var graphDiv = this.$refs[this.myId]
      Plotly.relayout(graphDiv, 'yaxis.range', [0, newValue])
    },
  },
}
</script>
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
