<template>
  <div>
    <h1 class="text-center">Metis: Atlas probe deployment recommendations</h1>
    <div class="row justify-center">
      <div class="IHR_description">
        <p>This page shows deployment recommendations to increase the diversity of different metrics.</p>
        <p>
          The sunburst charts each represent the 100 autonomous systems (ASes) that are “farthest away” from existing Atlas probe ASes. The
          ASes are aggregated by country and Regional Internet Registry (RIR). Hovering over the country code shows the country name and AS
          count. Clicking on an RIR zooms into the country distribution. To see detailed information about the ASes, click on the “Show
          data” button below each chart.
        </p>
        <p>
          The recommendations are updated every Sunday/Monday night at midnight UTC. For historical queries, or more recommendations, check
          out the <router-link to="/en-us/api">Metis section of the IHR API</router-link>.
        </p>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv4 AS-path length" af="4" metric="as_path_length" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv4 RTT" af="4" metric="rtt" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv4 IP hops" af="4" metric="ip_hops" :nbprobes="nbprobes" />
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv6 AS-path length" af="6" metric="as_path_length" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv6 RTT" af="6" metric="rtt" :nbprobes="nbprobes" />
      </div>
      <div class="col-4 q-px-md">
        <metis-widget widget-title="IPv6 IP hops" af="6" metric="ip_hops" :nbprobes="nbprobes" />
      </div>
    </div>
  </div>
</template>

<script>
import MetisWidget from './MetisWidget'

export default {
  name: 'MetisDeployment',
  components: {
    MetisWidget,
  },
  data() {
    return {
      nbprobes: 100,
    }
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    font-weight 400
    max-width 900px
</style>
