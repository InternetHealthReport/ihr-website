<script setup>
import { QSelect, QIcon, QSpinner, QItem, QItemSection } from 'quasar'
import { ref, inject, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import { NetworkQuery, CountryQuery } from '@/plugins/IhrApi'
import getCountryName from '@/plugins/countryName'
import * as ipAddress from 'ip-address'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

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
  noIXP: {
    type: Boolean,
    default: false,
  },
  noPrefix: {
    type: Boolean,
    default: false,
  },
  noCountry: {
    type: Boolean,
    default: false,
  },
  noHostName: {
    type: Boolean,
    default: false,
  },
  noTag: {
    type: Boolean,
    default: false,
  },
})

const route = useRoute()
const router = useRouter()

const options = ref([{ name: 'Suggestions' }, { label: 2497, value: 2497, name: 'IIJ' }])
const model = ref([])
const loading = ref(false)

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

const search = async (value, update) => {
  loading.value = true
  options.value = []
  const asnRegex = /^(as)?(\d+)$/i
  const asnMatch = asnRegex.exec(value)
  let prefixMatch
  try {
    prefixMatch = (new Address4(value)).isCorrect()
  } catch (e) {
    prefixMatch = null
  }
  if (!prefixMatch) {
    try {
      prefixMatch = (new Address6(value)).isCorrect()
    } catch (e) {
      prefixMatch = null
    }
  }
  let res
  if (asnMatch) {
    res = await queryAS(asnMatch.input)
  } else if (prefixMatch) {
    res = await queryPrefixes(value)
  } else {
    res = await mixedEntitySearch(value)
    res = optimizeSearchResults(res)
  }
  if (!res.length) {
    options.value.push({
      value: 'No results found',
      name: 'No results found',
      type: 'Fail',
    })
    update()
  } else {
    res.forEach(element => {
      let value
      if (element.id) {
        value = element.id
      } else {
        value = element.name
      }
      options.value.push({
        value: value.low ? value.low : value,
        name: element.name,
        type: element.node,
      })
      update()
    })
  }
  loading.value = false
}

const queryAS = async (asn) => {
  if (props.noAS) {
    return []
  }
  const query = 'MATCH (a:AS) WHERE toString(a.asn) STARTS WITH $asn MATCH (a)-[:NAME]-(n:Name) RETURN a.asn as asn, head(collect(DISTINCT(n.name))) as name, head(labels(a)) AS node LIMIT 10'
  const mapping = {
    id: 'asn',
    name: 'name',
    node: 'node',
  }
  const res = await iyp_api.run(query, { asn: asn })
  const formattedRes = iyp_api.formatResponse(res, mapping)
  return formattedRes
}

const queryPrefixes = async (value) => {
  if (props.noPrefix) {
    return []
  }
  const query = 'MATCH (p:Prefix) WHERE p.prefix STARTS WITH $value RETURN p.prefix as prefix, head(labels(p)) AS node LIMIT 10'
  const mapping = {
    name: 'prefix',
    node: 'node',
  }
  const res = await iyp_api.run(query, { value: value })
  const formattedRes = iyp_api.formatResponse(res, mapping)
  return formattedRes
}

const mixedEntitySearch = async (value) => {
  const funcs = []
  if (!props.noIXP) {
    funcs.push(queryIXPs)
  }
  if (!props.noCountry) {
    funcs.push(queryCountries)
  }
  if (!props.noAS) {
    funcs.push(queryASNames)
  }
  if (!props.noHostName) {
    funcs.push(queryHostNames)
  }
  if (!props.noTag) {
    funcs.push(queryTags)
  }
  if (!funcs.length) {
    return []
  }
  const searchTerm = value.toLowerCase()
  const queries = funcs.map(func => func(searchTerm))
  return await iyp_api.searchIYPInOneSession(queries)
}

const queryASNames = (value) => {
  const query = 'MATCH (n:Name)-[:NAME]-(a:AS) WHERE toLower(n.name) STARTS WITH $value MATCH (n)-[:NAME]-(a:AS) RETURN head(collect(DISTINCT(n.name))) AS as, a.asn AS id, head(labels(a)) AS node LIMIT 10'
  const mapping = {
    name: 'as',
    id: 'id',
    node: 'node',
  }
  return { cypherQuery: query, params: { value: value }, mapping }
}

const queryCountries = (value) => {
  const query = 'MATCH (c:Country) WHERE toLower(c.name) STARTS WITH $value RETURN c.country_code AS cc, c.name AS name, head(labels(c)) as node LIMIT 10'
  const mapping = {
    name: 'name',
    id: 'cc',
    node: 'node',
  }
  return { cypherQuery: query, params: { value: value }, mapping }
}

