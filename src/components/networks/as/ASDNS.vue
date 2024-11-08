<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASPopularDomains from '@/components/iyp/as/ASPopularDomains.vue'
import ASPopularHostNames from '@/components/iyp/as/ASPopularHostNames.vue'
import ASAuthoritativeNameservers from '@/components/iyp/as/ASAuthoritativeNameservers.vue'

const props = defineProps(['asNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.popularDomains.title')"
    :sub-title="$t('iyp.as.popularDomains.caption') + asNumber"
    :info-title="$t('iyp.as.popularDomains.info.title')"
    :info-description="$t('iyp.as.popularDomains.info.description')"
  >
    <ASPopularDomains :asNumber="asNumber" :page-title="pageTitle" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.popularHostNames.title')"
    :sub-title="$t('iyp.as.popularHostNames.caption') + asNumber"
    :info-title="$t('iyp.as.popularHostNames.info.title')"
    :info-description="$t('iyp.as.popularHostNames.info.description')"
    class="card"
  >
    <ASPopularHostNames :asNumber="asNumber" :page-title="pageTitle" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.authoritativeNameservers.title')"
    :sub-title="$t('iyp.as.authoritativeNameservers.caption') + asNumber"
    :info-title="$t('iyp.as.authoritativeNameservers.info.title')"
    :info-description="$t('iyp.as.authoritativeNameservers.info.description')"
    class="card"
  >
    <ASAuthoritativeNameservers :asNumber="asNumber" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
