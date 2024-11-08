<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, watch, onMounted } from 'vue'
import SearchBar from '@/components/search/SearchBar.vue'
import Tag from '@/components/networks/Tag.vue'
import Feedback from '@/components/Feedback.vue'
import '@/styles/chart.css'

const route = useRoute()

const tagName = ref(null)

const init = () => {
  if (route.params.tag) {
    tagName.value = route.params.tag
  }
}

watch(
  () => route.params.tag,
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
    <div v-if="route.params.tag">
      <Tag v-if="tagName" />
    </div>
    <div v-else>
      <div>
        <h1 class="text-center q-pa-xl">Tag Report</h1>
        <div class="row justify-center">
          <div class="col-6">
            <SearchBar
              bg="white"
              label="grey-8"
              input="black"
              labelTxt="Enter a tag"
              :noAS="true"
              :noIXP="true"
              :noPrefix="true"
              :noCountry="true"
              :noRank="true"
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
                  :to="Tr.i18nRoute({ name: 'tag', params: { tag: 'Home ISP' } })"
                  class="IHR_delikify"
                  >Home ISP</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'tag', params: { tag: 'Validating RPKI ROV' } })"
                  class="IHR_delikify"
                  >Validating RPKI ROV</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'tag', params: { tag: 'Anycast' } })"
                  class="IHR_delikify"
                  >Anycast</RouterLink
                >
              </li>
            </ul>
            <ul class="ul_styles">
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'tag', params: { tag: 'ToR Services' } })"
                  class="IHR_delikify"
                  >ToR Services</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'tag', params: { tag: 'Internet Critical Infra' } })"
                  class="IHR_delikify"
                  >Internet Critical Infra</RouterLink
                >
              </li>
              <li>
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      name: 'tag',
                      params: { tag: 'Computer and Information Technology' }
                    })
                  "
                  class="IHR_delikify"
                  >Computer and Information Technology</RouterLink
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
