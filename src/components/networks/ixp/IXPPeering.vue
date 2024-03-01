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
  >
    <IXPCoLocationFacilities
      :ixpNumber="ixpNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.ixp.peeringLANs.title')"
    sub-title="Peering LANs of an IXP"
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