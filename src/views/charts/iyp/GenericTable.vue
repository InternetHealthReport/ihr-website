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
          <div class="row justify-start items-center" id="chartContainer">
            <slot></slot>
          </div>
        </q-tab-panel>
        <q-tab-panel name="data">
          <q-table :data="data" :columns="columns">
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td
                  class="cursor-pointer"
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
  },
  data() {
    return {
      activeTab: 'chart',
    }
  },
  mounted() {
    console.log(this.loadingStatus)
    if (this.slotLength <= 0) {
      this.activeTab = 'data'
    }
  },
  methods: {
    routeToEntity(entity, data) {
      if (entity == 'ASN') {
        this.routeToASN(data.asn)
      } else if (entity == 'Prefix') {
        const [host, prefixLength] = data.prefix.split('/')
        this.routeToPrefix(host, prefixLength)
      } else if (entity == 'IXP') {
        this.routeToIXP(data.id)
      } else if (entity == 'CC') {
        this.routeToCountry(data.cc)
      }
    },
    routeToASN(asn) {
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: asn.low },
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
</style>
