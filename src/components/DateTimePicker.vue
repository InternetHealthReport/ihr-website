<script setup>
import { ref, computed } from 'vue'
import { QIcon, QPopupProxy, QDate } from 'quasar'
import report from '@/plugins/report'

const QTIME_MASK = 'YYYY-MM-DDTHH:mm:ss.SSSZ'

const props = defineProps({
  value: {
    type: Date,
    required: true,
  },
  min: {
    type: Date,
    required: true,
    default: () => {
      return new Date()
    },
  },
  max: {
    type: Date,
    required: true,
    default: () => {
      return new Date()
    },
  },
  white: {
    type: Boolean,
  },
  hideTime: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits({
  'input': (selectedDate) => {
    if (selectedDate !== null) {
      return true
    } else {
      return false
    }
  }
})

const { utcString } = report()

const selectedDateTime = ref(utcString(props.value))
const mask = ref(QTIME_MASK)
const qTimeModel = ref(props.value.toISOString())
const show = ref(false)

const options = (selectDate) => {
  selectDate = new Date(selectDate)
  return selectDate >= props.min && selectDate <= props.max
}

const propagate = (event) => {
  if(event === null) {
    return
  }
  const selectedDate = new Date(event)
  qTimeModel.value = selectedDate.toISOString()
  selectedDateTime.value = utcString(selectedDate)
  show.value = false
  emits('input', selectedDate)
}

const textColor = computed(() => {
  return props.white ? 'IHR_white-text' : 'IHR_black-text'
})
</script>

<template>
  <QIcon name="fas fa-calendar-day" class="cursor-pointer" :class="textColor">
    <QPopupProxy id="popupid" v-model="show">
      <QDate v-model="qTimeModel" @update:model-value="propagate($event)" :mask="mask" :options="options" color="accent" minimal />
    </QPopupProxy>
  </QIcon>
</template>

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