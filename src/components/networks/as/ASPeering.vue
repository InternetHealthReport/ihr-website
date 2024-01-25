<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASConnectedASes from '@/components/iyp/as/ASConnectedASes.vue'
import ASIXPs from '@/components/iyp/as/ASIXPs.vue'
import ASDownstreamsASes from '@/components/iyp/as/ASDownstreamsASes.vue'
import ASUpstreamASes from '@/components/iyp/as/ASUpstreamASes.vue'
import ASCoLocatedASes from '@/components/iyp/as/ASCoLocatedASes.vue'

const props = defineProps(['asNumber', 'pageTitle'])
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