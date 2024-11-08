<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import IXPCoLocationFacilities from '@/components/iyp/ixp/IXPCoLocationFacilities.vue'
import IXPPeeringLANs from '@/components/iyp/ixp/IXPPeeringLANs.vue'
import IXPMembers from '@/components/iyp/ixp/IXPMembers.vue'

const props = defineProps(['ixpNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.ixp.members.title')"
    sub-title="Peer ASes"
    :info-title="$t('iyp.ixp.members.info.title')"
    :info-description="$t('iyp.ixp.members.info.description')"
  >
    <IXPMembers :ixp-number="ixpNumber" :page-title="pageTitle" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.ixp.facilities.title')"
    sub-title="Co-location Facilities"
    :info-title="$t('iyp.ixp.facilities.info.title')"
    :info-description="$t('iyp.ixp.facilities.info.description')"
    class="card"
  >
    <IXPCoLocationFacilities :ixp-number="ixpNumber" :page-title="pageTitle" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.ixp.peeringLANs.title')"
    sub-title="Peering LANs of an IXP"
    :info-title="$t('iyp.ixp.peeringLANs.info.title')"
    :info-description="$t('iyp.ixp.peeringLANs.info.description')"
    class="card"
  >
    <IXPPeeringLANs :ixp-number="ixpNumber" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
