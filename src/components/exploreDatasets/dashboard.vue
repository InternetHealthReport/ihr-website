<template>
  <div>
    <h1>M-Lab Integration</h1>
    <div class="container">
      <form class="navbar-form m-2">
        <div class="input-group no border">
          <input type="text" value="" class="form-control" placeholder="Search" v-model="year" />
          <button @click="update(year)">
            <i class="material-icons ml-3">search</i>
          </button>
        </div>
      </form>
      <div class="row">
        <div class="col-md-3">1</div>
        <div class="col-md-3">2</div>
        <div class="col-md-3">3</div>
        <div class="col-md-3">4</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Exploratory-Dashboard',
  data() {
    return {
      year: '',
      data: '',
    }
  },
  methods: {
    update(year) {
      console.log(year)
      this.getData(year)
    },
    getData(year) {
      axios
        .get(`https://statistics.measurementlab.net/v0/NA/US/US-MD/2020/histogram_daily_stats.json`)
        .then(res => {
          this.data = res.data
        })
        .catch(e => console.log(e))
      console.log(this.data)
    },
  },
}
</script>
