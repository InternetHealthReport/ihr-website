<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import AS from '@/components/networks/AS.vue'
import IXP from '@/components/networks/IXP.vue'
import Prefix from '@/components/networks/Prefix.vue'
import * as ipAddress from 'ip-address'
import Feedback from '@/components/Feedback.vue'
import '@/styles/chart.css'

const route = useRoute()

const asNumber = ref(null)
const ixpNumber = ref(null)
const prefixHostString = ref(null)
const prefixLengthNumber = ref(null)

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

const init = () => {
  if (route.params.id) {
    asNumber.value = route.params.id.includes('AS')
      ? Number(route.params.id.replace('AS', ''))
      : null
    ixpNumber.value = route.params.id.includes('IXP')
      ? Number(route.params.id.replace('IXP', ''))
      : null
    prefixHostString.value = null
    prefixLengthNumber.value = null
  } else if (route.params.ip && route.params.length) {
    let prefixMatch
    try {
      prefixMatch = new Address4(route.params.ip).isCorrect()
    } catch (e) {
      prefixMatch = null
    }
    if (!prefixMatch) {
      try {
        prefixMatch = new Address6(route.params.ip).isCorrect()
      } catch (e) {
        prefixMatch = null
      }
    }
    prefixHostString.value = prefixMatch ? route.params.ip : null
    prefixLengthNumber.value = !isNaN(route.params.length) ? Number(route.params.length) : null
    asNumber.value = null
    ixpNumber.value = null
  }
}

watch(
  () => route.params.id,
  () => {
    init()
  }
)

watch(
  () => route.params.ip,
  () => {
    init()
  }
)

onMounted(() => {
  init()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <div v-if="route.params.id || route.params.ip">
      <AS v-if="asNumber" />
      <IXP v-if="ixpNumber" />
      <Prefix v-if="prefixHostString && prefixLengthNumber" />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Network Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <SearchBar
              bg="white"
              label="grey-8"
              input="black"
              label-txt="Enter an AS ID, IXP or network name (at least 3 characters)"
              :no-country="true"
              :no-host-name="true"
              :no-tag="true"
              :no-rank="true"
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
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'AS2497' } })"
                  class="IHR_delikify"
                >
                  IIJ (AS2497)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'AS15169' } })"
                  class="IHR_delikify"
                >
                  Google (AS15169)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'AS2501' } })"
                  class="IHR_delikify"
                >
                  University of Tokyo (AS2501)
                </RouterLink>
              </li>
            </ul>
            <ul class="ul_styles">
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'IXP1997' } })"
                  class="IHR_delikify"
                >
                  Equinix London (IXP1997)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'IXP26' } })"
                  class="IHR_delikify"
                >
                  AMS-IX (IXP26)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: 'IXP2588' } })"
                  class="IHR_delikify"
                >
                  DE-CIX Chennai (IXP2588)
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Feedback />
</template>

<style>
.examples {
  column-gap: 30px;
}
@media screen and (max-width: 500px) {
  .examples {
    flex-direction: column;
  }
}
.ul_styles {
  padding: 0;
  margin: 0;
  list-style-position: inside;
}
</style>
