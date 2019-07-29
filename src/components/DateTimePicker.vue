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
              :value="selectedDateTime"
              @input="propagate($event)"
              :mask="$ihrStyle.dateTimeFormat"
              :options="options"
            />
          </q-popup-proxy>
        </q-icon>
      </template>
      <template v-slot:append v-if="!hideTime">
        <q-icon name="fas fa-clock" class="cursor-pointer" :class="textColor">
          <q-popup-proxy transition-show="scale" transition-hide="scale" target>
            <q-time
              :value="selectedDateTime"
              @input="propagate($event)"
              :mask="$ihrStyle.dateTimeFormat"
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
import { date } from "quasar";

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
    return {
      myId: `date-time-picker-${this._uid}`,
      selectedDateTime: date.formatDate(this.value, this.$ihrStyle.dateTimeFormat)
    };
  },
  methods: {
    options(selectDate) {
      selectDate = new Date(selectDate);
      return selectDate >= this.min && selectDate <= this.max;
    },
    propagate(event) {
      let selectedDate = new Date(event);
      this.selectedDateTime = date.formatDate(selectedDate, this.$ihrStyle.dateTimeFormat);
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
