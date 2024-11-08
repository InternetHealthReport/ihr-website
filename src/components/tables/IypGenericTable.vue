<script setup>
import {
  QSpinner,
  QTabs,
  QTab,
  QTabPanels,
  QTabPanel,
  QTable,
  QTh,
  QTooltip,
  QInput,
  QBtn,
  QTr,
  QTd,
  QIcon,
  useQuasar,
  exportFile,
  QMarkupTable,
  copyToClipboard
} from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import '@/styles/chart.css'

const iyp_api = inject('iyp_api')

const props = defineProps({
  columns: {
    type: Array
  },
  data: {
    type: Array
  },
  loadingStatus: {
    type: Boolean,
    default: false
  },
  cypherQuery: {
    type: String
  },
  slotLength: {
    type: Number,
    default: 0
  },
  pagination: {
    type: Object,
    default: Object
  }
})

const $q = useQuasar()

const route = useRoute()
const router = useRouter()

const activeTab = ref('chart')
const filter = ref('')
const colToUnderline = ref([
  'ASN',
  'AS',
  'Origin AS',
  'Country',
  'IXP',
  'Prefix',
  'Reg. Country',
  'Geoloc. Country',
  'Country',
  'CC',
  'Hostname'
])
const underline = ref(false)
const metadata = ref({})
const loadingStatusMetadata = ref(false)

const wrapCsvValue = (val, formatFn, row) => {
  let formatted = formatFn !== void 0 ? formatFn(val, row) : val

  formatted = formatted === void 0 || formatted === null ? '' : String(formatted)

  formatted = formatted.split('"').join('""')
  /**
   * Excel accepts \n and \r in strings, but some other CSV parsers do not
   * Uncomment the next two lines to escape new lines
   */
  // .split('\n').join('\\n')
  // .split('\r').join('\\r')

  return `"${formatted}"`
}

const exportTable = () => {
  // naive encoding to csv format
  const content = [props.columns.map((col) => wrapCsvValue(col.label))]
    .concat(
      props.data.map((row) =>
        props.columns
          .map((col) =>
            wrapCsvValue(
              typeof col.field === 'function'
                ? col.field(row)
                : row[col.field === void 0 ? col.name : col.field],
              col.format,
              row
            )
          )
          .join(',')
      )
    )
    .join('\r\n')

  const status = exportFile('table-export.csv', content, 'text/csv')

  if (status !== true) {
    $q.notify({
      message: 'Browser denied file download...',
      color: 'negative',
      icon: 'warning'
    })
  }
}

const getMetadataQuery = () => {
  let query = props.cypherQuery.replace(/(RETURN|return)(?:.)*/gm, '')
  query = query.replace(/(CALL|call)(?:.|\n)*}/gm, '')
  query = query.replace(/(ORDER|order)(?:.|\n)*/gm, '')
  query = query.replace(/(WHERE|where)(?:.|n)*/gm, '')
  query = query.replace(/\[(?:.)*?:/gm, '[:')
  query = query.replace(/\*(?!\d)/gm, '')
  query = query.split('[:')
  const queryVars = []
  for (let i = 1; i < query.length; i++) {
    queryVars.push(`edge${i - 1}`)
    query[i] = `${queryVars[i - 1]}:${query[i]}`
  }
  query = `${query.join('[')} `
  const collectList = `WITH *, CASE WHEN var0 IS :: LIST<RELATIONSHIP> THEN var0 ELSE [var0] END AS var
    WITH *, head(var) AS var0
    WITH *, COLLECT(DISTINCT [var0.reference_org, var0.reference_url_data, var0.reference_url_info, var0.reference_time_fetch, var0.reference_time_modification]) AS var1`
  const listVars = []
  queryVars.forEach((el, index) => {
    listVars.push(`list${index}`)
    query += collectList.replaceAll('var0', el).replace('var1', listVars[index])
    if (index < queryVars.length - 1) {
      query += ' '
    }
  })
  query += ` UNWIND ${listVars.join('+')} AS metadata_list RETURN DISTINCT metadata_list`
  return query
}

