<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div>
      <div>
        <h1 class="text-center q-pa-xl">Internet Yellow Pages</h1>
        <div class="row justify-center">
          <div class="col-8">
            <!-- <NetworkSearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter an ASN, ID of an IXP, Country or the name of the Network (at least 3 characters)"
              origin="iyp"
            /> -->
            <IYPSearchBar />
          </div>
        </div>
      </div>
      <div class="q-pa-xl">
        <div class="row justify-center">
          <div>
            <h3>Examples</h3>
          </div>
        </div>
        <div class="row justify-center">
          <div class="col-3">
            <ul>
              <li>
                <router-link :to="{ name: 'iyp_asn', params: { asn: '2497' } }" class="IHR_delikify">IIJ (AS2497)</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_asn', params: { asn: '15169' } }" class="IHR_delikify">Google (AS15169)</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_asn', params: { asn: '2501' } }" class="IHR_delikify"
                  >University of Tokyo (AS2501)</router-link
                >
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <router-link :to="{ name: 'iyp_country', params: { cc: 'JP' } }" class="IHR_delikify">Japan</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_country', params: { cc: 'FR' } }" class="IHR_delikify">France</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_country', params: { cc: 'US' } }" class="IHR_delikify">United States</router-link>
              </li>
            </ul>
          </div>
          <div class="col-3">
            <ul>
              <li>
                <router-link :to="{ name: 'iyp_ixp', params: { id: 1997 } }" class="IHR_delikify">Equinix London</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_ixp', params: { id: 26 } }" class="IHR_delikify">AMS-IX</router-link>
              </li>
              <li>
                <router-link :to="{ name: 'iyp_ixp', params: { id: 2588 } }" class="IHR_delikify">DE-CIX Chennai</router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkSearchBar from '@/components/search_bar/NetworkSearchBar.vue'
import IYPSearchBar from '@/components/search_bar/IYPSearchBar.vue'
export default {
  name: 'IYP',
  data() {
    return {}
  },
  methods: {},
  components: { NetworkSearchBar, IYPSearchBar },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
