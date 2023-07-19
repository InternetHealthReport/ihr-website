<template>
  <div class="IHR_disco-chart">
    <reactive-chart :layout="chart.layout" :traces="chart.traces" :ref="chart.uuid" :no-data="noData"
      @plotly-click="plotlyClickedData = $event" />
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
  data() {
    return {
      probes: [],
      plotlyClickedData: null,
      noData: this.$t('loading')
    }
  },
  watch: {
    loading: {
      handler: function () {
        if (!this.loading && !this.chart.traces.length) {
          this.noData = this.$t('No data to show')
        } else if (!this.loading) {
          this.noData = false
        } else {
          this.noData = this.$t('loading')
        }

      }
    },
    plotlyClickedData: {
      handler: function (newPlotlyClickedData) {
        if (newPlotlyClickedData) {
          this.$emit('plotly-click', newPlotlyClickedData)
        }
      }
    }

  },

}
</script>

<style></style>
