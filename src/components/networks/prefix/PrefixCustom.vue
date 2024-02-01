<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import PrefixOverview from '@/components/networks/prefix/PrefixOverview.vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import PrefixUpstreamASes from '@/components/iyp/prefix/PrefixUpstreamASes.vue'
import PrefixRPKIRouteOriginAuthorization from '@/components/iyp/prefix/PrefixRPKIRouteOriginAuthorization.vue'
import PrefixLessSpecificPrefixes from '@/components/iyp/prefix/PrefixLessSpecificPrefixes.vue'
import PrefixMoreSpecificPrefixes from '@/components/iyp/prefix/PrefixMoreSpecificPrefixes.vue'
import PrefixPopularDomains from '@/components/iyp/prefix/PrefixPopularDomains.vue'
import PrefixAuthoritativeNameservers from '@/components/iyp/prefix/PrefixAuthoritativeNameservers.vue'

const props = defineProps(['host', 'prefixLength', 'getPrefix', 'pageTitle'])

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, label: 'Overview' },
  { value: false, label: t('iyp.prefix.upstreams.title') },
  { value: false, label: t('iyp.prefix.roas.title') },
  { value: false, label: t('iyp.prefix.lessSpecific.title') },
  { value: false, label: t('iyp.prefix.moreSpecific.title') },
  { value: false, label: t('iyp.prefix.popularDomains.title') },
  { value: false, label: t('iyp.prefix.nameservers.title') },
])
const selectAll = ref(false)

const pushRoute = () => {
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      display: JSON.stringify(selects.value.map((obj, index) => {
        if (obj.value) {
          return index
        }
      }).filter(val => val != null))
    })
  }))
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach(obj => obj.value = selectAll.value)
})

onMounted(() => {
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else {
    displayWidgets.value.forEach(val => selects.value[val].value = true)
  }
})
</script>

<template>
  <QCard flat bordered>
    <QCardSection>
      <div class="text-h6">Select widgets</div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <QCheckbox v-for="select in selects" :label="select.label" v-model="select.value" />
      <QCheckbox label="All" v-model="selectAll" />
    </QCardSection>
  </QCard>
  <!-- Overview -->
  <PrefixOverview
    :host="host"
    :prefix-length="prefixLength"
    :get-prefix="getPrefix"
    class="card"
    v-if="selects[0].value"
  />
  <!-- Routing -->
  <GenericCardController
    :title="$t('iyp.prefix.upstreams.title')"
    :sub-title="getPrefix+' depends on these ASes'"
    class="card"
    v-if="selects[1].value"
  >
    <PrefixUpstreamASes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.roas.title')"
    :sub-title="$t('iyp.prefix.roas.caption')+getPrefix"
    class="card"
    v-if="selects[2].value"
  >
    <PrefixRPKIRouteOriginAuthorization
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.lessSpecific.title')"
    :sub-title="$t('iyp.prefix.lessSpecific.caption')+getPrefix"
    class="card"
    v-if="selects[3].value"
  >
    <PrefixLessSpecificPrefixes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.moreSpecific.title')"
    :sub-title="$t('iyp.prefix.moreSpecific.caption')+getPrefix"
    class="card"
    v-if="selects[4].value"
  >
    <PrefixMoreSpecificPrefixes
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <!-- DNS -->
  <GenericCardController
    :title="$t('iyp.prefix.popularDomains.title')"
    :sub-title="$t('iyp.prefix.popularDomains.caption')+getPrefix"
    class="card"
    v-if="selects[5].value"
  >
    <PrefixPopularDomains
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.prefix.nameservers.title')"
    :sub-title="$t('iyp.prefix.nameservers.caption')+getPrefix"
    class="card"
    v-if="selects[6].value"
  >
    <PrefixAuthoritativeNameservers
      :page-title="pageTitle"
      :get-prefix="getPrefix"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>