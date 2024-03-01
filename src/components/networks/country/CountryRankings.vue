<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryASRankings from '@/components/iyp/country/CountryASRankings.vue'

const props = defineProps(['countryCode', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.country.rankings.title')"
    :sub-title="$t('iyp.country.rankings.caption')+pageTitle"
    v-if="pageTitle"
  >
    <CountryASRankings
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>