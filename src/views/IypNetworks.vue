<script setup>
import { QList, QExpansionItem, QSeparator, QCard, QCardSection } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { useI18n } from 'vue-i18n'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import IypSearchBar from '@/components/search/IypSearchBar.vue'
import AS from '@/components/iyp/AS.vue'

const iyp_api = inject('iyp_api')

const { t } = useI18n()

const route = useRoute()
const router = useRouter()

const id = ref(route.params.id)
const asNumber = ref(id.value.includes('AS') ? Number(id.value.replace('AS', '')) : null)
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="id">
      <AS />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Network Report</h1>
        <div class="row justify-center">
          <div class="col-8">
            <IypSearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter an AS ID, IXP or network name (at least 3 characters)"
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
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'AS2497' } })" class="IHR_delikify">IIJ (AS2497)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'AS15169' } })" class="IHR_delikify">Google (AS15169)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'AS2501' } })" class="IHR_delikify">University of Tokyo (AS2501)</RouterLink>
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'IXP1997' } })" class="IHR_delikify">Equinix London (IXP1997)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'IXP26' } })" class="IHR_delikify">AMS-IX (IXP26)</RouterLink>
              </li>
              <li>
                <RouterLink :to="Tr.i18nRoute({ name: 'networks', params: { id: 'IXP2588' } })" class="IHR_delikify">DE-CIX Chennai (IXP2588)</RouterLink>
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