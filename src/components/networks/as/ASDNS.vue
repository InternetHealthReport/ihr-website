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
    :sub-title="$t('iyp.as.popularDomains.caption')+asNumber"
  >
    <ASPopularDomains
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.popularHostNames.title')"
    :sub-title="$t('iyp.as.popularHostNames.caption')+asNumber"
    class="card"
  >
    <ASPopularHostNames
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.as.authoritativeNameservers.title')"
    :sub-title="$t('iyp.as.authoritativeNameservers.caption')+asNumber"
    class="card"
  >
    <ASAuthoritativeNameservers
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>