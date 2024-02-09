<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import TagOverview from '@/components/networks/tag/TagOverview.vue'
import TagPrefixes from '@/components/iyp/tag/TagPrefixes.vue'
import TagAutonomousSystems from '@/components/iyp/tag/TagAutonomousSystems.vue'
import TagPopularHostNames from '@/components/iyp/tag/TagPopularHostNames.vue'

const props = defineProps(['tag'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, hasData: true, label: 'Overview' },
  { value: false, hasData: false, label: t('iyp.tag.popularDomains.title') },
  { value: false, hasData: false, label: t('iyp.tag.ases.title') },
  { value: false, hasData: false, label: t('iyp.tag.prefixes.title') },
])
const selectAll = ref(false)
const selectedWidgets = ref(null)

const init = async () => {
  const queries = [{
    query: `MATCH (t:Tag {label: $tag})
      OPTIONAL MATCH (t)<-[cat_a:CATEGORIZED]-(a:AS) WITH t, count(DISTINCT a) as nb_ases, COLLECT(DISTINCT cat_a.reference_org) as data_source_ases
      OPTIONAL MATCH (t)<-[cat_p:CATEGORIZED]-(p:Prefix) WITH t, nb_ases, data_source_ases, count(DISTINCT p) as nb_prefixes, COLLECT(DISTINCT cat_p.reference_org) as data_source_prefixes
      OPTIONAL MATCH (t)<-[cat_d:CATEGORIZED]-(d:DomainName) WITH t, nb_ases, data_source_ases, nb_prefixes, data_source_prefixes, count(DISTINCT d) as nb_domains, COLLECT(DISTINCT cat_d.reference_org) as data_source_domains
      RETURN  nb_domains, nb_ases, nb_prefixes, data_source_ases, data_source_domains, data_source_prefixes`,
  }]
  let params = { tag: props.tag }
  let results = await iyp_api.run(queries.map(obj => ({statement: obj.query, parameters: params})))

  selectedWidgets.value = results[0][0]
  if (selectedWidgets.value.nb_domains > 0) {
    selects.value[1].hasData = true
  }
  if (selectedWidgets.value.nb_ases > 0) {
    selects.value[2].hasData = true
  }
  if (selectedWidgets.value.nb_prefixes > 0) {
    selects.value[3].hasData = true
  }
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
      <span v-for="select in selects">
        <QCheckbox v-if="select.hasData" :label="select.label" v-model="select.value" />
      </span>
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
  <GenericCardController
    :title="selectedWidgets.nb_domains+' '+$t('iyp.tag.domains.title')"
    :sub-title="$t('iyp.tag.domains.caption')+tag+' by '+selectedWidgets.data_source_domains.join(', ')"
    class="card"
    v-if="selects[1].value && selects[1].hasData"
  >
    <TagPopularHostNames
      :tag="tag"
    />
  </GenericCardController>
  <GenericCardController
    :title="selectedWidgets.nb_ases+' '+$t('iyp.tag.ases.title')"
    :sub-title="$t('iyp.tag.ases.caption')+tag+' by '+selectedWidgets.data_source_ases.join(', ')"
    class="card"
    v-if="selects[2].value && selects[2].hasData"
  >
    <TagAutonomousSystems
      :tag="tag"
    />
  </GenericCardController>
  <GenericCardController
    :title="selectedWidgets.nb_prefixes+' '+$t('iyp.tag.prefixes.title')"
    :sub-title="$t('iyp.tag.prefixes.caption')+tag+' by '+selectedWidgets.data_source_prefixes.join(', ')"
    class="card"
    v-if="selects[3].value && selects[3].hasData"
  >
    <TagPrefixes
      :tag="tag"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>