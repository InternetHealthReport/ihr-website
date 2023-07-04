<template>
    <div class="IHR_disco-chart">
        <reactive-chart :layout="chart.layout" :traces="chart.traces" :ref="chart.uuid" :no-data="noData" />
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
    data() {
        return {
            probes: [],
            noData: this.$t('loading')
        }
    },

    watch: {
        loading: {
            handler: function (newLoadingValue) {
                if (!newLoadingValue) {
                    this.noData = false
                } else {
                    this.noData = this.$t('loading')
                }
            },
            deep: true
        },
        chart: {
            handler: function (newChart) {
                if (!this.loading && !newChart.traces.length) {
                    this.noData = this.$t('No data to show')
                }
            },
            deep: true
        }
    },
}
</script>
  
<style></style>
  