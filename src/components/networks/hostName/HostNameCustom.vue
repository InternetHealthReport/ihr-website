<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import HostNameIPAddressesPrefixes from '@/components/iyp/hostName/HostNameIPAddressesPrefixes.vue'
import HostNameAuthoritativeNameservers from '@/components/iyp/hostName/HostNameAuthoritativeNameservers.vue'
import HostNameQueryingCountries from '@/components/iyp/hostName/HostNameQueryingCountries.vue'
import HostNameQueryingASes from '@/components/iyp/hostName/HostNameQueryingASes.vue'
import HostNameRankings from '@/components/iyp/hostName/HostNameRankings.vue'

const props = defineProps(['hostName', 'pageTitle', 'hash'])

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, label: t('iyp.domainname.ips.title') },
  { value: false, label: t('iyp.domainname.nameservers.title') },
  { value: false, label: t('iyp.domainname.country_query.title') },
  { value: false, label: t('iyp.domainname.as_query.title') },
  { value: false, label: t('iyp.domainname.rankings.title') }
])
const selectAll = ref(false)

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        display: JSON.stringify(
          selects.value
            .map((obj, index) => {
              if (obj.value) {
                return index
              }
            })
            .filter((val) => val != null)
        )
      })
    })
  )
}

const hashToDisplay = () => {
  selects.value.forEach((obj) => {
    if (obj.label === props.hash.replace('#', '').replaceAll('-', ' ')) {
      obj.value = true
    }
  })
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach((obj) => (obj.value = selectAll.value))
})

onMounted(() => {
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else if (props.hash) {
    hashToDisplay()
  } else {
    displayWidgets.value.forEach((val) => (selects.value[val].value = true))
  }
})
</script>

<template>
  <QCard flat bordered>
    <QCardSection>
      <div class="text-h6">Select widgets to show</div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <QCheckbox v-for="select in selects" :label="select.label" v-model="select.value" />
      <QCheckbox label="All" v-model="selectAll" />
    </QCardSection>
  </QCard>
  <!-- Routing -->
  <GenericCardController
    :title="$t('iyp.domainname.ips.title')"
    :sub-title="$t('iyp.domainname.ips.caption') + pageTitle"
    :info-title="$t('iyp.domainname.ips.info.title')"
    :info-description="$t('iyp.domainname.ips.info.description')"
    class="card"
    v-if="selects[0].value"
  >
    <HostNameIPAddressesPrefixes :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <!-- DNS -->
  <GenericCardController
    :title="$t('iyp.domainname.nameservers.title')"
    :sub-title="$t('iyp.domainname.nameservers.caption') + pageTitle"
    :info-title="$t('iyp.domainname.nameservers.info.title')"
    :info-description="$t('iyp.domainname.nameservers.info.description')"
    class="card"
    v-if="selects[1].value"
  >
    <HostNameAuthoritativeNameservers :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.country_query.title')"
    :sub-title="$t('iyp.domainname.country_query.caption') + pageTitle"
    :info-title="$t('iyp.domainname.country_query.info.title')"
    :info-description="$t('iyp.domainname.country_query.info.description')"
    class="card"
    v-if="selects[2].value"
  >
    <HostNameQueryingCountries :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.domainname.as_query.title')"
    :sub-title="$t('iyp.domainname.as_query.caption') + pageTitle"
    :info-title="$t('iyp.domainname.as_query.info.title')"
    :info-description="$t('iyp.domainname.as_query.info.description')"
    class="card"
    v-if="selects[3].value"
  >
    <HostNameQueryingASes :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
  <!-- Rankings -->
  <GenericCardController
    :title="$t('iyp.domainname.rankings.title')"
    :sub-title="$t('iyp.domainname.rankings.caption') + pageTitle"
    :info-title="$t('iyp.domainname.rankings.info.title')"
    :info-description="$t('iyp.domainname.rankings.info.description')"
    class="card"
    v-if="selects[4].value"
  >
    <HostNameRankings :page-title="pageTitle" :host-name="hostName" />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>
