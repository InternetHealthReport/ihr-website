<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASPopularDomains from '@/components/iyp/as/ASPopularDomains.vue'

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
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>