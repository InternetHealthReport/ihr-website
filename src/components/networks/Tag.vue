<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import TagOverview from '@/components/networks/tag/TagOverview.vue'
import TagCustom from '@/components/networks/tag/TagCustom.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const activeTab = 'custom'
const activeMenu = route.query.active ? route.query.active : activeTab

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const tag = ref(route.params.tag)
const tagName = ref(null)
const menu = ref(activeMenu)

const getInfo = () => {
  const query = `MATCH (t:Tag {label: $tag})
      RETURN t.label AS label`
  return [{ statement: query, parameters: { tag: tag.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    tagName.value = res[0][0].label
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const pageTitle = computed(() => {
  return tagName.value
})

watch(() => route.params.tag, (newTag) => {
  if (newTag != tag.value) {
    tag.value = newTag
    if (tag.value) {
      menu.value = activeTab
      fetchData()
    }
  }
})
watch(menu, () => {
  if ('display' in route.query) {
    delete route.query.display
  }
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      active: menu.value
    })
  }))
})
onMounted(() => {
  if (tag.value) {
    fetchData()
  } else {
    router.push(Tr.i18nRoute({
      name: 'tag',
    }))
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <h3 class="text-center">
      <div>
        Weekly report
      </div>
    </h3>
    <QCard flat>
      <QTabs
        v-model="menu"
        dense
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <!-- <QTab name="overview">Overview</QTab> -->
        <QTab name="custom">Custom</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels
        v-model="menu"
        v-if="pageTitle"
      >
        <!-- <QTabPanel name="overview">
          <TagOverview
            :tag="tag"
          />
        </QTabPanel> -->
        <QTabPanel name="custom">
          <TagCustom
            :tag="tag"
            :hash="routeHash"
          />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus">
.cards
  display inline-block
</style>