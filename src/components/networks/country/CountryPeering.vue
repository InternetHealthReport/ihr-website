<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryInternetExchangePoints from '@/components/iyp/country/CountryInternetExchangePoints.vue'
import CountryInternetExchangePointsDomesticFacilities from '@/components/iyp/country/CountryInternetExchangePointsDomesticFacilities.vue'
import CountryInternetExchangePointsInternationalFacilities from '@/components/iyp/country/CountryInternetExchangePointsInternationalFacilities.vue'

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
  <GenericCardController
    :title="$t('iyp.country.ixps_domestic_facilities.title')"
    :sub-title="$t('iyp.country.ixps_domestic_facilities.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps_domestic_facilities.info.title')"
    :info-description="$t('iyp.country.ixps_domestic_facilities.info.description')"
    class="card"
  >
    <CountryInternetExchangePointsDomesticFacilities :country-code="countryCode" :page-title="pageTitle" />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.country.ixps_international_facilities.title')"
    :sub-title="$t('iyp.country.ixps_international_facilities.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps_international_facilities.info.title')"
    :info-description="$t('iyp.country.ixps_international_facilities.info.description')"
    class="card"
  >
    <CountryInternetExchangePointsInternationalFacilities :country-code="countryCode" :page-title="pageTitle" />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
