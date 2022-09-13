<template>
  <div class="row justify-center">
    <h1>IODA plots will appear here</h1>
    <div class="col-12">
      <network-search-bar bg="white" label="grey-8" input="black" labelTxt="Enter the ASN you are looking for" />
      <date-time-picker :min="minDate" :max="maxDate" @input="setReportDate" :value="maxDate" hideTime class="IHR_subtitle_calendar" />
      <!-- <h1>{{ interval.end }}</h1>
      <h1>{{ interval.begin }}</h1> -->
      <h1>{{ interval.exact }}</h1>
    </div>
  </div>
</template>

<script>
import reportMixin from './middleware/reportMixin.vue'
// import reportMixin from '../../views/mixin/reportMixin.vue'
import NetworkSearchBar from '../../components/search_bar/NetworkSearchBar.vue'
import DateTimePicker from '../../components/DateTimePicker.vue'
export default {
  mixins: [reportMixin],
  components: {
    NetworkSearchBar,
    DateTimePicker,
  },
}
</script>

DateTimePicker
