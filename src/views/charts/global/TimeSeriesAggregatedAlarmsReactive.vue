<template>
    <div class="IHR_disco-chart">
        <reactive-chart :layout="chart.layout" :traces="chart.traces" :ref="chart.uuid" :no-data="noData"
            @filter-alarms-by-time="filterAlarmsByTimeHandler" />
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
    },
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
    filterAlarmsByTimeHandler(newPlotlyDateTimeFilter) {
      this.$emit('filter-alarms-by-time', newPlotlyDateTimeFilter)
    }
  }
}
</script>
  
<style></style>
  