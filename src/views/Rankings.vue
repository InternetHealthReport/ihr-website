<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import CountryASRankings from '@/components/iyp/country/CountryASRankings.vue'

const route = useRoute()

const init = () => {
  
}

watch(() => route.params.id, () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <h1 class="text-center">Rankings</h1>
    <h3 class="text-center">Weekly report</h3>
    <GenericCardController
    :title="$t('iyp.country.rankings.title')"
    :sub-title="`${$t('iyp.country.rankings.caption')} each country`"
  >
    <CountryASRankings
      :country-code="null"
      :page-title="null"
    />
  </GenericCardController>
  </div>
</template>

<style lang="stylus">
.IHR_
  &char-container
    width 90%
    margin 0 auto
</style>