<script setup>
import { QSelect, QBtn, QSpinner, QItem, QItemSection, QDialog } from 'quasar'
import { ref, inject, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import Tr from '@/i18n/translation'
import * as ipAddress from 'ip-address'
import WorldMap from '../maps/WorldMap.vue'

const { t } = useI18n()

const iyp_api = inject('iyp_api')

const MIN_CHARACTERS = 3
const MAX_RESULTS = 10

const props = defineProps({
  bg: {
    type: String,
    default: 'accent'
  },
  labelTxt: {
    type: String
  },
  label: {
    type: String,
    default: 'grey-5'
  },
  input: {
    type: String,
    default: 'text-white text-weight-bold q-mt-xs'
  },
  noAS: {
    type: Boolean,
    default: false
  },
  noIXP: {
    type: Boolean,
    default: false
  },
  noPrefix: {
    type: Boolean,
    default: false
  },
  noCountry: {
    type: Boolean,
    default: false
  },
  noHostName: {
    type: Boolean,
    default: false
  },
  noTag: {
    type: Boolean,
    default: false
  },
  noRank: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const router = useRouter()

const options = ref([{ name: 'Suggestions' }, { label: 2497, value: 2497, name: 'IIJ' }])
const model = ref([])
const loading = ref(false)
const activateSearch = ref(true)

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

let loadingQueryAS = false
let loadingQueryPrefixes = false
let loadingQueryIXPs = false
let loadingQueryCountries = false
let loadingQueryASNames = false
let loadingQueryHostNames = false
let loadingQueryTags = false
let loadingQueryRanks = false

const search = async (value, update) => {
  loading.value = true
  options.value = []
  const asnRegex = /^as(\d+)$/i
  const asnMatch = asnRegex.exec(value)
  let prefixMatch
  try {
    prefixMatch = new Address4(value).isCorrect()
  } catch (e) {
    prefixMatch = null
  }
  if (!prefixMatch) {
    try {
      prefixMatch = new Address6(value).isCorrect()
    } catch (e) {
      prefixMatch = null
    }
  }
  if (asnMatch) {
    loadingQueryAS = true
    queryAS(asnMatch[1]).then((res) => {
      searchResponse(res, update)
      loadingQueryAS = false
      noResults(res, update)
    })
  } else if (prefixMatch) {
    loadingQueryPrefixes = true
    queryPrefixes(value).then((res) => {
      searchResponse(res, update)
      loadingQueryPrefixes = false
      noResults(res, update)
    })
  } else {
    mixedEntitySearch(value, update)
  }
}

const noResults = (res, update) => {
  if (
    !res.length &&
    !loadingQueryAS &&
    !loadingQueryPrefixes &&
    !loadingQueryIXPs &&
    !loadingQueryCountries &&
    !loadingQueryASNames &&
    !loadingQueryHostNames &&
    !loadingQueryTags &&
    !loadingQueryRanks
  ) {
    const optRes = optimizeSearchResults([
      {
        value: 'No results found',
        name: 'No results found',
        type: 'Fail'
      }
    ])
    if (optRes) {
      options.value.push(optRes[0])
      update()
    }
    loading.value = false
  }
}

const searchResponse = (res, update) => {
  res.forEach((element) => {
    let value
    let name
    if (element.node === 'AS') {
      if (element.asn) {
        value = element.asn
        name = element.name
      } else {
        value = element.id
        name = element.as
      }
    } else if (element.node === 'Prefix') {
      value = element.prefix
      name = element.prefix
    } else if (element.node === 'IXP') {
      value = element.id
      name = element.ixp
    } else if (element.node === 'Country') {
      value = element.cc
      name = element.name
    } else if (element.node === 'Tag') {
      value = element.label
      name = element.label
    } else if (element.node === 'HostName') {
      value = element.hostName
      name = element.hostName
    } else if (element.node === 'Ranking') {
      value = element.name
      name = element.name
    }
    options.value.push({
      value: value,
      name: name,
      type: element.node
    })
    update()
    loading.value = false
  })
}

const queryAS = async (asn) => {
  if (props.noAS) {
    return []
  }
  const query =
    'MATCH (a:AS) WHERE toString(a.asn) STARTS WITH $asn MATCH (a)-[:NAME]-(n:Name) RETURN a.asn as asn, head(collect(DISTINCT(n.name))) as name, head(labels(a)) AS node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { asn: asn } }])
  return res[0]
}

const queryPrefixes = async (value) => {
  if (props.noPrefix) {
    return []
  }
  const query =
    'MATCH (p:Prefix) WHERE p.prefix STARTS WITH $value RETURN p.prefix as prefix, head(labels(p)) AS node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const mixedEntitySearch = async (value, update) => {
  const searchTerm = value.toLowerCase()
  if (!props.noIXP) {
    loadingQueryIXPs = true
    queryIXPs(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryIXPs = false
      noResults(res, update)
    })
  }
  if (!props.noCountry) {
    loadingQueryCountries = true
    queryCountries(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryCountries = false
      noResults(res, update)
    })
  }
  if (!props.noAS) {
    loadingQueryASNames = true
    queryASNames(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryASNames = false
      noResults(res, update)
    })
  }
  if (!props.noHostName) {
    loadingQueryHostNames = true
    queryHostNames(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryHostNames = false
      noResults(res, update)
    })
  }
  if (!props.noTag) {
    loadingQueryTags = true
    queryTags(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryTags = false
      noResults(res, update)
    })
  }
  if (!props.noRank) {
    loadingQueryRanks = true
    queryRanks(searchTerm).then((res) => {
      searchResponse(optimizeSearchResults(res), update)
      loadingQueryRanks = false
      noResults(res, update)
    })
  }
}

