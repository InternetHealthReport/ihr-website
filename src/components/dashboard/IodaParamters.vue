<template>
  <div class="row justify-center">
    <h1>IODA plots will appear here</h1>
    <div class="col-12">
      <div class="row justify-center">
        <div class="col-5">
          <network-search-bar bg="white" label="grey-8" input="black" labelTxt="Enter the ASN you are looking for" />
        </div>
        <div class="col-5">
          <q-date v-model="dateRange" range />
        </div>
        <div class="col-2">
          <button @click="addPlot()">Add plot</button>
        </div>
      </div>
      <div class="q-pa-md">
        <div class="q-pb-sm">Model: {{ dateRange }}</div>
        <div v-for="index in iodaChartArray.length" :key="index">
          <q-card class="IHR_charts-body">
            <q-card-section v-if="iodaChartArray[index]">
              <h1>{{ asNumber }}</h1>
              <h1 @click="deletePlot(index)">X</h1>

              <ioda-chart
                :ASN="asNumber"
                :fetch="true"
                :start-time="getFrom(iodaChartArray[index])"
                :end-time="getTo(iodaChartArray[index])"
                ref="iodaChart"
              />
            </q-card-section>
          </q-card>
        </div>
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
    addPlot() {
      this.iodaChartArray.push(this.dateRange)
    },
    deletePlot(index) {
      this.iodaChartArray.splice(index)
    },
  },
}
</script>
