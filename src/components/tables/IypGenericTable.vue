<script setup>
import { QSpinner, QTabs, QTab, QTabPanels, QTabPanel, QTable, QTh, QTooltip, QInput, QBtn, QTr, QTd, QIcon, useQuasar, exportFile, QMarkupTable, copyToClipboard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'

const iyp_api = inject('iyp_api')

const props = defineProps({
  columns: {
    type: Array,
  },
  data: {
    type: Array,
  },
  loadingStatus: {
    type: Boolean,
    default: false,
  },
  cypherQuery: {
    type: String,
  },
  slotLength: {
    type: Number,
    default: 0,
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
const colToUnderline = ref(['ASN', 'AS', 'Origin AS', 'Country', 'IXP', 'Prefix','Reg. Country', 'Geoloc. Country', 'Country', 'CC'])
const underline = ref(false)
const metadata = ref({})
const loadingStatus = ref(true)

const wrapCsvValue = (val, formatFn, row) => {
  let formatted = formatFn !== void 0
    ? formatFn(val, row)
    : val

  formatted = formatted === void 0 || formatted === null
    ? ''
    : String(formatted)

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
  const content = [props.columns.map(col => wrapCsvValue(col.label))].concat(
  props.data.map(row => props.columns.map(col => wrapCsvValue(
    typeof col.field === 'function'
      ? col.field(row)
      : row[ col.field === void 0 ? col.name : col.field ],
    col.format,
    row
  )).join(','))
).join('\r\n')

const status = exportFile(
  'table-export.csv',
  content,
  'text/csv'
)

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
  query = query.replaceAll('*', '')
  query = query.split('[:')
  const queryVars = []
  for (let i=1; i<query.length; i++) {
    queryVars.push(`edge${i-1}`)
    query[i] = `${queryVars[i-1]}:${query[i]}`
  }
  query = `${query.join('[')} WITH `
  const collectList = 'COLLECT(DISTINCT [var0.reference_org, var0.reference_url, var0.reference_time]) AS var1'
  const listVars = []
  queryVars.forEach((el, index) => {
    listVars.push(`list${index}`)
    query += collectList.replaceAll('var0', el).replace('var1', listVars[index])
    if (index < queryVars.length - 1) {
      query += ', '
    }
  })
  query += ` UNWIND ${listVars.join('+')} AS metadata_list RETURN DISTINCT metadata_list`
  return query
}

const fetchMetadata = async () => {
  loadingStatus.value = true
  try {
    let res = await iyp_api.runManyInOneSession([{ cypherQuery: getMetadataQuery() }])
    res[0].records.forEach(obj => obj._fields.forEach(val => {
      if (val.includes(null)) {
        return
      }
      let date = val[2]
      if (typeof(date) == 'string') {
        date = new Date(date)
      } else {
        date = new Date(date.toString())
      }
      date = date.toLocaleDateString('en-us', {month: 'long', day: 'numeric', year: 'numeric'})
      if (val[0] in metadata.value) {
        metadata.value[val[0]].reference_time.push(date)
        metadata.value[val[0]].reference_url.push(val[1])
      } else {
        metadata.value[val[0]] = { reference_time: [ date ], reference_url: [ val[1] ] }
      }
    }))
    loadingStatus.value = false
  } catch (e) {
    loadingStatus.value = false
    return
  }
}

const toUnderline = (name) => {
  if (colToUnderline.value.includes(name)) {
    return {
      underline: true,
      'cursor-pointer': true,
    }
  }
}

const routeToEntity = (entity, data) => {
  if (entity == 'ASN' | entity == 'AS' | entity == 'Origin AS') {
    let asn= Array.isArray(data.get('asn'))?data.get('asn')[0]:data.get('asn')
    routeToASN(asn)
  } else if (entity == 'Prefix') {
    let prefix= Array.isArray(data.get('prefix'))?data.get('prefix')[0]:data.get('prefix')
    const [host, prefixLength] = prefix.split('/')
    routeToPrefix(host, prefixLength)
  } else if (entity == 'IXP') {
    let ixpid= Array.isArray(data.get('id'))?data.get('id')[0]:data.get('id')
    routeToIXP(ixpid)
  } else if (entity == 'CC' | entity == 'Country' |  entity == 'Reg. Country' | entity == 'Geoloc. Country') {
    let cc= Array.isArray(data.get('cc'))?data.get('cc')[0]:data.get('cc')
    routeToCountry(cc)
  }
}

const routeToASN = (asn) => {
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: `AS${asn}` },
  }))
}

const routeToPrefix = (host, prefixLength) => {
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: host, length: prefixLength },
  }))
}

const routeToIXP = (id) => {
  router.push(Tr.i18nRoute({
    name: 'networks',
    params: { id: `IXP${id}` },
  }))
}

const routeToCountry = (cc) => {
  router.push(Tr.i18nRoute({
    name: 'countries',
    params: { cc: cc },
  }))
}

watch(activeTab, () => {
  if (activeTab.value == 'chart') {
    // console.log(`Current Tab: ${activeTab.value}`)
  }
})
watch(() => props.slotLength, () => {
  if (props.slotLength <= 0) {
    activeTab.value = 'data'
  }
})

onMounted(() => {
  fetchMetadata()
  if (props.slotLength <= 0) {
    activeTab.value = 'data'
  }
})
</script>

<template>
  <div class="IYP_chart">
    <div v-if="loadingStatus" class="IYP_loading-spinner">
      <QSpinner color="secondary" size="3em" />
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
      <QTabPanels v-model="activeTab" animated>
        <QTabPanel name="chart">
          <div id="chartContainer">
              <slot></slot>
          </div>
        </QTabPanel>
        <QTabPanel name="data">
          <QTable :rows="data" :columns="columns" :filter="filter" :pagination="pagination" flat>
            <template v-slot:header-cell="props">
              <QTh :props="props">
                  <QTooltip v-if='props.col.description' anchor="bottom start" self="bottom start">{{ props.col.description }}</QTooltip>
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
              <QBtn
                flat rounded
                icon-right="archive"
                @click="exportTable"
                >
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
            <br>IYP Public Instance Link: <a href="https://iyp.iijlab.net/">https://iyp.iijlab.net/</a>
          </div>
        </QTabPanel>
        <QTabPanel name="metadata">
          <QMarkupTable flat bordered v-if="!loadingStatus">
            <thead>
              <tr>
                <th class="text-left">Reference Organization</th>
                <th class="text-left">Reference Time</th>
                <th class="text-left">Reference URL</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="key in Object.keys(metadata)">
                <td class="text-left">{{ key }}</td>
                <td class="text-left">
                  <div v-for="time in metadata[key].reference_time">{{ time }}</div>
                </td>
                <td class="text-left">
                  <div v-for="url in metadata[key].reference_url"><a :href="url">{{ url }}</a></div>
                </td>
              </tr>
            </tbody>
          </QMarkupTable>
        </QTabPanel>
      </QTabPanels>
    </div>
  </div>
</template>

<style lang="stylus">
.underline:hover {
  text-decoration: underline;
}
</style>