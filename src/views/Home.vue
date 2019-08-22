<template>
  <div id="IHR_home">
    <router-link :to="{name: 'global_report'}">
    <div id="IHR_global-report">
      <div>
        <img src="@/assets/imgs/global-banner.png">
      </div>
      <div>
        <div>
          <div>IHR</div>
          <div>Global Report</div>
        </div>
      </div>
    </div>
    </router-link>
    <div class="IHR_description">
        A brief explanation of what the global report is used for
    </div>
    <div id="IHR_graphs-types" class="row wrap">
      <div class="col-4 text-center">
        <q-avatar color="primary" text-color="white" size="130px" icon="img:https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
        </q-avatar>
        <div class="IHR_description">
          Disco brief description
        </div>
        <div class="IHR_description">
         <router-link :to="{name :'documentation'}">disco documentation</router-link>
         </div>
      </div>
      <div class="col-4 text-center">
        <q-avatar color="primary" text-color="white" size="130px" icon="img:https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
        </q-avatar>
        <div class="IHR_description">
          Disco brief description
        </div>
        <div class="IHR_description">
         <router-link :to="{name :'documentation'}">disco documentation</router-link>
         </div>
      </div>
      <div class="col-4 text-center">
        <q-avatar color="primary" text-color="white" size="130px" icon="img:https://cdn.quasar.dev/logo/svg/quasar-logo.svg">
        </q-avatar>
        <div class="IHR_description">
          Disco brief description
        </div>
        <div class="IHR_description">
         <router-link :to="{name :'documentation'}">disco documentation</router-link>
         </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {

}
</script>

<style lang="stylus" scoped>
#IHR_
  &home
    ~/global-report
      margin-top 3em
      margin-bottom 60pt
      width 100%
      height 550px
      background-repeat no-repeat
      background-size contain
      position relative
      overflow hidden
      text-align center
      & > div:first-child
        position relative
        height 100%
        left 50%
        width 10000px
        margin 0 0 0 -5000px
        & > img
          height 100%

      & > div:last-child
        color white
        font-size 50px
        position absolute
        text-align center
        display inline-block
        left 50%
        bottom 120px
        text-shadow: 0px 0px 11px rgba(0,0,0,0.9);
        & > div
          left -50%
          position relative

    ~/graphs-types
      margin 60pt auto 40px auto
      width 88%
      background-color pink
      & > div
        background-color white
        padding 1.6em
        border gray solid 1px

.IHR_
  &description
    font-size 18pt
    width 90%
    margin 30pt auto
    text-align center
</style>