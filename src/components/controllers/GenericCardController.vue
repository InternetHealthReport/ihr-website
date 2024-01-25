<script setup>
import { QCard, QCardSection, QBar, QBtn, QSpace } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String
  },
  subTitle: {
    type: String
  }
})
</script>

<template>
  <QCard>
    <QBar class="bar">
      <div>
        <div class="text-h6">{{ title }}</div>
        <div class="text-subtitle2">{{ subTitle }}</div>
      </div>
      <QSpace />
      <QBtn dense flat icon="fa-solid fa-circle-info"/>
    </QBar>
    <QCardSection>
      <slot></slot>
    </QCardSection>
  </QCard>
</template>

<style lang="stylus">
.bar
  height 100% !important
</style>