<script setup>
import { ref, onMounted, inject } from 'vue'
import { uid } from 'quasar'

const library_delayer = inject('library_delayer')

const props = defineProps({
  probeIds: {
    type: Array,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
})

const myId = ref(`tracemonWidget${uid()}`)
const tracemon = ref(null)

const getTimestamp = (datetime) => {
  return Math.ceil(datetime.getTime() / 1000)
}

onMounted(() => {
  library_delayer.load('tracemon_widget', () => {
    tracemon.value = initTracemon(
      `#${myId.value}`,
      {},
      {
        measurements: props.probeIds,
        startTimestamp: getTimestamp(props.startTime),
        stopTimestamp: getTimestamp(props.endTime),
      }
    )
  })
})
</script>

<template>
  <div :id="myId"></div>
</template>