const queryASNames = async (value) => {
  const query =
    'MATCH (n:Name)-[:NAME]-(a:AS) WHERE a.asn = toInteger($value) OR toLower(n.name) CONTAINS $value RETURN head(collect(DISTINCT(n.name))) AS as, a.asn AS id, head(labels(a)) AS node LIMIT 1'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const queryCountries = async (value) => {
  const query =
    'MATCH (c:Country) WHERE toLower(c.name) STARTS WITH $value RETURN c.country_code AS cc, c.name AS name, head(labels(c)) as node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const queryIXPs = async (value) => {
  const query =
    'MATCH (i:IXP)-[:EXTERNAL_ID]-(p:PeeringdbIXID) WHERE toLower(i.name) STARTS WITH $value RETURN i.name as ixp, p.id as id, head(labels(i)) AS node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const queryHostNames = async (value) => {
  const query =
    'MATCH (h:HostName) WHERE toLower(h.name) STARTS WITH $value RETURN h.name as hostName, head(labels(h)) as node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const queryTags = async (value) => {
  const query =
    'MATCH (t:Tag) WHERE toLower(t.label) STARTS WITH $value RETURN t.label as label, head(labels(t)) as node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const queryRanks = async (value) => {
  const query =
    'MATCH (r:Ranking) WHERE toLower(r.name) STARTS WITH $value RETURN r.name as name, head(labels(r)) as node LIMIT 10'
  const res = await iyp_api.run([{ statement: query, parameters: { value: value } }])
  return res[0]
}

const optimizeSearchResults = (res) => {
  if (!res || !res.length) {
    return []
  } else if (res[0].type === 'Fail' && options.value.length > 1) {
    return null
  }
  return res
    .flat()
    .sort((a, b) => {
      if (a.as && b.as) {
        return a.as.length - b.as.length
      }
    })
    .reverse()
}

const filter = (value, update, abort) => {
  activateSearch.value = true
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
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: `AS${asn}` }
    })
  )
}

const routeToIXP = (ixp) => {
  let oldIxp = paramExists('id')
  if (oldIxp) {
    oldIxp = Number(oldIxp.replace('IXP', ''))
    if (oldIxp == ixp) {
      return
    }
  }
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: `IXP${ixp}` }
    })
  )
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
  router.push(
    Tr.i18nRoute({
      name: 'prefix',
      params: { ip: host, length: prefixLength }
    })
  )
}

