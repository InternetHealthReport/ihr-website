<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryAutonomousSystems from '@/components/iyp/country/CountryAutonomousSystems.vue'
import CountryIPPrefixes from '@/components/iyp/country/CountryIPPrefixes.vue'

const props = defineProps(['countryCode', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.country.ases.title')"
    :sub-title="$t('iyp.country.ases.caption')+pageTitle"
  >
    <CountryAutonomousSystems
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.country.prefixes.title')"
    :sub-title="$t('iyp.country.prefixes.caption')+pageTitle"
    class="card"
  >
    <CountryIPPrefixes
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>