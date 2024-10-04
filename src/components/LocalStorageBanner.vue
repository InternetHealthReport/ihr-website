<script setup>
import { ref, onMounted } from 'vue'
import { QCard, QCardSection, QCardActions, QBtn } from 'quasar'
import { get, set } from 'idb-keyval'

const props = defineProps({
  disable: {
    type: Boolean,
    default: false
  }
})

const banner = ref(true)

const onAcceptClick = async () => {
  await set('storage-allowed', true)
  banner.value = false
}
const onDeclineClick = () => {
  banner.value = false
}
onMounted(async () => {
  if (!props.disable) {
    const preferenceValue = await get('storage-allowed')
    if (preferenceValue === null || JSON.parse(preferenceValue) === false) {
      banner.value = true
    } else {
      banner.value = false
    }
  } else {
    onAcceptClick()
  }
})
</script>

<template>
  <QCard v-if="banner" dark class="fixed-bottom" wrap-text>
    <QCardSection class="text">
      We use local storage to enhance your experience on our website. By clicking &#39;Accept&#39;,
      you agree to allow us to store and access data on your device. This helps us personalize
      content, remember preferences, and provide seamless functionality. Your data is secure and
      will not be shared with third parties. Thank you for trusting us with your browsing
      experience!
    </QCardSection>
    <QCardActions align="right">
      <QBtn flat color="green" label="Accept" @click="onAcceptClick" />
      <QBtn flat color="red" label="Decline" @click="onDeclineClick" />
    </QCardActions>
  </QCard>
</template>

<style>
.fixed-bottom {
  right: 10px !important;
  bottom: 10px !important;
  left: auto !important;
  z-index: 10000;
  width: 100%;
  max-width: 500px;
  background-color: #263238 !important;
}
.text {
  color: white;
  font-size: medium;
}
</style>
