<script setup>
import { ref, onMounted } from 'vue'

const dialog = ref(false)

const openDialog = () => {
  dialog.value = true
}
onMounted(() => {
  if (
    localStorage.getItem('cookie_preference') === null ||
    localStorage.getItem('cookie_preference') === undefined
  ) {
    openDialog()
  }
})
const onAcceptClick = () => {
  localStorage.setItem('cookie_preference', true)
  dialog.value = false
}
const onDeclineClick = () => {
  dialog.value = false
}
</script>

<template>
  <q-dialog v-model="dialog" persistent no-shake seamless :position="'bottom'">
    <q-card style="width: 350px; border-radius: 6px; background-color: #323232">
      <q-card-section class="items-center no-wrap cookieBanner_Container">
        <p class="cookieBanner_Message">
          This website use cookies, which are necessary for its functioning and required to
          achieve the purposes illustrated in the Data and Cookie policy.
        </p>
        <div class="cookieBanner_Buttons">
          <q-btn flat style="color: yellow" label="Accept" @click="onAcceptClick" />
          <q-btn flat style="color: darkgray" label="Decline" @click="onDeclineClick" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
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