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
        <q-table :data="data" :columns="columns"></q-table>
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
}
</script>

<style lang="stylus">
@import '../../../styles/quasar.variables';
</style>
