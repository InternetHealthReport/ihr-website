<script setup>
import { QCheckbox, QCard, QCardSection, QSeparator } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch, inject } from 'vue'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import RankASRankings from '@/components/iyp/rank/RankASRankings.vue'
import RankHostNameRankings from '@/components/iyp/rank/RankHostNameRankings.vue'

const props = defineProps(['rank', 'pageTitle', 'hash'])

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const { t } = useI18n()

const fetch = ref(true)
const displayWidgets = ref(route.query.display ? JSON.parse(route.query.display) : [])
const selects = ref([
  { value: false, hasData: false, label: 'AS' },
  { value: false, hasData: false, label: 'Hostname' }
])
const selectAll = ref(false)

const init = async () => {
  const queries = [
    {
      query: `MATCH (n)-[:RANK]-(:Ranking {name: $rank})
      RETURN DISTINCT head(labels(n)) as node`
    }
  ]
  let params = { rank: props.rank }
  let results = await iyp_api.run(
    queries.map((obj) => ({ statement: obj.query, parameters: params }))
  )

  const node = results[0][0].node
  if ('AS' == node) {
    selects.value[0].hasData = true
  }
  if ('DomainName' == node) {
    selects.value[1].hasData = true
  }
}

const pushRoute = () => {
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: Object.assign({}, route.query, {
        display: JSON.stringify(
          selects.value
            .map((obj, index) => {
              if (obj.value) {
                return index
              }
            })
            .filter((val) => val != null)
        )
      })
    })
  )
}

const hashToDisplay = () => {
  selects.value.forEach((obj) => {
    if (obj.label === props.hash.replace('#', '').replaceAll('-', ' ')) {
      obj.value = true
    }
  })
}

watch(selects.value, () => {
  pushRoute()
})

watch(selectAll, () => {
  selects.value.forEach((obj) => {
    if (obj.hasData) {
      obj.value = selectAll.value
    }
  })
})

onMounted(() => {
  init()
  if (displayWidgets.value.length === selects.value.length) {
    selectAll.value = true
  } else if (props.hash) {
    hashToDisplay()
  } else {
    displayWidgets.value.forEach((val) => (selects.value[val].value = true))
  }
})
</script>

<template>
  <QCard
    flat
    bordered
  >
    <QCardSection>
      <div class="text-h6">
        Select widgets to show
      </div>
    </QCardSection>
    <QSeparator inset />
    <QCardSection>
      <span
        v-for="select in selects"
        :key="select.value"
      >
        <QCheckbox
          v-if="select.hasData"
          v-model="select.value"
          :label="select.label"
        />
      </span>
      <QCheckbox
        v-model="selectAll"
        label="All"
      />
    </QCardSection>
  </QCard>
  <GenericCardController
    v-if="selects[0].value"
    :title="$t('iyp.rank.topAs.title')"
    :sub-title="$t('iyp.rank.topAs.caption') + pageTitle"
    :info-title="$t('iyp.rank.topAs.info.title')"
    :info-description="$t('iyp.rank.topAs.info.description')"
    class="card"
  >
    <RankASRankings
      :rank="rank"
      :page-title="pageTitle"
    />
  </GenericCardController>
  <GenericCardController
    v-if="selects[1].value"
    :title="$t('iyp.rank.topHostnames.title')"
    :sub-title="$t('iyp.rank.topHostnames.caption') + pageTitle + ' (limited to 100K)'"
    :info-title="$t('iyp.rank.topHostnames.info.title')"
    :info-description="$t('iyp.rank.topHostnames.info.description')"
    class="card"
  >
    <RankHostNameRankings
      :rank="rank"
      :page-title="pageTitle"
    />
  </GenericCardController>
</template>

<style>
.card {
  margin-top: 20px;
}
</style>
