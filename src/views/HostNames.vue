<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import HostName from '@/components/networks/HostName.vue'

const route = useRoute()

const hostName = ref(null)

const init = () => {
  if (route.params.hostname) {
    hostName.value = route.params.hostname
  }
}

watch(() => route.params.hostname, () => {
  init()
})

onMounted(() => {
  init()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div v-if="route.params.hostname">
      <HostName v-if="hostName" :domain="hostName" />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Hostname Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <SearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter a Hostname"
              :noAS="true"
              :noIXP="true"
              :noPrefix="true"
              :noCountry="true"
              :noTag="true"
              :noRank="true"
            />
          </div>
        </div>
      </div>
      <div class="q-pa-lg">
        <div class="row q-pa-lg column items-center">
          <div class="col-6">
            <h3>Examples</h3>
          </div>
        </div>
        <div class="row justify-center">
          <div class="row examples">
            <ul class="ul_styles">
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: 'hotpepper.jp' } })" class="IHR_delikify">hotpepper.jp</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: '1024tera.com' } })" class="IHR_delikify">1024tera.com</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: 'jalan.net' } })" class="IHR_delikify">jalan.net</RouterLink>
              </li>
            </ul>
            <ul class="ul_styles">
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: 'guam.net' } })" class="IHR_delikify">guam.net</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: 'saipan.com' } })" class="IHR_delikify">saipan.com</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: 'toyoko-inn.com' } })" class="IHR_delikify">toyoko-inn.com</RouterLink>
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
.examples
  column-gap 30px
@media screen and (max-width: 500px)
  .examples
    flex-direction column
.ul_styles
  padding 0
  margin 0
  list-style-position: inside
</style>