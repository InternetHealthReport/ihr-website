<template>
  <div>
    <div>
      <date-time-picker
        :min="minTime"
        :max="localEndtime"
        :value="localStartTime"
        @input="localStartTime = $event; debouncedEmit();"
        :white="white"
        hideTime
      />
    </div>
    <div>
      <date-time-picker
        :min="minTime"
        :max="maxTime"
        :value="localEndtime"
        @input="localEndtime = $event; debouncedEmit();"
        :white="white"
        hideTime
      />
    </div>
  </div>
</template>

<script>
import { debounce } from "quasar";
import DateTimePicker from "@/components/DateTimePicker";
import { PROJECT_START_DATE, Query } from "@/plugins/IhrApi";

const DEBOUNCE_TIME = 800;

class ChartInterval {
  constructor(begin, end) {
    this.begin = begin;
    this.end = end;
  }

  static today() {
    let today = new ChartInterval(new Date(), new Date());
    return today.trim();
  }

  static lastWeek() {
    let result = ChartInterval.today();
    result.begin.setUTCDate(result.begin.getUTCDate() - 7);
    return result;
  }

  setIntevalTime(beginTimestamp, endTimestamp) {
    this.begin.setTime(beginTimestamp);
    this.end.setTime(endTimestamp);
  }

  trim() {
    this.begin.setUTCHours(0, 0, 0, 0);
    this.end.setUTCDate(this.end.getUTCDate() + 1);
    this.end.setUTCHours(0, 0, 0, 0);
    return this;
  }
};

export default {
  components: {
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
    };
  },
  computed: {
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

