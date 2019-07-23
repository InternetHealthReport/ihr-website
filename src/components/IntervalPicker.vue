<template>
  <div>
    <div class="row justify-around">
      <date-time-picker
        class="col-2"
        :min="minTime"
        :max="maxTime"
        :value="localStartTime"
        @input="localStartTime = $event; timeRange.min = $event.getTime();"
        :white="white"
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
        :value="localEndtime"
        @input="localEndtime = $event; timeRange.max = $event.getTime();"
        :white="white"
      />
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import ReactiveChart from "@/components/ReactiveChart";
import DateTimePicker from "@/components/DateTimePicker";
import { PROJECT_START_DATE, Query } from "@/plugins/IhrApi";

function timestampToUTC(timestamp) {
  return new Date(timestamp).toUTCString();
}

const DEBOUNCE_TIME = 800;

class ChartInterval {
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  static today() {
    let today = new Date();
    return new ChartInterval(
      new Date(today.setHours(0, 0, 0, 0)),
      new Date(today.setHours(23, 59, 59, 0))
    );
  }

  setIntevalTime(beginTimestamp, endTimestamp) {
    this.begin.setTime(beginTimestamp);
    this.end.setTime(endTimestamp);
  }
};

export default {
  components: {
    ReactiveChart,
    DateTimePicker
  },
  props: {
    value: {
      type: ChartInterval,
      require: true
    },
    white: {
      type: Boolean
    }
  },
  data() {
    let debouncedEmit = debounce(
      () => {
        this.$emit("input", new ChartInterval(this.localStartTime, this.localEndtime));
      },
      DEBOUNCE_TIME,
      false
    );

    return {
      debouncedEmit: debouncedEmit,
      minTime: PROJECT_START_DATE,
      maxTime: new Date(),
      localStartTime: new Date(this.value.begin),
      localEndtime: new Date(this.value.end),
      timeRange: { min: this.value.begin.getTime(), max: this.value.end.getTime() }
    };
  },
  mounted() {
  },
  methods: {
    updateRange(range) {
      //no reactivity using setTime, I'm sad to do a useless new....
      this.localStartTime = new Date(this.timeRange.min);
      this.localEndtime = new Date(this.timeRange.max);
    }
  },
  computed: {
    leftLabel() {
      this.debouncedEmit();
      return timestampToUTC(this.timeRange.min);
    },
    rigthLabel() {
      this.debouncedEmit();
      return timestampToUTC(this.timeRange.max);
    },
    textColor() {
      return this.white?"IHR_white-text":"IHR_black-text";
    }
  }
};

export { ChartInterval };
</script>

<style lang="stylus" scoped>
.IHR_
    &white-text
      color white

    &black-text
      color black
</style>

