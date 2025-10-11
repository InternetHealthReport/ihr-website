<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryAutonomousSystems from '@/components/iyp/country/CountryAutonomousSystems.vue'
import CountryIPPrefixes from '@/components/iyp/country/CountryIPPrefixes.vue'

const props = defineProps(['countryCode', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.country.ases.title')"
    :sub-title="$t('iyp.country.ases.caption') + pageTitle"
    :info-title="$t('iyp.country.ases.info.title')"
    :info-description="$t('iyp.country.ases.info.description')"
  >
    <CountryAutonomousSystems
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.country.prefixes.title')"
    :sub-title="$t('iyp.country.prefixes.caption') + pageTitle"
    :info-title="$t('iyp.country.prefixes.info.title')"
    :info-description="$t('iyp.country.prefixes.info.description')"
    class="card"
  >
    <CountryIPPrefixes
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
