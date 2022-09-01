<template>
  <div>
    <h1 class="text-center">Atlas Explorer</h1>
    <div class="row justify-center">
      <div class="IHR_description">
        <p>Welcome to IHR Atlas Traceroute visualizer.</p>
        <p>
          What it does, how to use it, etc...
        </p>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-3">
        <q-input v-model="msmIds" label="Atlas measurement IDs" />
        <q-btn class="q-mt-sm" @click="replot" label="Go"></q-btn>
      </div>
    </div>
    <div class="row justify-center">
      <div class="col-10">
        <network-delay-box-plot
            :msmIds="msmIds"
            :start-time="startTime"
            :end-time="endTime"
            :sources="sources"
            :fetch="fetch"
            ref="networkDelayBoxPlot"
        />
      </div>
    </div>
  </div>
</template>

<script>
import NetworkDelayBoxPlot from '@/views/charts/NetworkDelayBoxPlot'

export default {
  name: 'AtlasTracerouteExplorer',
  components: {
    NetworkDelayBoxPlot,
  },
  data() {
    return {
      msmIds: [43573971],
      startTime: new Date('2022/08/21'),
      endTime: new Date('2022/08/22'),
      fetch: true,
      dateRange: {},
      sources: ['4713', '2497', '2516']
    }
  }, 
  methods: {
    replot() {
        

    },
  },
  watch: {
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    max-width 900px
</style>
