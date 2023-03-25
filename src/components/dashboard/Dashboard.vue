<template>
  <div>
    <h1 class="text-center">Explorer</h1>
    <div class="row justify-center">
      
        <div class="col-3">     

        <q-select v-model="selectedPlot" :options="plots" label="Type of Plot" dropdown-icon="change_history" />
      </div>
    </div>
    <!-- Network Delay plot start -->
    <div v-if="selectedPlot == 'Network Delay'">
      <div class="row justify-center"></div>
      <delay-parameters />
    </div>
    <!-- Network Delay plot end -->
    <!-- IODA plot start -->
    <div v-if="selectedPlot == 'IODA Rechability of /24s (%)'">
      <div class="row justify-center">
        <ioda-paramters />
      </div>
    </div>
    <!-- IODA plot end-->
    <!-- MLab plot start -->
    <div v-if="selectedPlot == 'NDT Speed Test'">
      <div class="row justify-center">
        <mlab-parameters />
      </div>
    </div>
    <!-- MLab plot end -->
    <!-- AS Interdependency plot start -->
    <div v-if="selectedPlot == 'AS Interdependency'">
      <div class="row justify-center">
        <dependency-parameters />
      </div>
    </div>
    <!-- AS Interdependency plot end -->
    <!-- Cloudflare plot start -->
    <div v-if="selectedPlot == 'Cloudflare Report'">
      <div class="row justify-center">
        <cloudflare-parameters />
      </div>
    </div>
    <!-- Cloudflare plot end -->
  </div>
</template>

<script>
import DelayParameters from './DelayParameters.vue'
import IodaParamters from './IodaParamters.vue'
import MlabParameters from './MlabParameters.vue'
import DependencyParameters from './DependencyParameters.vue'
import CloudflareParameters from './CloudflareParameters.vue'
import dropdown from 'vue-dropdowns';
export default {
  components: { DelayParameters, MlabParameters, IodaParamters, DependencyParameters, CloudflareParameters },
  name: 'ExploratoryDashboard',
  data() {
    var plots = ['Network Delay', 'IODA Rechability of /24s (%)', 'NDT Speed Test', 'AS Interdependency', 'Cloudflare Report']
    return {
      plots: plots,
      selectedPlot: null,
    }
  },
}
</script>
