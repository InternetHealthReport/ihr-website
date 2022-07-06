<template>
  <div>
    <h1>Exploratory Dashboard</h1>
    <exploratory-dashboard />
  </div>
</template>

<script>
import ExploratoryDashboard from '../components/exploreDatasets/dashboard.vue'
export default {
  data() {
    return {
      networks: [],
      errorMsg: '',
    }
  },
  components: {
    ExploratoryDashboard,
  },
}
</script>

<style></style>
