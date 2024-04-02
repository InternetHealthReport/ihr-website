<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import IXPCoLocationFacilities from '@/components/iyp/ixp/IXPCoLocationFacilities.vue'
import IXPPeeringLANs from '@/components/iyp/ixp/IXPPeeringLANs.vue'

const props = defineProps(['ixpNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.ixp.facilities.title')"
    sub-title="Facilities"
    :info-title="$t('iyp.ixp.facilities.info.title')"
    :info-description="$t('iyp.ixp.facilities.info.description')"
  >
    <IXPCoLocationFacilities
      :ixpNumber="ixpNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.ixp.peeringLANs.title')"
    sub-title="Peering LANs of an IXP"
    :info-title="$t('iyp.ixp.peeringLANs.info.title')"
    :info-description="$t('iyp.ixp.peeringLANs.info.description')"
    class="card"
  >
    <IXPPeeringLANs
      :ixpNumber="ixpNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>