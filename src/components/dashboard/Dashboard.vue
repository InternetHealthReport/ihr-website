<template>
  <div>
    <h1 class="text-center">Explorer</h1>
    <div class="row justify-center">
      <div class="col-3">
        <q-select v-model="selectedPlot" :options="plots" label="Type of Plot" />
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
  </div>
</template>

<script>
import DelayParameters from './DelayParameters.vue'
import IodaParamters from './IodaParamters.vue'
import MlabParameters from './MlabParameters.vue'
export default {
  components: { DelayParameters, MlabParameters, IodaParamters },
  name: 'Exploratory Dashboard',
  data() {
    var plots = ['Network Delay', 'IODA Rechability of /24s (%)', 'NDT Speed Test']
    return {
      plots: plots,
      selectedPlot: null,
    }
  },
}
</script>
