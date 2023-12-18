<template>
  <div class="IYP_chart">
    <div v-if="this.loadingStatus" class="IYP_loading-spinner">
      <q-spinner color="secondary" size="3em" />
    </div>
    <q-card>
      <q-tabs
        class="table-card text-grey bg-grey-2"
        v-model="activeTab"
        indicator-color="secondary"
        active-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="chart" label="CHART" :disable="slotLength <= 0 ? true : false"></q-tab>
        <q-tab name="data" label="DATA"></q-tab>
        <q-tab name="api" label="CYPHER QUERY"></q-tab>
      </q-tabs>
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="chart">
          <div id="chartContainer">
              <slot></slot>
          </div>
        </q-tab-panel>
        <q-tab-panel name="data">
          <q-table :data="data" :columns="columns" :filter="filter" :pagination="pagination">
            <template v-slot:header-cell="props">
              <q-th :props="props">
                  <q-tooltip v-if='props.col.description' anchor="bottom start" self="bottom start">{{ props.col.description }}</q-tooltip>
                  {{ props.col.label }}
              </q-th>
            </template>
            <template v-slot:top-right>
              <q-input debounce="300" v-model="filter" placeholder="Search">
                <template v-slot:append>
                  <q-icon name="search" />
                <q-tooltip class="bg-accent">Search in the table</q-tooltip>
                </template>
              </q-input>
              <q-btn
                flat rounded
                icon-right="archive"
                @click="exportTable"
                >
                <q-tooltip class="bg-accent">Download CSV file</q-tooltip>
              </q-btn>
            </template>
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td
                  :class="toUnderline(column.name)"
                  v-for="column in columns"
                  :props="props"
                  :key="column.name"
                  @click.native="routeToEntity(column.name, props.row)"
                >
                  {{ column.format(column.field(props.row)) }}
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-tab-panel>
        <q-tab-panel name="api" class="text-left q-pa-lg" light>
          <code>{{ cypherQuery }}</code>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </div>
</template>

<script>

import { exportFile } from 'quasar'

const colToUnderline = ['ASN', 'AS', 'Origin AS', 'Country', 'IXP', 'Prefix','Reg. Country', 'Geoloc. Country', 'Country', 'CC']

function wrapCsvValue (val, formatFn, row) {
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

export default {
  props: {
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
    },
  },
  data() {
    return {
      activeTab: 'chart',
      filter: '',
      colToUnderline,
      underline: false,
    }
  },
  mounted() {
    if (this.slotLength <= 0) {
      this.activeTab = 'data'
    }
  },
  // computed: {
  //   toUnderline(name) {
  //     if (colToUnderline.includes(name)) {
  //       return {
  //         underline: true,
  //         'cursor-pointer': true,
  //       }
  //     }
  //   },
  // },
  methods: {
    exportTable () {
      // naive encoding to csv format
      const content = [this.columns.map(col => wrapCsvValue(col.label))].concat(
        this.data.map(row => this.columns.map(col => wrapCsvValue(
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
    },
    toUnderline(name) {
      if (colToUnderline.includes(name)) {
        return {
          underline: true,
          'cursor-pointer': true,
        }
      }
    },
    routeToEntity(entity, data) {
      if (entity == 'ASN' | entity == 'AS' | entity == 'Origin AS') {
        let asn= Array.isArray(data.get('asn'))?data.get('asn')[0]:data.get('asn')
        this.routeToASN(asn)
      } else if (entity == 'Prefix') {
        let prefix= Array.isArray(data.get('prefix'))?data.get('prefix')[0]:data.get('prefix')
        const [host, prefixLength] = prefix.split('/')
        this.routeToPrefix(host, prefixLength)
      } else if (entity == 'IXP') {
        let ixpid= Array.isArray(data.get('id'))?data.get('id')[0]:data.get('id')
        this.routeToIXP(ixpid)
      } else if (entity == 'CC' | entity == 'Country' |  entity == 'Reg. Country' | entity == 'Geoloc. Country') {
        let cc= Array.isArray(data.get('cc'))?data.get('cc')[0]:data.get('cc')
        this.routeToCountry(cc)
      }
    },
    routeToASN(asn) {
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: asn },
      })
    },
    routeToPrefix(host, prefixLength) {
      this.$router.push({
        name: 'iyp_prefix',
        params: { host: host, prefix_length: prefixLength },
      })
    },
    routeToIXP(id) {
      this.$router.push({
        name: 'iyp_ixp',
        params: { id: id },
      })
    },
    routeToCountry(cc) {
      console.log(cc)
      this.$router.push({
        name: 'iyp_country',
        params: { cc: cc },
      })
    },
  },
  watch: {
    activeTab: {
      handler() {
        if (this.activeTab == 'chart') {
          console.log(`Current Tab: ${this.activeTab}`)
        }
      },
    },
    slotLength: {
      handler() {
        if (this.slotLength <= 0) {
          this.activeTab = 'data'
        }
      },
    },
  },
}
</script>

<style lang="stylus">
@import "~@/styles/quasar.variables.styl";
@import "~@/styles/charts/common.styl";

.underline:hover {
  text-decoration: underline;
}
</style>
