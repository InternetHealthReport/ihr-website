<template>
    <div>
      <h1 class="text-center">Metis</h1>
      <h2 class="text-center">Atlas probe selection and deployment recommendations</h2>

      <div class="row justify-center">
        <div class="col-4 IHR_description q-pa-lg">
          <p>
            Some explanations
          </p>
          <p>
            <ul>
                <li><router-link to="metis/selection/">Atlas probe selection</router-link></li>
                <li><router-link to="metis/deployment/">Atlas probe deployment recommendations</router-link></li>
            </ul>  
          </p>
        </div>
      </div>
    </div>
</template>

<script>

export default {
  name: 'MetisHome',
  methods: {
    pushRoute() {},
  },
}
</script>

<style lang="stylus">
@import '../styles/quasar.variables';

.IHR_description
    font-weight 400

.IHR_anchor
    display block
    position relative
    top -250px
    visibility hidden

.boxsizingBorder {
    width 100%
    height 100%
    margin 5px 0
    padding 3px
}
</style>