const routeToCountry = (cc) => {
  const oldCc = paramExists('cc')
  if (oldCc) {
    if (oldCc == cc) {
      return
    }
  }
  router.push(
    Tr.i18nRoute({
      name: 'country',
      params: { cc: cc }
    })
  )
}

const handleCountryClicked = (cc) => {
  routeToCountry(cc)
}

const routeToHostName = (hostName) => {
  const oldhostName = paramExists('hostName')
  if (oldhostName) {
    if (oldhostName == hostName) {
      return
    }
  }
  router.push(
    Tr.i18nRoute({
      name: 'hostname',
      params: { hostname: hostName }
    })
  )
}

const routeToTag = (tag) => {
  const oldTag = paramExists('tag')
  if (oldTag) {
    if (oldTag == tag) {
      return
    }
  }
  router.push(
    Tr.i18nRoute({
      name: 'tag',
      params: { tag: tag }
    })
  )
}

const routeToRank = (rank) => {
  const oldRank = paramExists('rank')
  if (oldRank) {
    if (oldRank == rank) {
      return
    }
  }
  router.push(
    Tr.i18nRoute({
      name: 'rank',
      params: { rank: rank }
    })
  )
}

const showMapDialog = ref(false)

const showMap = () => {
  showMapDialog.value = true
}

const placeholder = computed(() => {
  if (props.labelTxt == null) {
    return `${t('searchBar.placeholder')}`
  }
  return props.labelTxt
})

watch(
  () => route.path,
  () => {
    activateSearch.value = false
  }
)
</script>

<template>
  <QSelect
    v-model="model"
    outlined
    dense
    use-input
    :label="placeholder"
    :options="options"
    hide-dropdown-icon
    input-debounce="1000"
    :bg-color="bg"
    :label-color="label"
    :input-class="input"
    hide-selected
    @filter="filter"
  >
    <template #append>
      <div v-if="!props.noCountry" @click="showMap">
        <QBtn :color="label" icon="fas fa-map" flat dense />
        <QDialog v-model="showMapDialog">
          <WorldMap @country-selected="handleCountryClicked" />
        </QDialog>
      </div>
      <div>
        <div
          v-if="
            !loadingQueryAS &&
            !loadingQueryPrefixes &&
            !loadingQueryIXPs &&
            !loadingQueryCountries &&
            !loadingQueryASNames &&
            !loadingQueryHostNames &&
            !loadingQueryTags &&
            !loadingQueryRanks
          "
        >
          <QBtn :color="label" icon="fas fa-search" flat dense />
        </div>
        <div v-else>
          <QSpinner :color="label" size="0.82em" />
        </div>
      </div>
    </template>
    <template #loading />
    <template #option="scope">
      <QItem
        v-if="scope.opt.type == 'AS' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToAS(scope.opt.value)"
      >
        <QItemSection side color="accent"> AS{{ scope.opt.value }} </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'Prefix' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToPrefix(scope.opt.value)"
      >
        <QItemSection side color="accent"> Prefix </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'IXP' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToIXP(scope.opt.value)"
      >
        <QItemSection side color="accent"> IXP{{ scope.opt.value }} </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'Country' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToCountry(scope.opt.value)"
      >
        <QItemSection side color="accent"> Country </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'HostName' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToHostName(scope.opt.value)"
      >
        <QItemSection side color="accent"> Hostname </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'Tag' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToTag(scope.opt.value)"
      >
        <QItemSection side color="accent" && activate-search> Tag </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem
        v-if="scope.opt.type == 'Ranking' && activateSearch"
        v-bind="scope.itemProps"
        @click="routeToRank(scope.opt.value)"
      >
        <QItemSection side color="accent"> Rank </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
      <QItem v-if="scope.opt.type == 'Fail' && activateSearch" v-bind="scope.itemProps">
        <!-- <QItemSection side color="accent">Country</QItemSection> -->
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
    </template>
  </QSelect>
</template>

<style scoped>
.IHR_asn-element {
  width: 100%;
  margin: 0px;
  padding: 0px;
}
.IHR_asn-element-name {
  text-align: left;
  margin-left: 10px;
}
.IHR_search-bar {
  text-color: 'white';
  color: 'white';
  input: #fff;
}
</style>
