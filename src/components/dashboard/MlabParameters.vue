<template>
  <div class="row justify-center">
    <h1>Mlab plots will appear here</h1>
    <div class="col-12">
      <div class="row justify-center">
        <div class="col-5">
          <network-search-bar bg="white" label="grey-8" input="black" labelTxt="Enter the ASN you are looking for" />
        </div>
        <div class="col-5">
          <q-date v-model="YearPicker" />
        </div>
        <div class="col-2">
          <button @click="addPlot()">Add Plot</button>
        </div>
      </div>
      <!-- <div class="q-pa-md">
        <div class="q-pb-sm">Model:{{ YearPicker }}</div>
        <div v-for="index in mlabChartArray.length" :key="index">
          <q-card class="IHR_charts-body">
            <q-card-section v-if="mlabChartArray[index]">
              <h1>{{ asNumber }}</h1>
              <h1 @click="deletePlot(index)">X</h1>
              <measurement-lab
                :start-time="getFrom(mlabChartArray[index])"
                :end-time="getFrom(mlabChartArray[index])"
                :ASN="asNumber"
                :fetch="fetch"
                ref="measurementLabChart"
              />
            </q-card-section>
          </q-card>
        </div>
      </div> -->
      <measurement-lab
        :start-time="getYear(2020 / 10 / 10)"
        :end-time="getYear(2020 / 10 / 10)"
        :ASN="asNumber"
        :fetch="fetch"
        ref="measurementLabChart"
      />
    </div>
  </div>
</template>

<script>
import NetworkSearchBar from './middleware/networkSearchBar.vue'
import YearPicker from './middleware/yearPicker.vue'
import MeasurementLab from './charts/MlabChart.vue'
export default {
  components: {
    NetworkSearchBar,
    YearPicker,
    MeasurementLab,
  },
  data() {
    let YearPicker
    let asNumber = '2497'
    let mlabChartArray = []
    return {
      asNumber: asNumber,
      YearPicker: YearPicker,
      mlabChartArray: mlabChartArray,
    }
  },
  methods: {
    getYear(YearPicker) {
      let year = new Date(YearPicker.year)
      console.log('getYear called')
      return year
    },
    addPlot() {
      this.mlabChartArray.push(this.YearPicker)
      console.log(this.YearPicker)
    },
    deletePlot(index) {
      this.mlabChartArray.splice(index)
    },
  },
}
</script>
