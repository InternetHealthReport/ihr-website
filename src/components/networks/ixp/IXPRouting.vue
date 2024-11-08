<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import IXPRPKIRouteOriginAuthorization from '@/components/iyp/ixp/IXPRPKIRouteOriginAuthorization.vue'

const props = defineProps(['ixpNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.ixp.roas.title')"
    sub-title="RPKI and BGP data for peering LAN"
    :info-title="$t('iyp.ixp.roas.info.title')"
    :info-description="$t('iyp.ixp.roas.info.description')"
  >
    <IXPRPKIRouteOriginAuthorization :ixpNumber="ixpNumber" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
