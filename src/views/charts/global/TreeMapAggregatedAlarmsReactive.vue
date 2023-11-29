<template>
  <div class="IHR_disco-chart">
    <reactive-chart :layout="chart.layout" :traces="chart.traces" :ref="chart.uuid" :no-data="noData"
      @plotly-click="onTreemapNodeClicked" />
  </div>
</template>
  
<script>
import ReactiveChart from '@/components/ReactiveChart'

export default {
  components: { ReactiveChart },
  props: {
    chart: {
      type: Object,
      required: true,
    },
    loading: {
      type: Boolean,
      required: true,
    }

  },
  data() {
    return {
      clickProcessing: false
    }
  },
  computed: {
    noData() {
      if (!this.loading && !this.chart.traces.length) {
        return this.$t('No data to show')
      } else if (!this.loading) {
        return false
      } else {
        return this.$t('loading')
      }
    }
  },
  methods: {
    onTreemapNodeClicked(treemapPointClicked) {
      if (this.clickProcessing) return;
      if (treemapPointClicked.pointNumber !== undefined && treemapPointClicked.parent == '') {
        this.clickProcessing = true;
        this.$emit('treemap-node-clicked', treemapPointClicked.label)
        setTimeout(() => {
          this.clickProcessing = false;
        }, 900);
      }
    }
  }
}
</script>
  
<style></style>
  