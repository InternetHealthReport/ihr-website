<script setup>
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryInternetExchangePoints from '@/components/iyp/country/CountryInternetExchangePoints.vue'
import CountryInternetExchangePointsDomesticDistribution from '@/components/iyp/country/CountryInternetExchangePointsDomesticDistribution.vue'
import CountryInternetExchangePointsInternationalDistribution from '@/components/iyp/country/CountryInternetExchangePointsInternationalDistribution.vue'

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
    :title="$t('iyp.country.ixps_domestic_distribution.title')"
    :sub-title="$t('iyp.country.ixps_domestic_distribution.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps_domestic_distribution.info.title')"
    :info-description="$t('iyp.country.ixps_domestic_distribution.info.description')"
    class="card"
  >
    <CountryInternetExchangePointsDomesticDistribution
      :country-code="countryCode"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    :title="$t('iyp.country.ixps_international_distribution.title')"
    :sub-title="$t('iyp.country.ixps_international_distribution.caption') + pageTitle"
    :info-title="$t('iyp.country.ixps_international_distribution.info.title')"
    :info-description="$t('iyp.country.ixps_international_distribution.info.description')"
    class="card"
  >
    <CountryInternetExchangePointsInternationalDistribution
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
