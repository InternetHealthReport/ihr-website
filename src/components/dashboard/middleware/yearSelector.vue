<template>
  <q-input readonly input-class="cursor-pointer" label="Select a Year" :value="getMonthPicked()" @click="$refs.monthPicker.show()">
    <template v-slot:append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy ref="monthPicker" transition-show="scale" transition-hide="scale">
          <q-date minimal emit-immediately default-view="Years" v-model="monthPicked" @input="checkValue" />
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script>
export default {
  data() {
    return {
      monthPicked: null,
    }
  },
  methods: {
    getMonthPicked() {
      let fullDate = this.monthPicked
      if (fullDate != null) {
        return fullDate.substring(0, 4)
      }
    },
    checkValue(val, reason, details) {
      if (reason === 'year') {
        this.$refs.monthPicker.hide()
      }
    },
  },
}
</script>
