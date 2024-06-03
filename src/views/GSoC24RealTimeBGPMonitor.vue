<script setup>
import { QBtn, QSelect, QInput, QSlider } from 'quasar'
import { onMounted, ref, watch } from 'vue'

const maxHops = ref('3')
const isPlaying = ref(false)
const rrcList = ref([])
const disableButton = ref(false)
const socket = ref(null)

const params = ref({
  peer: '',
  path: '',
  prefix: ['170.238.225.0/24'],
  type: 'UPDATE',
  require: '',
  moreSpecific: true,
  lessSpecific: false,
  host: '',
  socketOptions: {
    includeRaw: false,
    acknowledge: false
  }
})

const sendSocketType = (protocol, paramData) => {
  socket.value.send(
    JSON.stringify({
      type: protocol,
      data: paramData
    })
  )
}

const toggleRisProtocol = () => {
  if (!socket.value) {
    connectWebSocket()
  } else if (rrcList.value.length === 0) {
    sendSocketType('request_rrc_list', null)
  } else if (isPlaying.value) {
    sendSocketType('ris_subscribe', params.value)
  } else {
    socket.value.close()
  }
}

const connectWebSocket = () => {
  socket.value = new WebSocket('wss://ris-live.ripe.net/v1/ws/?client=ihr')
  if (socket.value.readyState === WebSocket.CONNECTING) {
    disableButton.value = true
  }
  socket.value.onopen = () => {
    disableButton.value = false
    toggleRisProtocol()
  }
  socket.value.onclose = () => {
    socket.value = null
  }
  socket.value.onerror = (error) => {
    console.log('WebSocket Error:', error)
  }
  socket.value.onmessage = (event) => {
    const res = JSON.parse(event.data)
    if (res.type === 'ris_message') {
      console.log(res.data)
    } else if (res.type === 'ris_rrc_list') {
      rrcList.value = res.data
    } else if (res.type === 'ris_error') {
      console.log('Ris Live Error:', res.data.message)
    }
  }
}

const toggleConnection = () => {
  isPlaying.value = !isPlaying.value
}

watch(isPlaying, () => {
  toggleRisProtocol()
})

watch(rrcList, () => {
  if (rrcList.value.length > 0) {
    params.value.host = rrcList.value[0]
  }
})

onMounted(() => {
  connectWebSocket()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <h1 class="text-center q-pa-xl">Real-Time BGP Monitor</h1>
    <div class="controls justify-center q-pa-md flex">
      <QInput outlined v-model="ph" placeholder="Prefix" :dense="true" color="accent" />
      <QInput outlined v-model="ph" placeholder="ASN" :dense="true" color="accent" />
      <QSelect
        style="min-width: 100px"
        filled
        v-model="params.host"
        :options="rrcList"
        label="RRC"
        :dense="true"
        color="accent"
      />
      <QSlider
        style="max-width: 250px"
        v-model="maxHops"
        :min="1"
        :max="9"
        :step="1"
        label-always
        snap
        label
        :label-value="'Max Hops: ' + maxHops"
        color="accent"
        marker-labels
      />
    </div>
    <div class="controls justify-center q-pa-md flex">
      <QBtn
        @click="toggleConnection"
        color="secondary"
        :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
        :disable="disableButton"
      />
      <div class="replayControls flex">
        <QBtn color="secondary" label="<" />
        <QBtn color="secondary" label="Replay" />
        <QBtn color="secondary" label=">" />
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.controls{
	gap: 30px;
}
.replayControls{
	gap: 20px;
}
</style>