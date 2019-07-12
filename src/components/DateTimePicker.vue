<template>
  <q-input filled
      :value="dateToString"
      @input="validateAndPropagate($event)">
    <template v-slot:prepend>
      <q-icon name="fas fa-calendar-day" class="cursor-pointer">
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
      <q-icon name="fas fa-clock" class="cursor-pointer">
        <q-popup-proxy transition-show="scale" transition-hide="scale">
          <q-time
            :value="dateToString"
            @input="propagate($event)"
            :mask="TIME_FORMAT"
            format24h
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
  }
};
</script>

<style>
</style>
