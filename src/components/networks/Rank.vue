<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import RankCustom from '@/components/networks/rank/RankCustom.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const activeTab = 'custom'
const activeMenu = route.query.active ? route.query.active : activeTab

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const rank = ref(route.params.rank)
const rankName = ref(null)
const menu = ref(activeMenu)

const getInfo = () => {
  const query = `MATCH (r:Ranking {name: $rank})
      RETURN r.name AS name`
  return [{ statement: query, parameters: { rank: rank.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    rankName.value = res[0][0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const pageTitle = computed(() => {
  return rankName.value
})

watch(
  () => route.params.rank,
  (newRank) => {
    if (newRank != rank.value) {
      rank.value = newRank
      if (rank.value) {
        menu.value = activeTab
        fetchData()
      }
    }
  }
)
watch(menu, () => {
  if ('display' in route.query) {
    delete route.query.display
  }
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        active: menu.value
      })
    })
  )
})
onMounted(() => {
  if (rank.value) {
    fetchData()
  } else {
    router.push(
      Tr.i18nRoute({
        name: 'rank'
      })
    )
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <h3 class="text-center">
      <div>Weekly report</div>
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
        <QTab name="custom">Custom</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels v-model="menu" v-if="pageTitle">
        <QTabPanel name="custom">
          <RankCustom :rank="rank" :page-title="pageTitle" :hash="routeHash" />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style>
.cards {
  display: inline-block;
}
</style>
