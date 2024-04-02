<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import ASRankings from '@/components/iyp/as/ASRankings.vue'

const props = defineProps(['asNumber', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.as.rankings.title')"
    :sub-title="$t('iyp.as.rankings.caption')+asNumber"
    :info-title="$t('iyp.as.rankings.info.title')"
    :info-description="$t('iyp.as.rankings.info.description')"
  >
    <ASRankings
      :asNumber="asNumber"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>