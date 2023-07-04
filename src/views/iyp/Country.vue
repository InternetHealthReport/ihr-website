<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1>{{ this.cc }}</h1>
    <div>
      <q-list>
        <q-expansion-item
          :label="$t('iyp.overview.country.title')"
          caption="Overview of a country"
          header-class="IHR_charts-title"
          v-model="show.overview"
        >
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card-section>
              <Overview :country-code="cc" />
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <q-expansion-item :label="$t('iyp.country.ases.title')" caption="Autonomous Systems (ASes)" header-class="IHR_charts-title">
          <q-separator />
          <q-card class="IHR_charts-body">
            <q-card v-if="tableVisible" class="q-ma-xl">
              <q-tabs
                class="table-card text-grey bg-grey-2"
                v-model="activeTab"
                indicator-color="secondary"
                active-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab name="data" label="DATA"></q-tab>
                <q-tab name="api" label="API"></q-tab>
              </q-tabs>
              <q-tab-panels v-model="activeTab" animated>
                <q-tab-panel name="data">
                  <q-table :data="ases" :columns="asesColumns"></q-table>
                </q-tab-panel>
                <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
                  <p>Query</p>
                </q-tab-panel>
              </q-tab-panels>
            </q-card>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/CountryOverview'
export default {
  components: {
    Overview,
  },
  data() {
    return {
      cc: null,
      asesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}` },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}` },
        { name: 'Name', label: 'Name', align: 'left', field: row => row.name, format: val => `${val}` },
      ],
      // ases stands for autonomous systems
      ases: [],
      activeTab: 'data',
      tableVisible: true,
      show: {
        overview: true,
      },
    }
  },
  created() {
    this.cc = this.$route.params.cc
  },
  async mounted() {
    const queries = [this.getASes()]
    let res = await this.$iyp_api.runMany(queries)
    console.log(res)
    this.ases = res.ases
  },
  methods: {
    // ases stands for autonomous systems
    getASes() {
      const query =
        'MATCH (c:Country {country_code: $cc})-[r]-(a:AS)-[:NAME]-(n:Name) WITH c.country_code AS cc, a.asn AS asn, collect(DISTINCT(n.name)) AS name RETURN cc, asn, name LIMIT 100'
      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
      }
      return { cypherQuery: query, params: { cc: this.cc }, mapping, data: 'ases' }
    },
  },
}
</script>

<style lang="stylus">
@import '../../styles/quasar.variables';
</style>
