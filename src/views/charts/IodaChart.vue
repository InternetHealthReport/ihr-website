<template>
  <div>
    <reactive-chart :layout="layout" :traces="traces" :noData="noData" />
    <div v-if="loading" class="IHR_loading-spinner">
      <q-spinner color="secondary" size="15em" />
    </div>
  </div>
</template>

<script>
import ReactiveChart from '../../components/ReactiveChart.vue'
import CommonChartMixin from './CommonChartMixin'
import { IODA_ALARMS_SPECIFIC_ENTRY_TIMESERIES_LAYOUT } from './layouts'
import * as IodaChartDataModel from '@/models/IodaChartDataModel'

export default {
  name: 'IodaChart',
  mixins: [CommonChartMixin],
  components: { ReactiveChart },
  props: {
    entityValue: {
      type: String,
      required: true
    },
    iodaAlarmTypesUnits: {
      type: Object,
      required: true,
    },
    filterByCountry: {
      type: Boolean,
      required: true,
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
  },
  data() {
    return {
      layout: IODA_ALARMS_SPECIFIC_ENTRY_TIMESERIES_LAYOUT,
      traces: [],
      loading: false,
      iodaAlarmTypesUnitsVal: {
        ...this.iodaAlarmTypesUnits,
        'gtr': 'Google (Search)'
      },
      iodaSourceParams: 'WEB_SEARCH'
    }
  },
  computed: {
    entityType() {
      return this.filterByCountry ? 'country' : 'asn'
    }
  },
  methods: {
    apiCall() {
      this.loading = true
      IodaChartDataModel.etl(this.entityType, this.entityValue, this.startTime, this.endTime, this.iodaAlarmTypesUnitsVal, this.iodaSourceParams)
        .then((traces)=> {
          this.traces = traces
          this.layout.datarevision = new Date().getTime()
          this.loading = false
          this.noData = !traces.length ? this.$t('No data to show') : ''
        })
        .catch((error)=>{
          console.error(error)
        })
    },
  },
}
</script>

<style scoped>
</style>