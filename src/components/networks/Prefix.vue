<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import PrefixOverview from '@/components/networks/prefix/PrefixOverview.vue'
import PrefixRouting from '@/components/networks/prefix/PrefixRouting.vue'
import PrefixDNS from '@/components/networks/prefix/PrefixDNS.vue'
import PrefixCustom from '@/components/networks/prefix/PrefixCustom.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const activeMenu = route.query.active ? route.query.active : 'overview'

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const host = ref(route.params.id)
const prefixLength = ref(Number(route.params.length))
const hostName = ref(null)
const menu = ref(activeMenu)

const getInfo = () => {
  const query = `MATCH (p:Prefix {prefix: $prefix})
      OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
      RETURN head(collect(DISTINCT(o.descr))) AS name`
  return [{ statement: query, parameters: { prefix: getPrefix() } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    hostName.value = res[0][0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const pageTitle = computed(() => {
  return `${getPrefix()} - ${hostName.value}`
})

const getPrefix = () => {
  return `${host.value}/${prefixLength.value}`
}

watch(() => route.params, () => {
  if (route.params.id != host.value || Number(route.params.length) != prefixLength.value) {
    host.value = route.params.id
    prefixLength.value = Number(route.params.length)
  }
}, {deep: true})
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
  if (host.value && prefixLength.value) {
    fetchData()
  } else {
    router.push(Tr.i18nRoute({
      name: 'networks',
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
        <QTab name="overview">Overview</QTab>
        <QTab name="routing">Routing</QTab>
        <QTab name="dns">DNS</QTab>
        <QTab name="custom">Custom</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels
        v-model="menu"
        v-if="pageTitle"
      >
        <QTabPanel name="overview">
          <PrefixOverview
            :host="host"
            :prefix-length="prefixLength"
            :get-prefix="getPrefix()"
          />
        </QTabPanel>
        <QTabPanel name="routing">
          <PrefixRouting
            :page-title="pageTitle"
            :get-prefix="getPrefix()"
          />
        </QTabPanel>
        <QTabPanel name="dns">
          <PrefixDNS
            :page-title="pageTitle"
            :get-prefix="getPrefix()"
          />
        </QTabPanel>
        <QTabPanel name="custom">
          <PrefixCustom
            :host="host"
            :prefix-length="prefixLength"
            :page-title="pageTitle"
            :get-prefix="getPrefix()"
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