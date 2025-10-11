<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASConnectedASes from '@/components/iyp/as/ASConnectedASes.vue'
import ASOriginatedPrefixes from '@/components/iyp/as/ASOriginatedPrefixes.vue'
import ASRPKIRouteOriginAuthorization from '@/components/iyp/as/ASRPKIRouteOriginAuthorization.vue'
import ASDownstreamsASes from '@/components/iyp/as/ASDownstreamsASes.vue'
import ASUpstreamASes from '@/components/iyp/as/ASUpstreamASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.ipPrefix.title')"
    :sub-title="$t('iyp.as.ipPrefix.caption') + asNumber"
    :info-title="$t('iyp.as.ipPrefix.info.title')"
    :info-description="$t('iyp.as.ipPrefix.info.description')"
  >
    <ASOriginatedPrefixes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.peers.title')"
    :sub-title="$t('iyp.as.peers.caption') + asNumber"
    :info-title="$t('iyp.as.peers.info.title')"
    :info-description="$t('iyp.as.peers.info.description')"
    class="card"
  >
    <ASConnectedASes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.upstreams.title')"
    :sub-title="$t('iyp.as.upstreams.caption') + asNumber"
    :info-title="$t('iyp.as.upstreams.info.title')"
    :info-description="$t('iyp.as.upstreams.info.description')"
    class="card"
  >
    <ASUpstreamASes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.downstreams.title')"
    :sub-title="$t('iyp.as.downstreams.caption') + asNumber"
    :info-title="$t('iyp.as.downstreams.info.title')"
    :info-description="$t('iyp.as.downstreams.info.description')"
    class="card"
  >
    <ASDownstreamsASes
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.roas.title')"
    :sub-title="$t('iyp.as.roas.caption') + asNumber"
    :info-title="$t('iyp.as.roas.info.title')"
    :info-description="$t('iyp.as.roas.info.description')"
    class="card"
  >
    <ASRPKIRouteOriginAuthorization
      :as-number="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
