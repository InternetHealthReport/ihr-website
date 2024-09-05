<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import Rank from '@/components/networks/Rank.vue'
import Feedback from '@/components/Feedback.vue'

const route = useRoute()

const rankName = ref(null)

const init = () => {
  if (route.params.rank) {
    rankName.value = route.params.rank
  }
}

watch(
  () => route.params.rank,
  () => {
    init()
  }
)

onMounted(() => {
  init()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <div v-if="route.params.rank">
      <Rank v-if="rankName" />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Rank Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <SearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter a rank"
              :noAS="true"
              :noIXP="true"
              :noPrefix="true"
              :noCountry="true"
              :noTag="true"
              :noHostName="true"
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
                  :to="
                    Tr.i18nRoute({ name: 'rank', params: { rank: 'APNIC eyeball estimates (JP)' } })
                  "
                  class="IHR_delikify"
                  >APNIC eyeball estimates (JP)</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      name: 'rank',
                      params: { rank: 'IHR country ranking: Total AS (JP)' }
                    })
                  "
                  class="IHR_delikify"
                  >IHR country ranking: Total AS (JP)</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      name: 'rank',
                      params: { rank: 'IHR country ranking: Total eyeball (JP)' }
                    })
                  "
                  class="IHR_delikify"
                  >IHR country ranking: Total eyeball (JP)</RouterLink
                >
              </li>
            </ul>
            <ul class="ul_styles">
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'rank', params: { rank: 'CAIDA ASRank' } })"
                  class="IHR_delikify"
                  >CAIDA ASRank</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'rank', params: { rank: 'Tranco top 1M' } })"
                  class="IHR_delikify"
                  >Tranco top 1M</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="
                    Tr.i18nRoute({ name: 'rank', params: { rank: 'Cisco Umbrella Top 1 million' } })
                  "
                  class="IHR_delikify"
                  >Cisco Umbrella Top 1 million</RouterLink
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Feedback />
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
