<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="chart.layout"
      :traces="chart.traces"
      :ref="chart.uuid"
      :no-data="noData"
    />
  </div>
</template>

<script>
import ReactiveChart from '@/components/ReactiveChart'
import { COMMON_FEATURE } from '../layouts.js'

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
  data() {
    return {
      probes: [],
      noData: this.$t('loading')
    }
  },

  watch: {
    loading: {
      handler: function() {
        let noDataToShow = !this.loading && (this.chart.traces[0].locations.length == 0 || this.chart.traces[0].z.length == 0)
        if (noDataToShow) {
          this.noData = this.$t('No data to show')
        } else if (!this.loading) {
          this.noData = false
        }
      }
    }

  },

}
</script>

<style></style>
