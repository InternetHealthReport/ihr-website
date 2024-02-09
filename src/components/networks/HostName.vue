<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import report from '@/plugins/report'
import { useI18n } from 'vue-i18n'
import HostNameRouting from '@/components/networks/hostName/HostNameRouting.vue'
import HostNameDNS from '@/components/networks/hostName/HostNameDNS.vue'
import HostNameRankings from '@/components/networks/hostName/HostNameRankings.vue'
import HostNameCustom from '@/components/networks/hostName/HostNameCustom.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const activeTab = 'routing'
const activeMenu = route.query.active ? route.query.active : activeTab

const routeHash = ref(route.hash)
const loadingStatus = ref(false)
const domain = ref(route.params.hostName)
const domainName = ref(null)
const menu = ref(activeMenu)

const getInfo = () => {
  const query = `MATCH (d:DomainName {name: $domain})
      RETURN d.name AS name`
  return [{ statement: query, parameters: { domain: domain.value } }]
}

const fetchData = async () => {
  let queries = getInfo()

  loadingStatus.value = true

  try {
    let res = await iyp_api.run(queries)
    domainName.value = res[0][0].name
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const pageTitle = computed(() => {
  return domainName.value
})

watch(() => route.params.hostName, (newDomain) => {
  if (newDomain != domain.value) {
    domain.value = newDomain
    if (domain.value) {
      pushRoute()
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
  if (domain.value) {
    fetchData()
  } else {
    router.push(Tr.i18nRoute({
      name: 'hostnames',
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
        <QTab name="routing">Routing</QTab>
        <QTab name="dns">DNS</QTab>
        <QTab name="rankings">Rankings</QTab>
        <QTab name="custom">Custom</QTab>
      </QTabs>
      <QSeparator />
      <QTabPanels
        v-model="menu"
        v-if="pageTitle"
      >
        <!-- <QTabPanel name="overview">
          
        </QTabPanel> -->
        <QTabPanel name="routing">
          <HostNameRouting
            :page-title="pageTitle"
            :host-name="domainName"
          />
        </QTabPanel>
        <QTabPanel name="dns">
          <HostNameDNS
            :page-title="pageTitle"
            :host-name="domainName"
          />
        </QTabPanel>
        <QTabPanel name="rankings">
          <HostNameRankings
            :page-title="pageTitle"
            :host-name="domainName"
          />
        </QTabPanel>
        <QTabPanel name="custom">
          <HostNameCustom
            :page-title="pageTitle"
            :host-name="domainName"
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