<template>
  <div :id="myId" class="IHR_date-time-picker">
    <q-input
      filled
      v-model="selectedDateTime"
      :dark="white"
      class="IHR_date-input"
      readonly
      hide-bottom-space
      square
      dense
    >
      <template v-slot:prepend>
        <q-icon name="fas fa-calendar-day" class="cursor-pointer" :class="textColor">
          <q-popup-proxy transition-show="scale" transition-hide="scale" :target="`#${myId}`">
            <q-date
              :value="qTimeModel"
              @input="propagate($event)"
              :mask="mask"
              :options="options"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
      <template v-slot:append v-if="!hideTime">
        <q-icon name="fas fa-clock" class="cursor-pointer" :class="textColor">
          <q-popup-proxy transition-show="scale" transition-hide="scale" target>
            <q-time
              :value="qTimeModel"
              @input="propagate($event)"
              :mask="mask"
              format24h
              color="white"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
    </q-input>
  </div>
</template>
<script>
const QTIME_MASK = "YYYY-MM-DDTHH:mm:ss.SSS";

export default {
  props: {
    value: {
      type: Date,
      require: true
    },
    min: {
      type: Date,
      require: true,
      default: () => {
        return new Date();
      }
    },
    max: {
      type: Date,
      require: true,
      default: () => {
        return new Date();
      }
    },
    white: {
      type: Boolean
    },
    hideTime: {
      type: Boolean,
      default: false
    }
  },
  data() {
    console.log(this.value.toISOString())
    return {
      myId: `dateTimePicker${this._uid}`,
      selectedDateTime: this.$options.filters.ihrUtcString(this.value),
      mask: QTIME_MASK,
      qTimeModel: this.value.toISOString()
    };
  },
  methods: {
    options(selectDate) {
      selectDate = new Date(selectDate);
      return selectDate >= this.min && selectDate <= this.max;
    },
    propagate(event) {
      let selectedDate = new Date(event+"Z");
      let isoDate = selectedDate.toISOString();
      isoDate = isoDate.substring(0, isoDate.length - 1);
      this.qTimeModel = isoDate;
      this.selectedDateTime = this.$options.filters.ihrUtcString(selectedDate),
      this.$emit("input", selectedDate);
    }
  },
  computed: {
    textColor() {
      return this.white ? "IHR_white-text" : "IHR_black-text";
    }
  }
};
</script>

<style lang="stylus" scoped>
.IHR_
  &date-time-picker
    cursor pointer

  &white-text
    color white

  &black-text
    color black

  &date-input
    font-weight bolder
</style>
