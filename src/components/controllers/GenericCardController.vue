<script setup>
import { QCard, QCardSection, QCardActions, QBar, QBtn, QSpace, QTooltip, copyToClipboard, QDialog } from 'quasar'
import { useRoute } from 'vue-router'
import { ref, computed } from 'vue'

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
  },
  infoTitle: {
    type: String,
    default: null
  },
  infoDescription: {
    type: String,
    default: null
  }
})

const route = useRoute()

const anchorUrl = ref(props.title.replaceAll(' ', '-'))
const infoDialog = ref(false)

const getInfo = () => {
  infoDialog.value = true
}

const getUrlAnchor = () => {
  let anchor  = `${window.location.href.replace(/#(?:.)*/gm, '')}#${anchorUrl.value}`
  anchor = anchor.replace(/active=(?:.)*&/gm, 'active=custom&')
  anchor = anchor.replace(/active=(?:.)*#/gm, 'active=custom#')
  return anchor
}
</script>

<template>
  <div>
    <QCard>
      <div :id="anchorUrl" class="anchor"></div>
      <QBar class="bar">
        <div>
          <div class="text-h6">{{ title }}</div>
          <div class="text-subtitle2">{{ subTitle }}</div>
        </div>
        <QSpace />
        <QBtn @click="copyToClipboard(getUrlAnchor())" dense flat icon="fa-solid fa-link">
          <QTooltip>
            Copy widget's URL
          </QTooltip>
        </QBtn>
        <QBtn v-if="infoTitle.includes('info.title')?false:true" @click="getInfo()" dense flat icon="fa-solid fa-circle-info"/>
      </QBar>
      <QCardSection>
        <slot></slot>
      </QCardSection>
    </QCard>
    <QDialog v-model="infoDialog">
      <QCard style="width: 1000px; height: auto;">
        <QCardSection>
          <div class="text-h6" v-html="infoTitle"></div>
        </QCardSection>
        <QCardSection class="q-pt-none" v-html="infoDescription">
        </QCardSection>
        <QCardActions align="right">
          <QBtn flat label="Close" color="primary" v-close-popup/>
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<style lang="stylus">
.bar
  height 100% !important
  background-color #263238 !important
  color white !important
.anchor
  display block
  position relative
  top -80px
  visibility hidden
</style>
