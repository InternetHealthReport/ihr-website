<script setup>
import { QCard, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, computed, onMounted, inject } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASConnectedASes from '@/components/iyp/as/ASConnectedASes.vue'
import ASIXPs from '@/components/iyp/as/ASIXPs.vue'
import ASRPKIRouteOriginAuthorization from '@/components/iyp/as/ASRPKIRouteOriginAuthorization.vue'
import ASDownstreamsASes from '@/components/iyp/as/ASDownstreamsASes.vue'
import ASUpstreamASes from '@/components/iyp/as/ASUpstreamASes.vue'
import ASCoLocatedASes from '@/components/iyp/as/ASCoLocatedASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.peers.title')"
    :sub-title="$t('iyp.as.peers.caption')+asNumber"
  >
    <ASConnectedASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.upstreams.title')"
    :sub-title="$t('iyp.as.upstreams.caption')+asNumber"
    class="card"
  >
    <ASUpstreamASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.downstreams.title')"
    :sub-title="$t('iyp.as.downstreams.caption')+asNumber"
    class="card"
  >
    <ASDownstreamsASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.ixp.title')"
    :sub-title="$t('iyp.as.ixp.caption')+asNumber"
    class="card"
  >
    <ASIXPs
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.facilities.title')"
    :sub-title="$t('iyp.as.facilities.caption')+asNumber"
    class="card"
  >
    <ASCoLocatedASes
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>