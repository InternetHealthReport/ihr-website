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
    getProbeInfo() {
        console.log('BOX get probes')
      // update probe information
      this.probes = {}
      var promises = []
      this.msmIds.forEach( msmId => {
        promises.push(ripeApi.atlasMeasurementProbes(msmId).then( probes => {
          for (const probe of Object.entries(probes)) {
              if( ( 'asn_v4' in probe[1] && this.sources.includes(probe[1].asn_v4.toString()) ) ){
                // TODO IPv6
                //|| ('asn_v6' in probe[1] && this.sources.includes(probe[1].asn_v6.toString()) ) ){
              this.probes[probe[0]] = probe[1]
            }
          }
        }))
      })
      console.log('getProbes promises')
        console.log(promises)
      return Promise.all(promises)
    },
    getTraceroutes() {
      var pids = Object.keys(this.probes)
      var promises = []
      this.traceroutes = []
      this.msmIds.forEach( msmId => {
        // fetch traceroute data
        promises.push(
          ripeApi.atlasMeasurementResults(msmId, this.startTime, this.endTime, pids).then( res => {
            res.forEach( trace => { 
              // Add ASN of the Atlas probe
              //TODO make sure the AF of the traceroute
              trace.fromASN = this.probes[trace.prb_id].asn_v4.toString()

              // TODO add check for destinations and handle empty arrays
              if( this.sources.includes(trace.fromASN) ){
                // Add ASN of the destination IP

                if ((typeof trace.dst_addr !== 'undefined') && !(trace.dst_addr in this.dstIPs)){
                  this.dstIPs[trace.dst_addr] = {}
                }
                this.traceroutes.push(trace)
              }
            })
          })
        )
      })
      return Promise.all(promises)
    },
    getDstInfo() {
      var promises = [];
      Object.keys(this.dstIPs).forEach( ip => {
            promises.push(ripeApi.relatedPrefixes(ip).then( prefixes => {
              if( typeof prefixes !== 'undefined' ){
                this.dstIPs[ip] = prefixes[prefixes.length - 1]
              }
              else{
                console.log(`ERROR COULD NOT FIND PREFIX FOR ${ip}`)
              }
            }))
      })
      return Promise.all(promises).then( () => {
        this.traceroutes.forEach( trace => { 
          if( typeof this.dstIPs[trace.dst_addr] !== 'undefined') {
            trace.dstASN = this.dstIPs[trace.dst_addr].origin_asn
            trace.dstASName = this.dstIPs[trace.dst_addr].asn_name
          }
        })
      })
    },
    apiCall() {
        console.log('BOX in apiCall')
      this.loading = true
      this.getProbeInfo()
       .then( this.getTraceroutes )
       .then( this.getDstInfo )
       .then( this.computeBoxplot )
      
    },
    computeBoxplot() {
      var traces = {}
      this.traceroutes.forEach( traceroute => {
        if( typeof traceroute.dst_addr == 'undefined' ) return;

        if( !(traceroute.fromASN in traces) ){
          traces[traceroute.fromASN] = {
            y: [],
            x: [],
            name: `AS${traceroute.fromASN}`,
            type: 'box'
          };
        }
        else{
          let lasthop = traceroute.result[traceroute.result.length - 1]
          lasthop.result.forEach( res => {
              if(res.from == traceroute.dst_addr){
                traces[traceroute.fromASN].y.push(res.rtt)
                traces[traceroute.fromASN].x.push(traceroute.dstASName)
              }
          })
        }
      })
      this.loading = false
      this.traces = Object.values(traces)
        console.log(this.traces)
      this.layout.datarevision = new Date().getTime()
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
