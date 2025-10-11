<script setup>
import Tr from '@/i18n/translation'
import { ref } from 'vue'
import { QBtn, QMenu, QList, QItem, QItemSection } from 'quasar'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const supportedLocales = ref(Tr.supportedLocales)

const switchLanguage = async (newLocale) => {
  await Tr.switchLanguage(newLocale)
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: route.query
    })
  )
}
</script>

<template>
  <QBtn
    flat
    icon="fa-solid fa-language"
  >
    <QMenu>
      <QList>
        <QItem
          v-for="loc in supportedLocales"
          :key="loc"
          v-close-popup
          clickable
          @click="switchLanguage(loc)"
        >
          <QItemSection>{{ $t(`locale.${loc}`) }}</QItemSection>
        </QItem>
      </QList>
    </QMenu>
  </QBtn>
</template>

<style></style>
