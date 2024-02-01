<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import TagOverview from '@/components/networks/tag/TagOverview.vue'
import HostNameAuthoritativeNameservers from '@/components/iyp/hostName/HostNameAuthoritativeNameservers.vue'
import HostNameQueryingCountries from '@/components/iyp/hostName/HostNameQueryingCountries.vue'
import HostNameQueryingASes from '@/components/iyp/hostName/HostNameQueryingASes.vue'
import HostNameRankings from '@/components/iyp/hostName/HostNameRankings.vue'
import { roundPositionForSharpStrokeRendering } from 'plotly.js-dist'

const props = defineProps(['tag'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, label: 'Overview' },
])
const selectAll = ref(false)
const selectedWidgets = ref(null)

const init = () => {
  const queries = [{
    query: `MATCH (t:Tag {label: $tag})
      OPTIONAL MATCH (t)<-[cat_a:CATEGORIZED]-(a:AS) WITH t, count(DISTINCT a) as nb_ases, COLLECT(DISTINCT cat_a.reference_org) as data_source_ases
      OPTIONAL MATCH (t)<-[cat_p:CATEGORIZED]-(p:Prefix) WITH t, nb_ases, data_source_ases, count(DISTINCT p) as nb_prefixes, COLLECT(DISTINCT cat_p.reference_org) as data_source_prefixes
      OPTIONAL MATCH (t)<-[cat_d:CATEGORIZED]-(d:DomainName) WITH t, nb_ases, data_source_ases, nb_prefixes, data_source_prefixes, count(DISTINCT d) as nb_domains, COLLECT(DISTINCT cat_d.reference_org) as data_source_domains
      RETURN  nb_domains, nb_ases, nb_prefixes, data_source_ases, data_source_domains, data_source_prefixes`,
  }]
  let params = { tag: props.tag }
  let res = iyp_api.runManyInParallel(queries, params)

  res[0].then( results => {
    selectedWidgets.value = results.records[0]
    if (selectedWidgets.value.get('nb_domains') > 0) {
      selects.value.push({ value: false, label: selectedWidgets.value.get('nb_domains')+' '+t('iyp.tag.popularDomains.title') })
    }
    if (selectedWidgets.value.get('nb_ases') > 0) {
      selects.value.push({ value: false, label: selectedWidgets.value.get('nb_ases')+' '+t('iyp.tag.ases.title') })
    }
    if (selectedWidgets.value.get('nb_prefixes') > 0) {
      selects.value.push({ value: false, label: selectedWidgets.value.get('nb_prefixes')+' '+t('iyp.tag.prefixes.title') })
    }
  })
}

const pushRoute = () => {
  router.push(Tr.i18nRoute({
    replace: true,
    query: Object.assign({}, route.query, {
      display: JSON.stringify(selects.value.map((obj, index) => {
        if (obj.value) {
          return index
        }
      }).filter(val => val != null))
    })
  }))
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach(obj => obj.value = selectAll.value)
})

onMounted(() => {
  init()
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else {
    displayWidgets.value.forEach(val => selects.value[val].value = true)
  }
})
</script>

<template>
  <QCard flat bordered>
    <QCardSection>
      <div class="text-h6">Select widgets</div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <QCheckbox v-for="select in selects" :label="select.label" v-model="select.value" />
      <QCheckbox label="All" v-model="selectAll" />
    </QCardSection>
  </QCard>
  <!-- Overview -->
  <TagOverview
    :tag="tag"
    class="card"
    v-if="selects[0].value"
  />
  <!-- All -->
  
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>