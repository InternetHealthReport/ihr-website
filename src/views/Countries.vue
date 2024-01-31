<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import Country from '@/components/networks/Country.vue'
import { isoCountries } from '@/plugins/countryName'

const route = useRoute()

const countryString = ref(null)

const init = () => {
  if (route.params.cc) {
    countryString.value = route.params.cc in isoCountries ? route.params.cc : null
  }
}

watch(() => route.params.cc, () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div v-if="route.params.cc">
      <Country v-if="countryString" />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Country Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <SearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter a country name"
              :noAS="true"
              :noIXP="true"
              :noPrefix="true"
            />
          </div>
        </div>
      </div>
      <div class="q-pa-xl">
        <div class="row justify-center">
          <div class="col-6">
            <h3>Examples:</h3>
          </div>
        </div>
        <div class="row justify-center">
          <div class="col-3">
            <ul>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'JP' } })" class="IHR_delikify">Japan</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'FR' } })" class="IHR_delikify">France</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'US' } })" class="IHR_delikify">United States</RouterLink>
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'BR' } })" class="IHR_delikify">Brazil</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'DE' } })" class="IHR_delikify">Germany</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'countries', params: { cc: 'CN' } })" class="IHR_delikify">China</RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="stylus">
.IHR_
  &char-container
    width 90%
    margin 0 auto
</style>