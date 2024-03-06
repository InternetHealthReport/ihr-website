<script setup>
import { ref, onMounted } from 'vue'
import { QDialog, QCard, QCardSection, QBtn } from 'quasar'

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}
const closeDialog = () => {
  dialog.value = false
}
const onAcceptClick = () => {
  localStorage.setItem('cookie-preference', true)
  closeDialog()
}
const onDeclineClick = () => {
  closeDialog()
}
onMounted(() => {
  const preferenceValue = localStorage.getItem('cookie-preference')
  if (preferenceValue === null || preferenceValue === undefined || preferenceValue !== 'true') {
    openDialog()
  }
})
</script>

<template>
  <QDialog v-model="dialog" persistent no-shake seamless :position="'bottom'">
    <QCard style="width: 350px; border-radius: 6px; background-color: #323232">
      <QCardSection class="items-center no-wrap cookieBanner_Container">
        <p class="cookieBanner_Message">
          This website use cookies, which are necessary for its functioning and required to achieve
          the purposes illustrated in the Data and Cookie policy.
        </p>
        <div class="cookieBanner_Buttons">
          <QBtn flat style="color: yellow" label="Accept" @click="onAcceptClick" />
          <QBtn flat style="color: darkgray" label="Decline" @click="onDeclineClick" />
        </div>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<style>
.fixed-bottom {
  right: 0px !important;
  bottom: 10px !important;
  left: auto !important;
}
.q-dialog__inner--minimized {
  padding: 10px !important;
}
.cookieBanner_Buttons {
  align-self: flex-end;
}
.cookieBanner_Container {
  display: flex;
  flex-direction: column;
}
.cookieBanner_Message {
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  color: white;
}
</style>