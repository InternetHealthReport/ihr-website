<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASConnectedASes from '@/components/iyp/ASConnectedASes.vue'
import ASPopularDomains from '@/components/iyp/ASPopularDomains.vue'
import ASRPKIRouteOriginAuthorization from '@/components/iyp/ASRPKIRouteOriginAuthorization.vue'
import ASDownstreamsASes from '@/components/iyp/ASDownstreamsASes.vue'
import ASUpstreamASes from '@/components/iyp/ASUpstreamASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.popularDomains.title')"
    :sub-title="$t('iyp.as.popularDomains.caption')+asNumber"
  >
    <ASPopularDomains
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>