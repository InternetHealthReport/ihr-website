<template>
    <div>
        <h1 v-if="chartTitle">{{ chartTitle }}</h1>
        <div :ref="myId"></div>
        <div v-show="noData" class="IHR_no-data">
            <div class="bg-white">{{ noData }}</div>
        </div>
    </div>
</template>
<script>
import Plotly from 'plotly.js-dist'
/*
emitted events
  plotly-click: propagation of plotly onclick

  loading: emited (with false) when the plot has been rendered (for 2 way binding)
*/

export default {
    props: {
        layout: {
            type: Object,
            require: true,
        },
        traces: {
            type: Array,
            require: true,
        },
        chartTitle: {
            type: String,
            require: false,
            default: null,
        },
        noData: {
            require: false,
            default: false,
        },
        yMax: {
            type: Number,
            require: false,
            default: 0,
        },
    },
    data() {
        return {
            created: false,
            myId: `ihrReactiveChart${this._uid}`,
        }
    },
    created() {
        this.layout['images'] = [
            {
                x: 1,
                y: 1.05,
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
        Plotly.plot(graphDiv, this.traces, this.layout, {
            responsive: true,
            displayModeBar: 'hover',
        })

        if (document.documentElement.clientWidth < 576) {
            Plotly.relayout(graphDiv, { showlegend: false })
        }

        graphDiv.on('plotly_click', eventData => {
            this.$emit('plotly-click', eventData)
        })

        this.created = true
    },
    methods: {
        react() {
            if (!this.created) console.error('SHOULD NEVER HAPPEN')

            if (this.traces == undefined) return
            Plotly.react(this.$refs[this.myId], this.traces, this.layout)
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
    position absolute
    bottom 0
    left 0
    & > div:first-child
      box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
      padding 16pt
      position relative
      font-weight: 500;
      top 50%
      left -50%
      &:first-letter
        text-transform uppercase
</style>
