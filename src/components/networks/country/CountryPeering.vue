<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryInternetExchangePoints from '@/components/iyp/country/CountryInternetExchangePoints.vue'

const props = defineProps(['countryCode', 'pageTitle'])
</script>

<template>
  <GenericCardController
    :title="$t('iyp.country.ixps.title')"
    :sub-title="$t('iyp.country.ixps.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps.info.title')"
    :info-description="$t('iyp.country.ixps.info.description')"
  >
    <CountryInternetExchangePoints :country-code="countryCode" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
