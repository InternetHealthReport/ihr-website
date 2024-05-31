<script setup>
import { QBtn, QSelect, QInput, QSlider, QBadge } from 'quasar'
import { ref } from 'vue'

const maxHops = ref('3')
const isPlaying = ref(false)

const toggleConnection = () => {
  isPlaying.value = !isPlaying.value
}
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
        v-model="model"
        :options="options"
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
      <QBtn @click="toggleConnection" color="secondary" :label="isPlaying ? 'Pause' : 'Play'" />
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