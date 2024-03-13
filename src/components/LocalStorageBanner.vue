<script setup>
import { ref, onMounted } from 'vue'
import { QCard, QCardSection, QCardActions, QBtn } from 'quasar'

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}
const closeDialog = () => {
  dialog.value = false
}
const onAcceptClick = () => {
  localStorage.setItem('storage-allowed', true)
  closeDialog()
}
const onDeclineClick = () => {
  closeDialog()
}
onMounted(() => {
  const preferenceValue = JSON.parse(localStorage.getItem('storage-allowed'))
  if (preferenceValue === null || preferenceValue === undefined || preferenceValue !== true) {
    openDialog()
  }
})
</script>

<template>
  <QCard class="fixed-bottom">
    <QCardSection class="text">
      We use local storage to enhance your experience on our website.
      By clicking &#39;Accept&#39;, you agree to allow us to store and access data on your device.
      This helps us personalize content, remember preferences, and provide seamless
      functionality. Your data is secure and will not be shared with third parties.
      Thank you for trusting us with your browsing experience!
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
  width: 500px;
  background-color: #263238 !important;
}
.text {
  color: white;
  font-size: medium;
}
</style>