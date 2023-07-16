<template>
  <div>
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
        <q-table :data="data" :columns="columns">
          <template v-slot:body="props">
            <q-tr :props="props">
              <q-td
                v-for="column in columns"
                :props="props"
                :key="column.name"
                @click.native="column.name === 'ASN' ? routeToASN(column.field(props.row)) : null"
              >
                {{ column.format(column.field(props.row)) }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-tab-panel>
      <q-tab-panel name="api" class="IHR_api-table q-pa-lg" light>
        <p>{{ cypherQuery }}</p>
      </q-tab-panel>
    </q-tab-panels>
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
    cypherQuery: {
      type: String,
    },
  },
  data() {
    return {
      activeTab: 'data',
    }
  },
  methods: {
    routeToASN(asn) {
      console.log(asn.low)
      this.$router.push({
        name: 'iyp_asn',
        params: { asn: asn.low },
      })
    },
  },
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
</style>
