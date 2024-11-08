<script setup>
import { ref, onMounted, inject } from 'vue'
import { uid } from 'quasar'

const library_delayer = inject('library_delayer')

const props = defineProps({
  startTime: {
    type: Date,
    required: true
  },
  stopTime: {
    type: Date,
    required: true
  },
  msmPrbIds: {
    type: Object,
    required: true
  }
})

const getTimestamp = (datetime) => {
  return Math.ceil(datetime.getTime() / 1000)
}

const myId = ref(`latencymonWidget${uid()}`)
const startTimestamp = ref(getTimestamp(props.startTime))
const stopTimestamp = ref(getTimestamp(props.stopTime))
const lm = ref(null)

const targetName = (msmid) => {
  const names = {
    1001: 'K-root servers',
    1006: 'M-root servers',
    1010: 'B-root servers',
    1030: 'Atlas Controller',
    1591146: 'Google DNS'
  }

  if (msmid in names) {
    return names[msmid]
  } else {
    return msmid.toString()
  }
}

onMounted(() => {
  library_delayer.load('latencymon_widget', () => {
    let lm_grp = []

    // Make latencymon groups
    for (let msms in props.msmPrbIds) {
      lm_grp.push({
        id: targetName(msms),
        measurementId: Number(msms),
        probes: props.msmPrbIds[msms],
        type: 'multi-probes'
      })
    }

    try {
      //see https://atlas.ripe.net/docs/tools-latencymon/ for more options and details
       
      lm.value = initLatencymon(
        `#${myId.value}`,
        {
          autoStartGrouping: false
        },
        {
          measurements: Object.keys(props.msmPrbIds), //measurements: [1030, 1031],
          startTimestamp: startTimestamp.value, //startTimestamp: 1580422400,
          stopTimestamp: stopTimestamp.value, // stopTimestamp:  1580508800,
          syncWithRealTimeData: false,
          groups: lm_grp
        }
      )
    } catch (err) {
      console.error(err) //TODO better error handling
    }
  })
})
</script>

<template>
  <div
    :id="myId"
    class="IHR_nowrap"
  />
</template>

<style>
.latencymon-container .probe-multi-info .probe-info-line {
  white-space: normal !important;
  margin-top: 10px !important;
}
.IHR_nowrap {
  white-space: normal !important;
}
</style>
