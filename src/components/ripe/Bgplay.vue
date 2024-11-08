<script setup>
import { QCard, QCardSection, QSpinner, uid } from 'quasar'
import { ref, onMounted, watch, computed, inject } from 'vue'

const library_delayer = inject('library_delayer')

const props = defineProps({
  asNumber: {
    type: Number,
    required: true
  },
  dateTime: {
    type: Date,
    required: true
  },
  intervalLength: {
    type: Number,
    default: 3600 //length of interval in seconds
  }
})

const myId = ref(`bgplayContainer${uid()}`)
const bgplay = ref(null)
const loaded = ref(null)

const asName = computed(() => {
  return `AS${props.asNumber}`
})

const startTime = computed(() => {
  return props.dateTime.getTime() / 1000 - props.intervalLength / 2
})

const endTime = computed(() => {
  return props.dateTime.getTime() / 1000 + props.intervalLength / 2
})

watch(
  () => props.asNumber,
  (oldValue, newValue) => {
    if (oldValue == newValue) {
      return
    }
    bgplay.value.shell.set_params({ resource: asName.value })
  }
)
watch(
  () => props.dateTime,
  (oldValue, newValue) => {
    if (oldValue == newValue) {
      return
    }
    bgplay.value.shell.set_params({
      starttime: startTime.value,
      endtime: endTime.value
    })
  }
)
watch(
  () => props.intervalLength,
  (oldValue, newValue) => {
    if (oldValue == newValue) {
      return
    }
    bgplay.value.shell.set_params({
      starttime: startTime.value,
      endtime: endTime.value
    })
  }
)

onMounted(() => {
  library_delayer.load('bgplay_api', () => {
    bgplay.value = BGPlayWidget(
      'BGPlay',
      myId.value,
      {
        width: '100vw',
        height: 800
      },
      {
        unix_timestamps: 'TRUE',
        ignoreReannouncements: 'true',
        resource: asName.value,
        starttime: startTime.value,
        endtime: endTime.value,
        rrcs: '10',
        type: 'bgp'
      }
    )
    loaded.value = true
  })
})
</script>

<template>
  <div>
    <QCard
      v-if="loaded === false"
      negative
    >
      <QCardSection> {{ $t('genericErrors.cloudNotLoad') }} BGPlay </QCardSection>
    </QCard>
    <div
      v-if="loaded === null"
      class="IHR_loading-spinner"
    >
      <QSpinner
        color="secondary"
        size="15em"
      />
    </div>
    <div :id="myId" />
  </div>
</template>

<style></style>
