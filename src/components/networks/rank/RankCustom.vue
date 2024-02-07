<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import RankASRankings from '@/components/iyp/rank/RankASRankings.vue'
import RankHostNameRankings from '@/components/iyp/rank/RankHostNameRankings.vue'

const props = defineProps(['rank', 'pageTitle'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, hasData: false, label: 'AS' },
  { value: false, hasData: false, label: 'Host Name' },
])
const selectAll = ref(false)

const init = () => {
  const queries = [{
    query: `MATCH (n)-[:RANK]-(:Ranking {name: $rank})
      RETURN DISTINCT head(labels(n)) as node`,
  }]
  let params = { rank: props.rank }
  let res = iyp_api.runManyInParallel(queries, params)

  res[0].then( results => {
    const node = results.records[0].get('node')
    if ('AS' == node) {
      selects.value[0].hasData = true
    }
    if ('DomainName' == node) {
      selects.value[1].hasData = true
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
      <span v-for="select in selects">
        <QCheckbox v-if="select.hasData" :label="select.label" v-model="select.value" />
      </span>
      <QCheckbox label="All" v-model="selectAll" />
    </QCardSection>
  </QCard>
  <GenericCardController
    title="AS rankings"
    :sub-title="'Top ASes in '+pageTitle"
    class="card"
    v-if="selects[0].value"
  >
    <RankASRankings
      :rank="rank"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    title="Host Name rankings"
    :sub-title="'Top Host Names in '+pageTitle+' (top 10K)'"
    class="card"
    v-if="selects[1].value"
  >
    <RankHostNameRankings
      :rank="rank"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style lang="stylus">
.card
  margin-top 20px
</style>