const parseDate = (date) => {
  let date_obj
  if (date === null) {
    return '-'
  } else if (typeof date == 'string') {
    date_obj = new Date(date)
  } else {
    date_obj = new Date(date.toString())
  }
  return date_obj.toLocaleDateString('en-us', { month: 'long', day: 'numeric', year: 'numeric' })
}

const fetchMetadata = async () => {
  loadingStatusMetadata.value = true
  try {
    let res = await iyp_api.run([{ statement: getMetadataQuery() }])
    res[0].forEach((obj) => {
      const list = obj.metadata_list
      if (list[0] === null) {
        return
      }
      const date_fetch = parseDate(list[3])
      const date_modification = parseDate(list[4])
      if (list[0] in metadata.value) {
        metadata.value[list[0]].reference_time_fetch.push(date_fetch)
        metadata.value[list[0]].reference_time_modification.push(date_modification)
        metadata.value[list[0]].reference_url_data.push(list[1])
        metadata.value[list[0]].reference_url_info.push(list[2])
      } else {
        metadata.value[list[0]] = {
          reference_time_fetch: [date_fetch],
          reference_time_modification: [date_modification],
          reference_url_data: [list[1]],
          reference_url_info: [list[2]]
        }
      }
    })
    loadingStatusMetadata.value = false
  } catch (e) {
    loadingStatusMetadata.value = false
    return
  }
}

const toUnderline = (name) => {
  if (colToUnderline.value.includes(name)) {
    return {
      underline: true,
      'cursor-pointer': true
    }
  }
}

const routeToEntity = (entity, data) => {
  if ((entity == 'ASN') | (entity == 'AS') | (entity == 'Origin AS')) {
    let asn = Array.isArray(data.asn) ? data.asn[0] : data.asn
    routeToASN(asn)
  } else if (entity == 'Prefix') {
    let prefix = Array.isArray(data.prefix) ? data.prefix[0] : data.prefix
    const [host, prefixLength] = prefix.split('/')
    routeToPrefix(host, prefixLength)
  } else if (entity == 'IXP') {
    let ixpid = Array.isArray(data.id) ? data.id[0] : data.id
    routeToIXP(ixpid)
  } else if (
    (entity == 'CC') |
    (entity == 'Country') |
    (entity == 'Reg. Country') |
    (entity == 'Geoloc. Country')
  ) {
    let cc = Array.isArray(data.cc) ? data.cc[0] : data.cc
    routeToCountry(cc)
  } else if (entity == 'Hostname') {
    let hostName = Array.isArray(data.hostName) ? data.hostName[0] : data.hostName
    routeToHostName(hostName)
  }
}

const routeToASN = (asn) => {
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: `AS${asn}` }
    })
  )
}

const routeToPrefix = (host, prefixLength) => {
  router.push(
    Tr.i18nRoute({
      name: 'prefix',
      params: { ip: host, length: prefixLength }
    })
  )
}

const routeToIXP = (id) => {
  router.push(
    Tr.i18nRoute({
      name: 'network',
      params: { id: `IXP${id}` }
    })
  )
}

const routeToCountry = (cc) => {
  router.push(
    Tr.i18nRoute({
      name: 'country',
      params: { cc: cc }
    })
  )
}

const routeToHostName = (hostName) => {
  router.push(
    Tr.i18nRoute({
      name: 'hostname',
      params: { hostname: hostName }
    })
  )
}

const transition = (newVal, oldVal) => {
  if (newVal === 'metadata') {
    fetchMetadata()
  }
}

watch(activeTab, () => {
  if (activeTab.value == 'chart') {
    // console.log(`Current Tab: ${activeTab.value}`)
  }
})
watch(
  () => props.slotLength,
  () => {
    if (props.slotLength <= 0) {
      activeTab.value = 'data'
    }
  }
)
watch(
  () => props.data,
  () => {
    if (!props.data.length) {
      activeTab.value = 'data'
    }
  }
)

