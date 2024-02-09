<script setup>
import { QCard, QCardSection, QBar, QBtn, QSpace, QTooltip, copyToClipboard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String
  },
  subTitle: {
    type: String
  },
  reportDay: {
    type: Number,
    default: null
  }
})

const route = useRoute()

const showReportDayRange = ref(false)
const anchorUrl = ref(props.title.replaceAll(' ', '-'))

const reportDayText = computed(() => {
  if (props.reportDay) {
    return `${props.reportDay}-day report`
  }
  return 'Weekly report'
})

const getUrlAnchor = () => {
  let anchor  = `${window.location.href.replace(/#(?:.)*/gm, '')}#${anchorUrl.value}`
  anchor = anchor.replace(/active=(?:.)*&/gm, 'active=custom&')
  anchor = anchor.replace(/active=(?:.)*#/gm, 'active=custom#')
  return anchor
}
</script>

<template>
    <QCard>
      <div :id="anchorUrl" class="anchor"></div>
      <QBar class="bar">
        <div>
          <div class="text-h6">{{ title }}</div>
          <div class="text-subtitle2">{{ subTitle }}</div>
        </div>
        <QSpace />
        <QBtn @click="showReportDayRange = !showReportDayRange" dense flat icon="fa-solid fa-calendar">
          <QTooltip v-model="showReportDayRange" no-parent-event>
            {{ reportDayText }}
          </QTooltip>
        </QBtn>
        <QBtn @click="copyToClipboard(getUrlAnchor())" dense flat icon="fa-solid fa-anchor">
          <QTooltip>
            Copy widget's URL
          </QTooltip>
        </QBtn>
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
.anchor
  display block
  position relative
  top -80px
  visibility hidden
</style>