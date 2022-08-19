<template>
  <div class="IHR_chart">
    <div class="row">
      <div class="col">
        <reactive-chart :layout="layout" :traces="traces" @plotly-click="showSankey" :ref="myId" :no-data="noData" />
      </div>
    </div>
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
  </div>
</template>

<script>
import CommonChartMixin from './CommonChartMixin'
import { NET_DELAY_BOXPLOT_LAYOUT } from './layouts'
import ripeApi from '@/plugins/RipeApi'

const LINE_COLORS = [
  '#1f77b4', // muted blue
  '#ff7f0e', // safety orange
  '#2ca02c', // cooked asparagus green
  '#d62728', // brick red
  '#9467bd', // muted purple
  '#8c564b', // chestnut brown
  '#e377c2', // raspberry yogurt pink
  '#7f7f7f', // middle gray
  '#bcbd22', // curry yellow-green
  '#17becf', // blue-teal
]

export default {
  mixins: [CommonChartMixin],
  components: {},
  props: {
    msmIds: {
      type: Array,
      default: () => [],
    },
    sources: {
      type: Array,
      default: () => [],
    },
    destinations: {
      type: Array,
      default: () => [],
    },
    clear: {
      type: Number,
      default: 1,
    },
  },
  data() {
    var layout = NET_DELAY_BOXPLOT_LAYOUT
    return {
      traceroutes: {},
      probes: {},
      dstIPs: {},
      ip2asn: {},
      loading: true,
      openClose: true,
      traces: [],
      layout: layout,
      selectedStart: '',
      selectedEnd: '',
      endPointKeysFilter: this.endPointNames,
      startPointNameFilter: this.startPointName,
      startPointTypeFilter: this.startPointType,
      startPointKeysFilter: this.startPointNames,
    }
  },
  methods: {
    getTraceroutes() {
      this.traceroutes = []
      this.msmIds.forEach( msmId => {
        // update probe information
        ripeApi.atlasMeasurementProbes(msmId).then( probes => {
          this.probes = probes
        })
        console.log('PROBES')
        console.log(this.probes)

        // fetch traceroute data
        ripeApi.atlasMeasurementResults(msmId, this.startTime, this.endTime).then( res => {
          res.forEach( trace => { 
            // Add ASN of the Atlas probe
            //TODO make sure the AF of the traceroute
            trace.fromASN = this.probes[trace.prb_id].asn_v4.toString()

            // TODO add check for destinations and handle empty arrays
            if( this.sources.includes(trace.fromASN) ){
              // Add ASN of the destination IP

              if (! trace.dst_addr in this.dstIPs){
                this.dstIPs[trace.dst_addr] = false
              }
              //ripeApi.relatedPrefixes(trace.dst_addr).then( prefixes => {
              //    this.ip2asn[trace.dst_addr] = prefixes[prefixes.length - 1]
              //  }
              //let match = this.ip2asn[trace.dst_addr]
              //trace.dstASN = match.origin_asn; 
              //trace.dstASName = match.asn_name; 
              this.traceroutes.push(trace)
              console.log(`PUSHED a traceroute ${trace.fromASN}`)
            }
          })
        })
      })
    },
    filterTraceroutes() {
      this.traceroutes.forEach( res => {
        
      })
    },
    apiCall() {
        console.log('BOX in apiCall')
      this.loading = true
      this.getTraceroutes()
      console.log(this.traceroutes)
    },
    showSankey() {
      console.log('show sankey!')
    },
    clearGraph() {
      this.traces = []
      this.layout.datarevision = new Date().getTime()
    },
    fetchNetworkDelay(data) {
      let traces = {}
      let maxValue = 0
      let timeResolution = 1800 * 1000
      let groups = []
      data.forEach(elem => {
        let key = elem.startpoint_type
        key += elem.startpoint_af
        key += elem.startpoint_name
        key += elem.endpoint_type
        key += elem.endpoint_af
        key += elem.endpoint_name
        elem.median = Math.abs(elem.median)
        let trace = traces[key]
        if (trace === undefined) {
          let startname = elem.startpoint_type + elem.startpoint_name
          if (elem.startpoint_type === 'CT') {
            startname = elem.startpoint_name.split(',')[0]
          }
          let endname = elem.endpoint_type + elem.endpoint_name

          if (elem.endpoint_type === 'CT') {
            endname = elem.endpoint_name.split(',')[0]
          }

          startname = this.prettyName(startname)
          endname = this.prettyName(endname)

          trace = {
            x: [],
            y: [],
            //name: `${elem.startpoint_type} ${elem.startpoint_name} ipv${elem.startpoint_af} => ${elem.endpoint_type} ${elem.endpoint_name} ipv${elem.endpoint_af}`
            name: `${startname} to ${endname}`,
            hovertemplate:
              '<b>' +
              startname +
              ' to ' +
              endname +
              '</b><br><br>' +
              '%{x}<br>' +
              '%{yaxis.title.text}: <b>%{y:.2f}</b>' +
              '<extra></extra>',
          }

          // Group traces if needed
          if (this.group == 'start') {
            let idx = groups.indexOf(startname)
            if (idx == -1) {
              groups.push(startname)
              idx = groups.length - 1
            } else {
              trace.showlegend = false
            }
            trace.name = startname
            trace.legendgroup = startname
            trace.line = { color: LINE_COLORS[idx] }
          }

          traces[key] = trace
        }

        maxValue = maxValue > elem.median ? maxValue : elem.median

        // Add null if there is missing data
        let prevDate = Date.parse(trace.x.slice(-1)[0])
        let currDate = Date.parse(elem.timebin)
        if (currDate > prevDate + timeResolution + 1) {
          trace.y.push(null)
          trace.x.push(elem.timbin)
        }

        trace.y.push(elem.median)
        trace.x.push(elem.timebin)
      })
      // Sort traces by alphabetical order
      let keys = Object.keys(traces).sort()
      keys.forEach(key => this.traces.push(traces[key]))

      // emit max value
      this.$emit('max-value', maxValue)

      this.loading = false
      this.notifyDisplay(this.traces.length > 0)
      this.layout.datarevision = new Date().getTime()
    },
    notifyDisplay(displayed) {
      this.$emit('display', displayed)
    },
  },
  computed: {
    delayUrl() {
      return 'TODO link to atlas API'
    },
  },
  watch: {
    // TODO watch inputs
    startPointNames() {
      //reset filter
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    endPointNames() {
      //reset filter
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    startPointName() {
      //reset filter
      this.startPointNameFilter = this.startPointName
      this.startPointTypeFilter = this.startPointType
      this.endPointKeysFilter = this.endPointNames
      this.startPointKeysFilter = this.startPointNames

      this.clearGraph()

      // get updated data
      this.debouncedApiCall()
    },
    clear() {
      this.clearGraph()
      this.loading = true
    },
  },
}
</script>
<style lang="stylus" scoped>
.IHR_
  &charts-title
    overflow hidden
    ~/last
      right 50px
  &searchbar
    position absolute
    transition top .6s
  &showed-bar
    top 10px
    visibility visible
    opacity 1
  &hidden-bar
    top 60px
    opacity 0
</style>