onMounted(() => {
  if (props.slotLength <= 0) {
    activeTab.value = 'data'
  }
})
</script>

<template>
  <div>
    <div
      v-if="loadingStatus || loadingStatusMetadata"
      class="IHR_loading-spinner"
      style="z-index: 1000"
    >
      <QSpinner color="secondary" size="15em" />
    </div>
    <div>
      <QTabs
        class="table-card text-grey bg-grey-2"
        v-model="activeTab"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <QTab name="chart" label="CHART" :disable="slotLength <= 0 ? true : false"></QTab>
        <QTab name="data" label="DATA"></QTab>
        <QTab name="api" label="CYPHER QUERY"></QTab>
        <QTab name="metadata" label="METADATA"></QTab>
      </QTabs>
      <QTabPanels v-model="activeTab" animated @transition="transition">
        <QTabPanel name="chart">
          <div id="chartContainer">
            <slot></slot>
          </div>
        </QTabPanel>
        <QTabPanel name="data">
          <QTable :rows="data" :columns="columns" :filter="filter" :pagination="pagination" flat>
            <template v-slot:header-cell="props">
              <QTh :props="props">
                <QTooltip v-if="props.col.description" anchor="bottom start" self="bottom start">{{
                  props.col.description
                }}</QTooltip>
                {{ props.col.label }}
              </QTh>
            </template>
            <template v-slot:top-right>
              <QInput debounce="300" v-model="filter" placeholder="Search">
                <template v-slot:append>
                  <QIcon name="search" />
                  <QTooltip class="bg-accent">Search in the table</QTooltip>
                </template>
              </QInput>
              <QBtn flat rounded icon-right="archive" @click="exportTable">
                <QTooltip class="bg-accent">Download CSV file</QTooltip>
              </QBtn>
            </template>
            <template v-slot:body="props">
              <QTr :props="props">
                <QTd
                  :class="toUnderline(column.name)"
                  v-for="column in columns"
                  :props="props"
                  :key="column.name"
                  @click.native="routeToEntity(column.name, props.row)"
                >
                  {{ column.format(column.field(props.row)) }}
                </QTd>
              </QTr>
            </template>
          </QTable>
        </QTabPanel>
        <QTabPanel name="api" class="text-left q-pa-lg" light>
          <QBtn no-caps dense flat @click="copyToClipboard(cypherQuery)">
            <code>{{ cypherQuery }}</code>
            <QTooltip>Click to copy</QTooltip>
          </QBtn>
          <div>
            <br />IYP Public Instance Link:
            <a href="https://iyp.iijlab.net/">https://iyp.iijlab.net/</a>
          </div>
        </QTabPanel>
        <QTabPanel name="metadata">
          <QMarkupTable flat bordered v-if="!loadingStatus">
            <thead>
              <tr>
                <th class="text-left">Data Source</th>
                <th class="text-left">Fetched Time</th>
                <th class="text-left">Modification Time</th>
                <th class="text-left">URL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in Object.keys(metadata)">
                <td class="text-left">
                  <a
                    :href="metadata[key].reference_url_info[0]"
                    v-if="metadata[key].reference_url_info[0]"
                    >{{ key }}</a
                  >
                  <span v-else>{{ key }}</span>
                </td>
                <td class="text-left">
                  <div v-for="time in metadata[key].reference_time_fetch">{{ time }}</div>
                </td>
                <td class="text-left">
                  <div v-for="time in metadata[key].reference_time_modification">{{ time }}</div>
                </td>
                <td class="text-left">
                  <div v-for="url in metadata[key].reference_url_data">
                    <a :href="url">{{ url }}</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </QMarkupTable>
        </QTabPanel>
      </QTabPanels>
    </div>
  </div>
</template>

<style>
.underline:hover {
  text-decoration: underline;
}
</style>
