<script setup>
import { QSelect, QIcon, QSpinner, QItem, QItemSection } from 'quasar'
import { NetworkQuery, CountryQuery } from '@/plugins/IhrApi'
import { ref, inject, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'

const { t } = useI18n()

const ihr_api = inject('ihr_api')

const MIN_CHARACTERS = 3
const MAX_RESULTS = 10

const props = defineProps({
  bg: {
    type: String,
    default: 'accent',
  },
  labelTxt: {
    type: String,
  },
  label: {
    type: String,
    default: 'grey-5',
  },
  input: {
    type: String,
    default: 'text-white text-weight-bold q-mt-xs',
  },
  noAS: {
    type: Boolean,
    default: false,
  },
})

const router = useRouter()

const options = ref([{ name: 'Suggestions' }, { label: 2497, value: 2497, name: 'IIJ' }])
const model = ref([])
const loading = ref(false)
const always = ref(false)
const networkQuery = ref(new NetworkQuery().orderedByNumber())
const countryQuery = ref(new CountryQuery().orderedByCode())

const search = (value, update) => {
  loading.value = true
  options.value = []
  countryQuery.value.containsName(value)
  ihr_api.country(countryQuery.value, result => {
    result.results.some(element => {
      options.value.push({
        value: element.code,
        name: element.name,
        type: 'country',
      })
      update()
    })
    if (options.value.length === 0 && props.noAS) {
      options.value.push({
        label: `No results found for "${value}"`,
        type: 'no-results',
      })
    }
  })
  if (!props.noAS) {
    networkQuery.value.mixedContentSearch(value)
    ihr_api.network(
      networkQuery.value,
      result => {
        result.results.some(element => {
          options.value.push({
            value: element.number,
            name: element.name,
            type: 'asn',
          })
          return options.value.length > MAX_RESULTS
        })

        if (options.value.length === 0) {
          options.value.push({
            label: `No results found for "${value}"`,
            type: 'no-results',
          })
        }
        loading.value = false
        update()
      },
      error => {
        console.error(error)
      }
    )
  } else {
    loading.value = false
    update()
  }
}

const gotoASN = (number) => {
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { asn: ihr_api.ihr_NumberToAsOrIxp(number) }
  }))
}

const gotoCountry = (code) => {
  router.push(Tr.i18nRoute({
    name: 'countries',
    params: { cc: code },
  }))
}

const filter = (value, update, abort) => {
  if (value.length < MIN_CHARACTERS) {
    abort()
  } else {
    search(value, update)
  }
}

const placeholder = computed(() => {
  if (props.labelTxt == null) {
    return `${t('searchBar.placeholder')}`
  }
  return props.labelTxt
})

const displayValue = computed(() => {
  if (model.value.type === 'asn') {
    return `AS${model.value.value} - ${model.value.name}`
  } else if (model.value.type === 'country') {
    return `${model.value.name}`
  }
})
</script>

<template>
  <QSelect
    v-model="model"
    outlined
    dense
    use-input
    :label="placeholder"
    :options="options"
    @filter="filter"
    hide-dropdown-icon
    input-debounce="1000"
    :bg-color="bg"
    :label-color="label"
    :input-class="input"
    hide-selected
  >
    <template v-slot:append>
      <div v-if="!loading">
        <QIcon :color="label" name="fas fa-search q-mb-xs" width="0.82em" />
      </div>
      <div v-else>
        <QSpinner :color="label" size="0.82em" />
      </div>
    </template>
    <template v-slot:loading> </template>
    <template v-slot:option="scope">
      <div v-if="scope.opt.type === 'asn'">
        <QItem v-if="scope.opt.type == 'asn'" v-bind="scope.itemProps" @click="gotoASN(scope.opt.value)">
          <QItemSection side color="accent">{{ ihr_api.ihr_NumberToAsOrIxp(scope.opt.value) }}</QItemSection>
          <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
        </QItem>
      </div>
      <div v-else-if="scope.opt.type === 'country'">
        <QItem
          v-if="scope.opt.type == 'country'"
          v-bind="scope.itemProps"
          @click="gotoCountry(scope.opt.value)"
        >
          <QItemSection side color="accent"> Country </QItemSection>
          <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
        </QItem>
      </div>
      <div v-else-if="scope.opt.type === 'no-results'">
        <QItem v-bind="scope.itemProps">
          <QItemSection side color="accent">{{ scope.opt.label }}</QItemSection>
        </QItem>
      </div>
    </template>
  </QSelect>
</template>

<style lang="stylus" scoped>
.IHR_
  &asn-element
    width 100%
    margin 0px
    padding 0px
    &-name
      text-align left
      margin-left 10px

.IHR_search-bar
  text-color 'white'
  color 'white'
  input white
</style>