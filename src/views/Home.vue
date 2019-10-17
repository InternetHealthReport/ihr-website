<i18n src="@/locales/long_langs/home.json"></i18n>
<template>
  <div id="IHR_home">
    <router-link :to="{name: 'global_report'}" class="IHR_delikify">
      <div id="IHR_global-report" class="row">
        <div class="col-4">
          <div>Internet Health Report</div>
          <div>{{ $t("globalReport.name") }}</div>
          <div id="IHR_global-report-button">{{ $t("explore") }}</div>
        </div>
        <div class="col-8">
          <img src="@/assets/imgs/global-banner.png" />
        </div>
      </div>
    </router-link>
    <div
      class="IHR_description"
      v-html="$interpolateArray($t('globalReport.description'), {
        'ripe': '<a href=\'https://atlas.ripe.net/\' target=\'_blank\'>RIPE Atlas</a>',
        'bgpstream': '<a href=\'https://bgpstream.caida.org/\' target=\'_blank\'>BGPstream</a>'
        })"
    ></div>
    <div id="IHR_graphs-types" class="row wrap justify-around">
      <div
        class="col-xs-6 col-xl-4 text-center column"
        v-for="graphT in graphTypes"
        :key="graphT.name"
      >
        <h2 class="col-auto">{{$t(`${graphT.name}.title`)}}</h2>
        <div class="col-auto">
          <q-avatar color="primary" text-color="white" size="130px" :icon="graphT.icon"></q-avatar>
        </div>
        <div
          class="IHR_description col-auto"
          v-html="$interpolateArray($t(`${graphT.name}.description`), placeholderValues)"
        ></div>
        <div class="IHR_description IHR_description-link col-grow content-end">
          <router-link
            :to="{name :'documentation', query: graphT.docsQuery}"
          >{{$t(`${graphT.name}.title`)}} {{$t("documentation")}}</router-link>
        </div>
      </div>
    </div>
    <q-drawer :value="showSidebar" side="left" show-if-above bordered>
      <q-scroll-area class="fit">
        <Timeline id="ihr_alerts" sourceType="profile" :options="{ tweetLimit: '5' }" />
      </q-scroll-area>
    </q-drawer>
  </div>
</template>

<script>
import { Timeline } from "vue-tweet-embed";
const GRAPHS_TYPES = [
  {
    name: "asInterdependence",
    icon: "fas fa-project-diagram",
    docsQuery: {}
  },
  {
    name: "delayAndForwarding",
    icon: "fas fa-shipping-fast",
    docsQuery: {}
  },
  {
    name: "disco",
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

      &-button
        margin-top 40px
        border white solid 4px
        text-align center
        font-weight 500
        transition all 0.6s

        &:hover
          background-color white
          color black

      & > div
        height 100%

        &:first-child
          color white
          font-size 50px
          text-align left
          display inline-block

          & > *
            margin-left auto
            width 88%

        &:last-child
          text-align right
          overflow hidden

          & > img
            height 100%

    ~/graphs-types
      margin 60pt auto 40px auto
      width 88%

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
    text-align center
    #IHR_graphs-types &
      text-align justify

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
</style>