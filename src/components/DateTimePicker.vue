<template>
  <q-input filled
      :value="dateToString"
      @input="validateAndPropagate($event)"
      :dark="white" class="IHR_date-input">
    <template v-slot:prepend>
      <q-icon name="fas fa-calendar-day" class="cursor-pointer" :class="textColor">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-date
            :value="dateToString"
            @input="propagate($event)"
            :mask="TIME_FORMAT"
            :options="options"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
    <template v-slot:append>
      <q-icon name="fas fa-clock" class="cursor-pointer" :class="textColor">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-time
            :value="dateToString"
            @input="propagate($event)"
            :mask="TIME_FORMAT"
            format24h
            color="white"
          />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>
<script>
const TIME_FORMAT = "YYYY-MM-DDTHH:MMZ";

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
    }
  },
  data() {
    return {
      TIME_FORMAT: TIME_FORMAT
    };
  },
  methods: {
    options(date) {
      date = new Date(date);
      return date >= this.min && date <= this.max;
    },
    propagate(event) {
      this.$emit("input", new Date(event));
    },
    validateAndPropagate(event) {
      let newDate = new Date(event);
      if(!isNaN(newDate))
        this.$emit("input", newDate);
    }
  },
  computed: {
    dateToString() {
      return this.value.toUTCString();
    },
    textColor() {
      return this.white?"IHR_white-text":"IHR_black-text";
    }
  }
};
</script>

<style lang="stylus" scoped>
.IHR_
    &white-text
      color white

    &black-text
      color black
    
    &date-input
      font-weight bolder
</style>
