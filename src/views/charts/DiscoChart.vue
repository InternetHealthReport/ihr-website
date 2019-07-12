<template>
  <div class="IHR_disco-chart">
    <reactive-chart
      :layout="layout"
      :traces="traces"
      @loaded="loading = false"
      chart-title="Disconnection Events"
    />
    <div class="q-pa-md IHR_disco-progress">
      <q-linear-progress
        v-if="loading"
        :query="progress == null"
        :value="progress"
        :color="progress_color"
        class="q-mt-sm"
      />
      <div v-else class="row justify-around">
        <date-time-picker
          class="col-2"
          :min="minTime"
          :max="maxTime"
          :value="localStartTime"
          @input="localStartTime = $event; timeRange.min = $event.getTime();"
        />
        <q-range
          class="col-7"
          :min="minTime.getTime()"
          :max="maxTime.getTime()"
          v-model="timeRange"
          label
          drag-range
          @change="updateRange"
          :left-label-value="leftLabel"
          :right-label-value="rigthLabel"
        />
        <date-time-picker
          class="col-2"
          :min="minTime"
          :max="maxTime"
          :value="localEndTime"
          @input="localEndTime = $event; timeRange.max = $event.getTime();"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { debounce } from 'quasar'
import ReactiveChart from "@/components/ReactiveChart";
import DateTimePicker from "@/components/DateTimePicker";
import { DiscoEventQuery, PROJECT_START_DATE } from "@/plugins/IhrApi";

function timestampToUTC(timestamp) {
  return new Date(timestamp).toUTCString();
}

export default {
  components: {
    ReactiveChart,
    DateTimePicker
  },
  props: {
    streamName: {
      type: Number,
      required: true
    },
    startTime: {
      type: Date,
      require: true
    },
    endTime: {
      type: Date,
      require: true
    }
  },
  data() {
    let filter = new DiscoEventQuery()
      .streamName(this.streamName)
      .timeInterval(this.startTime, this.endTime)
      .orderedByStartTime();

    //prevent calls within 500ms and execute only the last one
    let debouncedApiCall = debounce(()=>{
        this.queryDiscoApi();
    }, 800, false);


    let startTime = new Date(this.startTime);
    let endTime = new Date(this.endTime);
    let today = new Date();
    return {
      debouncedApiCall: debouncedApiCall,
      minTime: PROJECT_START_DATE,
      maxTime: today,
      localStartTime: startTime,
      localEndTime: endTime,
      loading: true,
      filter: filter,
      progress: null,
      timeRange: { min: startTime.getTime(), max: endTime.getTime() },
      traces: [{
        x: [],
        y: [],
        z: [],
        yaxis: 'y',
        name: 'Disconnection Level',
        showlegend: false,
        line: {shape: 'hv'}
      }],
      layout: {
        hovermode: "closest",
        yaxis: {
          title: "Disconnection Level",
          autorange: true,
          automargin: true
        },
        margin: {
          t: 50,
          b: 50
        },
        height: 350,
        showlegend: true,
        legend: {
          x: 0,
          y: 1.2,
          orientation: "h"
        }
      }
    };
  },
  mounted() {
    this.debouncedApiCall();
  },
  methods: {
    updateRange(range) {
      //no reactivity using setTime, I'm sad to do a useless new....
      this.localStartTime = new Date(range.min);
      this.localEndTime = new Date(range.max);
    },
    queryDiscoApi(){
        this.loading = true;
        this.$ihr_api.disco_events(
        this.filter,
        result => {
          this.fetchDiscoData(result.results);
          this.loading = false;
        },
        error => {
          console.error(error); //FIXME do a correct alert
          this.progress = 1;
        }
        );
    },
    fetchDiscoData(data) {
      let trace = this.traces[0];
      trace.x = [];
      trace.y = [];
      trace.z = [];

      trace.x.push(this.localStartTime.toUTCString());
      trace.y.push(0);
      trace.z.push(0);

      data.forEach(elem => {
        trace.x.push(elem.starttime);
        trace.y.push(elem.avglevel);
        trace.z.push(elem.id);

        trace.x.push(elem.endtime);
        trace.y.push(0);
        trace.z.push(elem.id);
      });

      trace.x.push(this.localEndTime.toUTCString());
      trace.y.push(0);
      trace.z.push(0);
    }
  },
  computed: {
    progress_color() {
      return this.progress == null ? "secondary" : "negative";
    },
    leftLabel() {
      this.filter.startTime(this.localStartTime, DiscoEventQuery.GTE);
      this.debouncedApiCall();
      return timestampToUTC(this.timeRange.min);
    },
    rigthLabel() {
      this.filter.endTime(this.localEndTime, DiscoEventQuery.LTE);
      this.debouncedApiCall();
      return timestampToUTC(this.timeRange.max);
    }
  }
};

</script>

<style lang="stylus">
.IHR_
  &disco-chart
    text-align center

    & > .IHR_disco-progress
      width 98%
      margin 0 auto

    & h1
      font-size 25pt
      margin-bottom 0px
      font-weight 400
      line-height 1
</style>
