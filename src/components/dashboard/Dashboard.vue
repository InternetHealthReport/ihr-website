<template>
  <div>
    <div>
      <div>
        <h1 class="text-center">Exploratory Dashboard</h1>
      </div>
      <div class="row justify-center">
        <q-select label="Select a plot" v-model="selectedPlot" :options="plots" option-value="value" option-label="label"
          @click="UpdateURL(selectedPlot.value)" dropdown-icon="change_history" />
        <br>
      </div>
    </div>
    <div>
      <component :is="selectedPlot.component" />
    </div>
  </div>
</template>

<script>
import DelayParameters from './DelayParameters.vue'
import IodaParamters from './IodaParamters.vue'
import MlabParameters from './MlabParameters.vue'
import DependencyParameters from './DependencyParameters.vue'
import CloudflareParameters from './CloudflareParameters.vue'
export default {
  components: { DelayParameters, MlabParameters, IodaParamters, DependencyParameters, CloudflareParameters },
  name: 'ExploratoryDashboard',
  data() {
    var plots = [
      { name: 'NetworkDelay', label: 'Network Delay', component: DelayParameters },
      { name: 'IodaParams', label: 'IODA Rechability of /24s (%)', component: IodaParamters },
      { name: 'Mlab', label: 'NDT Speed Test', component: MlabParameters },
      { name: 'DependencyParam', label: 'AS Interdependency', component: DependencyParameters },
      { name: 'Cloudflare', label: 'Cloudflare Report', component: CloudflareParameters },
    ]
    return {
      plots: plots,
      selectedPlot: plots[0],
    }
  },
  mounted() {
    this.selectedPlot = this.plots[0]
    // If the route has a plot parameter, select that plot
    if (this.$route.params.plot) {
      this.selectedPlot = this.plots.find(plot => plot.name === this.$route.params.plot)
    }
  },
  methods: {
    plotSelected(plot) {
      this.selectedPlot = plot;
    },
    // Update the route when the selected plot changes
    updateRoute() {
      this.$router.push({ name: 'dashboard', params: { plot: this.selectedPlot.name } })
    },
  },
  watch: {
    selectedPlot: {
      handler: function (val, oldVal) {
        this.updateRoute()
      },
      deep: true
    }
  }
}
</script>
