<template>
  <div>
    <h1 class="text-center">Explorer</h1>
    <div class="row justify-center">
      <div class="col-3">
        <q-select v-model="selectedPlot" :options="plots" label="Type of Plot" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
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
