<template>
  <div class="row justify-center">
    <h1>IODA plots will appear here</h1>
    <div class="col-12">
      <network-search-bar bg="white" label="grey-8" input="black" labelTxt="Enter the ASN you are looking for" />
      <div class="q-pa-md">
        <div class="q-pb-sm">Model: {{ dateRange }}</div>
        <div v-for="dateRange in iodaChartArray" :key="dateRange">
          <q-card class="IHR_charts-body">
            <q-card-section v-if="dateRange">
              <ioda-chart :ASN="asNumber" :fetch="true" :start-time="getFrom(dateRange)" :end-time="getTo(dateRange)" ref="iodaChart" />
            </q-card-section>
          </q-card>
        </div>
        <q-date v-model="dateRange" range />
      </div>
    </div>
  </div>
</template>

<script>
import NetworkSearchBar from './middleware/networkSearchBar.vue'
import DateTimePicker from '../../components/DateTimePicker.vue'
import DateRangePicker from './middleware/dateRangePicker.vue'
import IodaChart from '../../views/charts/IodaChart.vue'
export default {
  components: {
    NetworkSearchBar,
    DateTimePicker,
    DateRangePicker,
    IodaChart,
  },
  data() {
    let dateRange
    let asNumber = '2497'
    let iodaChartArray = []
    return {
      dateRange: dateRange,
      asNumber: asNumber,
      iodaChartArray: iodaChartArray,
    }
  },
  methods: {
    getFrom(dateRange) {
      let from = new Date(dateRange.from)
      return from
    },
    getTo(dateRange) {
      let to = new Date(dateRange.to)
      return to
    },
  },
  watch: {
    dateRange() {
      this.iodaChartArray.push(this.dateRange)
    },
  },
}
</script>