const queryIXPs = (value) => {
  const query = 'MATCH (i:IXP)-[:EXTERNAL_ID]-(p:PeeringdbIXID) WHERE toLower(i.name) STARTS WITH $value RETURN i.name as ixp, p.id as id, head(labels(i)) AS node LIMIT 10'
  const mapping = {
    name: 'ixp',
    id: 'id',
    node: 'node',
  }
  return { cypherQuery: query, params: { value: value }, mapping }
}

const queryHostNames = (value) => {
  const query = 'MATCH (d:DomainName) WHERE toLower(d.name) STARTS WITH $value RETURN d.name as hostName, head(labels(d)) as node LIMIT 10'
  const mapping = {
    name: 'hostName',
    id: 'hostName',
    node: 'node'
  }
  return { cypherQuery: query, params: { value: value }, mapping }
}

const queryTags = (value) => {
  const query = 'MATCH (t:Tag) WHERE toLower(t.label) STARTS WITH $value RETURN t.label as label, head(labels(t)) as node LIMIT 10'
  const mapping = {
    name: 'label',
    id: 'label',
    node: 'node'
  }
  return { cypherQuery: query, params: { value: value }, mapping }
}

const optimizeSearchResults = (res) => {
  return res.sort((a, b) => a.name.length - b.name.length)
}

const filter = (value, update, abort) => {
  if (value.length < MIN_CHARACTERS) {
    abort()
  } else {
    search(value, update)
  }
}

const paramExists = (param) => {
  const params = route.params
  if (param in params) {
    return params[param]
  }
  return null
}

const routeToAS = (asn) => {
  let oldAsn = paramExists('id')
  if (oldAsn) {
    oldAsn = Number(oldAsn.replace('AS', ''))
    if (oldAsn == asn) {
      return
    }
  }
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: `AS${asn}` },
  }))
}

const routeToIXP = (ixp) => {
  // route to old report page
  // getIdForIhrData(ixp, 'IXP', 'networks')
  // route to new iyp page
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: `IXP${ixp}` },
  }))
}

const routeToPrefix = (name) => {
  const oldPrefix = paramExists('id')
  const oldLength = paramExists('length')
  if (oldPrefix && oldLength) {
    if (`${oldPrefix}/${oldLength}` == name) {
      return
    }
  }
  const [host, prefixLength] = name.split('/')
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: host, length: prefixLength },
  }))
}

const routeToCountry = (cc) => {
  const oldCc = paramExists('cc')
  if (oldCc) {
    if (oldCc == cc) {
      return
    }
  }
  router.push(Tr.i18nRoute({
    name: 'countries',
    params: { cc: cc },
  }))
}

const routeToHostName = (hostName) => {
  const oldhostName = paramExists('hostName')
  if (oldhostName) {
    if (oldhostName == hostName) {
      return
    }
  }
  router.push(Tr.i18nRoute({
    name: 'hostnames',
    params: { hostName: hostName },
  }))
}

const routeToTag = (tag) => {
  const oldTag = paramExists('tag')
  if (oldTag) {
    if (oldTag == tag) {
      return
    }
  }
  router.push(Tr.i18nRoute({
    name: 'tags',
    params: { tag: tag },
  }))
}

const placeholder = computed(() => {
  if (props.labelTxt == null) {
    return `${t('searchBar.placeholder')}`
  }
  return props.labelTxt
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
      <QItem v-if="scope.opt.type == 'AS'" v-bind="scope.itemProps" @click="routeToAS(scope.opt.value)">
        <QItemSection side color="accent">AS{{ scope.opt.value }}</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'Prefix'" v-bind="scope.itemProps" @click="routeToPrefix(scope.opt.value)">
        <QItemSection side color="accent">Prefix</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'IXP'" v-bind="scope.itemProps" @click="routeToIXP(scope.opt.value)">
        <QItemSection side color="accent">IXP{{ scope.opt.value }}</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'Country'" v-bind="scope.itemProps" @click="routeToCountry(scope.opt.value)">
        <QItemSection side color="accent">Country</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'DomainName'" v-bind="scope.itemProps" @click="routeToHostName(scope.opt.value)"> <!-- TODO: change DomainName to HostName after IYP DB update -->
        <QItemSection side color="accent">Host Name</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'Tag'" v-bind="scope.itemProps" @click="routeToTag(scope.opt.value)">
        <QItemSection side color="accent">Tag</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'Fail'" v-bind="scope.itemProps">
        <!-- <QItemSection side color="accent">Country</QItemSection> -->
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
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