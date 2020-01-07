<i18n src="@/locales/long_langs/home.json"></i18n>
<template>
  <div id="IHR_home">
    <router-link :to="{name: 'global_report'}" class="IHR_delikify">
      <div id="IHR_global-report" class="row">
        <div class="col-6">
          <div>Internet Health Report</div>
          <div id="IHR_global-report-button">{{ $t("globalReport.name") }}</div>
        </div>
        <div class="col-6">
        </div>
      </div>
    </router-link>
    <div
      class="IHR_description-main"
      v-html="$interpolateArray($t('globalReport.description'), {
        'ripe': '<a href=\'https://atlas.ripe.net/\' target=\'_blank\'>RIPE Atlas</a>',
        'bgpstream': '<a href=\'https://bgpstream.caida.org/\' target=\'_blank\'>BGPstream</a>'
        })"
    ></div>


        <div class="row wrap justify-center q-gutter-md">
        <q-card
            class="analysis-modules"
            v-for="graphT in graphTypes"
            :key="graphT.name"
        >
        <q-card-section class="bg-primary text-white q-pa-sm">
                  <div class='text-h2'>
                      <q-avatar :icon="graphT.icon" ></q-avatar>
                      {{$t(`${graphT.name}.title`)}}
                  </div>
          </q-card-section>
        <q-card-section>
            <div
            class="IHR_description col-auto"
            v-html="$interpolateArray($t(`${graphT.name}.description`), placeholderValues)"
            ></div>
            <div class="IHR_description IHR_description-link col-grow content-end">
            <router-link
                :to="{name :'documentation', query: graphT.docsQuery}"
            >{{$t(`${graphT.name}.title`)}} {{$t("documentation")}}</router-link>
            </div>
        </q-card-section>
        </q-card>
        </div>

    <div class="IHR_section">
        <h2> {{$t("ihrTweets.title")}}</h2>
        <div id="IHR_tweets-types">
          <Timeline id="ihr_alerts" sourceType="profile" :options="{ chrome: 'noheader' , tweetLimit: '3' }">
            <div class="spinner"></div>
          </Timeline>
        </div>
    </div>

    <div class="IHR_section">
        <h2>
            <q-icon name="fa fa-heart"></q-icon>
            {{$t("ack.title")}}</h2>

        <div class="row wrap justify-around">
            <div
                class="col-xs-3 col-xl-3 column"
                v-for="org in $t('ack.organizations')"
                :key="org.name"
            >
            <div class="IHR_ack-logo" >
                <span></span>
                <img :src="require(`@/assets/imgs/${org.logo}`)"  :alt="org.name" >
            </div>
            </div>
        </div>
    </div>
    <!--<q-drawer :value="hideSidebar" side="left" show-if-above bordered>-->
      <!--<q-scroll-area class="fit">-->
      <!--</q-scroll-area>-->
    <!--</q-drawer>-->
  </div>
</template>

<script>
import { Timeline } from "vue-tweet-embed";
const GRAPHS_TYPES = [
  {
    name: "analysisModules.asInterdependence",
    icon: "fas fa-project-diagram",
    docsQuery: {}
  },
  {
    name: "analysisModules.networkDelay",
    icon: "fas fa-shipping-fast",
    docsQuery: {}
  },
  {
    name: "analysisModules.delayAndForwarding",
    icon: "fas fa-exchange-alt",
    docsQuery: {}
  },
  {
    name: "analysisModules.disco",
    icon: "fas fa-plug",
    docsQuery: {}
  }
];

const PLACEHOLDER_VALUES = {
  asPaper:
    "<a href='https://www.iij-ii.co.jp/en/members/romain/pdf/romain_pam2018.pdf' target='_blank'>",
  close: "</a>"
  /*
  ripe: "<a href='https://atlas.ripe.net/' target='_blank'>RIPE Atlas</a>",
  bgpstream:
    "<a href='https://bgpstream.caida.org/' target='_blank'>BGPstream</a>",
  delayAndForwardingPaper:
    "<a href='https://conferences.sigcomm.org/imc/2017/papers/imc17-final106.pdf' target='_blank'>",
  discoPaper:
    "<a href='https://tma.ifip.org/wordpress/wp-content/uploads/2017/06/tma2017_paper41.pdf' target='_blank'>"
  */
};

export default {
  components: {
    Timeline
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      graphTypes: GRAPHS_TYPES,
      placeholderValues: PLACEHOLDER_VALUES
    };
  }
};
</script>

<style lang="stylus" scoped>
#IHR_
  &home
    ~/global-report
      margin-bottom 60pt
      width 100%
      height 450px
      background-color black
      background-image url('~@/assets/imgs/global-banner.png')
      background-repeat no-repeat
      background-position right top
      background-size contain

      &-button
        margin-top 40px
        border white solid 4px
        text-align center
        font-weight 500
        transition all 0.6s
        width 300pt

        &:hover
          background-color white
          color black
          text-shadow 0 0 3px #FFFFFF

      & > div
        height 100%

        &:first-child
          color white
          font-size 50px
          text-align left
          padding-top 60pt
          padding-left 60pt
          display inline-block
          text-shadow 0 0 8px #000000;


    ~/graphs-types
      width 100%

      & > div
        background-color white
        padding 1.6em
        border gray solid 1px

        > h2
          font-weight 400
          margin-bottom 4pt
          &:first-letter
            text-transform uppercase


    ~/tweets-types
      margin-left auto
      margin-right auto
      width 70% 
      text-align center

      & > div
        background-color white
        padding 1.6em
        border gray solid 1px

        > h2
          font-weight 400
          margin-bottom 4pt
          &:first-letter
            text-transform uppercase


.IHR_
  &description
    font-size 18pt
    width 90%
    margin 30pt auto
    text-align left
    #IHR_graphs-types &
      text-align justify

    &-main
      font-size 20pt
      margin 30pt auto
      text-align center
      width 80%

    &-link
      position relative
      > a
        position absolute
        bottom 0px
        left 0px
        width 100%
        text-align center
        &:first-letter
          text-transform uppercase

  &section
    margin 60pt auto 40px auto
    width 85%
    font-size 18pt
    text-align center


  ~/ack-logo
      margin-left auto
      margin-right auto
      text-align center
      height 250px
      width 300px

      & > span
        display inline-block
        vertical-align middle
        height 100%

      & > img
        vertical-align middle
        max-height 100px
        max-width 300px
        width auto
        height auto

.analysis-modules
    width 90%
    max-width 750px
    text-align left


</style>
