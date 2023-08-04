<template>
  <div class="IHR_disco-chart">
    <reactive-chart :layout="chart.layout" :traces="chart.traces" :ref="chart.uuid" :no-data="noData"
      @plotly-click="plotlyClickedDataHandler" />
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
      default: true,
    },
  },
  emits: {
    'plotly-click': function (plotlyClickedData) {
      if (plotlyClickedData) {
        return true;
      } else {
        return false;
      }
    },
  },
  computed: {
    noData() {
      if (!this.loading && !this.chart.traces[0].locations.length) {
        return this.$t('No data to show')
      } else if (!this.loading) {
        return false
      } else {
        return this.$t('loading')
      }
    }
  },
  methods: {
    plotlyClickedDataHandler(newPlotlyClickedData) {
      this.$emit('plotly-click', newPlotlyClickedData)
    }
  }
}
</script>

<style></style>
