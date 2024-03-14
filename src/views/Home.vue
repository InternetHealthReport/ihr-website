<script setup>
import { RouterLink } from 'vue-router'
import { QCard, QCardSection, QAvatar, QIcon } from 'quasar'
import { ref, onMounted, inject } from 'vue'
import ripeApi from '@/plugins/RipeApi'
import Tr from '@/i18n/translation'

const iyp_api = inject('iyp_api')

const as_info_query = ref({
  loading: true,
  query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p4:Prefix {af:4})
      WITH COALESCE(COUNT(DISTINCT p4.prefix), 0) AS prefixes_v4, a
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p6:Prefix {af:6})
      WITH COALESCE(COUNT(DISTINCT p6.prefix), 0) AS prefixes_v6, prefixes_v4, a
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:NAME]->(n:Name)
      OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:COUNTRY]-(ixp_country:Country)
      OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country `,
})

const GRAPHS_TYPES = [
  {
    name: 'homePage.analysisModules.asInterdependence',
    icon: 'fas fa-project-diagram',
    docsQuery: {},
  },
  {
    name: 'homePage.analysisModules.networkDelay',
    icon: 'fas fa-shipping-fast',
    docsQuery: {},
  },
  {
    name: 'homePage.analysisModules.delayAndForwarding',
    icon: 'fas fa-exchange-alt',
    docsQuery: {},
  },
  {
    name: 'homePage.analysisModules.disco',
    icon: 'fas fa-plug',
    docsQuery: {},
  },
]

const ORGANIZATIONS = [
  {
    name: 'iij',
    logo: new URL('@/assets/imgs/iij-logo.jpg', import.meta.url).href
  },
  {
    name: 'ripe',
    logo: new URL('@/assets/imgs/ripe-logo.png', import.meta.url).href
  },
  {
    name: 'gsoc',
    logo: new URL('@/assets/imgs/gsoc-logo.png', import.meta.url).href
  },
  {
    name: 'routeviews',
    logo: new URL('@/assets/imgs/rv-logo.png', import.meta.url).href
  },
  {
    name: 'isoc',
    logo: new URL('@/assets/imgs/isoc-logo.png', import.meta.url).href
  },
  {
    name: 'manrs',
    logo: new URL('@/assets/imgs/manrs-logo.jpg', import.meta.url).href
  },
  {
    name: 'edgecast',
    logo: new URL('@/assets/imgs/edgecast-logo.png', import.meta.url).href
  }
]

const PLACEHOLDER_VALUES = {
  asPaper: "<a href='https://www.iijlab.net/en/members/romain/pdf/romain_pam2018.pdf' target='_blank'>",
  close: '</a>',
  /*
  ripe: "<a href='https://atlas.ripe.net/' target='_blank'>RIPE Atlas</a>",
  bgpstream:
    "<a href='https://bgpstream.caida.org/' target='_blank'>BGPstream</a>",
  delayAndForwardingPaper:
    "<a href='https://conferences.sigcomm.org/imc/2017/papers/imc17-final106.pdf' target='_blank'>",
  discoPaper:
    "<a href='https://tma.ifip.org/wordpress/wp-content/uploads/2017/06/tma2017_paper41.pdf' target='_blank'>"
  */
}

const props = defineProps({
    showSidebar: {
        type: Boolean,
        default: false
    }
})

const getUserInfo = async() => {
  const userIP = await ripeApi.userIP()
  const userASN = await ripeApi.userASN(userIP.data.ip)
  userInfo.value.IP = userIP.data.ip
  userInfo.value.AS = userASN.data.asns[0]
  userInfo.value.PREFIX = userASN.data.prefix

  as_info_query.value.loading = true
  let query_params = { asn: Number(userASN.data.asns[0]) }
  iyp_api.run([{statement: as_info_query.value.query, parameters: query_params}]).then(
    results => {
      userInfo.value.AS_NAME = results[0][0].name
      userInfo.value.COUNTRY = results[0][0].country
      userInfo.value.CC = results[0][0].cc
      as_info_query.value.loading = false
    }
  )

}

const graphTypes = ref(GRAPHS_TYPES)
const placeholderValues = ref(PLACEHOLDER_VALUES)
const organizations = ref(ORGANIZATIONS)
const userInfo = ref({})

onMounted(() => {
    getUserInfo()
})

</script>

<template>
  <div id="IHR_home">

    <div id="IHR_global-report" class="row">
      
      <div class="col">
        <div>Internet Health Report</div>
        <RouterLink id="IHR_global-report-button" :to="Tr.i18nRoute({ name: 'global-report' })">
          {{ $t('homePage.globalReport.name') }}
        </RouterLink>
      </div>

      <div class="row justify-end IHR_description-main userInfoCard">
        <QCard class="user-modules">
          <QCardSection class="bg-primary text-white q-pa-sm">
            <div>
              <QAvatar :icon="graphTypes[graphTypes.length - 1].icon"></QAvatar>
              Your Connection Information
            </div>
          </QCardSection>
          <QCardSection class="q-pa-xs" >
            <div class="IHR_description" v-if="!as_info_query.loading" >
            
              <p class="userInfo" >
              IP :  {{userInfo.IP}}
              </p>

              <p class="userInfo" >
              AS : 
              <RouterLink :to="`networks/AS${userInfo.AS}`">
              AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
              </RouterLink>
              </p>

              <p class="userInfo" >
              PREFIX : 
              <RouterLink :to="`networks/${userInfo.PREFIX}`">
              {{userInfo.PREFIX}}
              </RouterLink>
              </p>

              <p class="userInfo" >
              COUNTRY : 
              <RouterLink :to="`countries/${userInfo.CC}`">
              {{userInfo.COUNTRY}}
              </RouterLink>
              </p>

            </div>
            <div v-else id="loading-wrapper">
              <div class="blink-image">
                <div class="loading">
                  <div class="imageLoading">
                    <h1>L<span> </span>ading...</h1>
                  </div>
                </div>
              </div>
            </div>

          </QCardSection>
        </QCard>
      </div>

    </div>

    <div class="row wrap justify-center q-gutter-md IHR_description-main">

      <QCard class="user-modules userInfoCardMobile">
        <QCardSection class="bg-primary text-white q-pa-sm">
          <div>
            <QAvatar :icon="graphTypes[graphTypes.length - 1].icon"></QAvatar>
            Your Connection Information
          </div>
        </QCardSection>
        <QCardSection class="q-pa-xs">
          <div class="IHR_description" v-if="!as_info_query.loading" >
          
            <p class="userInfo" >
            IP :  {{userInfo.IP}}
            </p>

            <p class="userInfo" >
            AS : 
            <RouterLink :to="`networks/AS${userInfo.AS}`">
            AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
            </RouterLink>
            </p>

            <p class="userInfo" >
            PREFIX : 
            <RouterLink :to="`networks/${userInfo.PREFIX}`">
            {{userInfo.PREFIX}}
            </RouterLink>
            </p>

            <p class="userInfo" >
            COUNTRY : 
            <RouterLink :to="`countries/${userInfo.CC}`">
            {{userInfo.COUNTRY}}
            </RouterLink>
            </p>

          </div>
          <div v-else id="loading-wrapper">
            <div class="blink-image">
              <div class="loading">
                <div class="imageLoading">
                  <h1>L<span> </span>ading...</h1>
                </div>
              </div>
            </div>
          </div>
          <div class="IHR_description IHR_description-link">
          </div>
        </QCardSection>
      </QCard>

    </div>

    <div class="IHR_description-main" v-html="$t('homePage.globalReport.description')"></div>
    <div class="IHR_description-main">
      See latest alarms in the
      <RouterLink :to="Tr.i18nRoute({ name: 'global-report' })">global report</RouterLink>
      and network metrics in
      <RouterLink :to="Tr.i18nRoute({ name: 'networks' })">network reports</RouterLink>.
    </div>

    <div class="row wrap justify-center q-gutter-md IHR_description-main">
      <QCard class="analysis-modules" v-for="graphT in graphTypes" :key="graphT.name">
        <QCardSection class="bg-primary text-white q-pa-sm">
          <div>
            <QAvatar :icon="graphT.icon"></QAvatar>
            {{ $t(`${graphT.name}.title`) }}
          </div>
        </QCardSection>
        <QCardSection class="q-pa-xs">
          <div class="IHR_description" v-html="$t(`${graphT.name}.description`)"></div>
          <div class="IHR_description IHR_description-link">
            <RouterLink
              :to="Tr.i18nRoute({
                name: 'documentation',
                hash: $t(`${graphT.name}.docHash`),
              })"
              >{{ $t('homePage.learnmore') }} {{ $t(`${graphT.name}.title`) }}</RouterLink>
          </div>
        </QCardSection>
      </QCard>
    </div>

    <!-- <div class="IHR_section">
      <QCard class="IHR_tweets-types">
        <QCardSection class="bg-white text-primary q-pa-sm">
          <div class="text-h2">
            <QAvatar icon="fab fa-twitter"></QAvatar>
            {{ $t('homePage.ihrTweets.title') }}
          </div>
        </QCardSection>
        <QCardSection class="q-pa-xs">

        </QCardSection>
      </QCard>
    </div> -->

    <div class="IHR_section">
      <h2 class="text-h2">
        <QIcon name="fa fa-heart"></QIcon>
        {{ $t('homePage.ack.title') }}
      </h2>

      <div class="row wrap justify-center">
        <div v-for="(org, index) in organizations" :key="index">
          <a :href="$t(`homePage.ack.organizations.${org.name}.url`)" target="_blank">
          <div class="IHR_ack-logo">
            <span></span>
            <img :src="org.logo" :alt="$t(`homePage.ack.organizations.${org.name}.name`)" />
          </div>
          </a>
        </div>
      </div>
    </div>
    <!--<q-drawer :value="hideSidebar" side="left" show-if-above bordered>-->
    <!--<q-scroll-area class="fit">-->
    <!--</q-scroll-area>-->
    <!--</q-drawer>-->
  </div>
</template>

<style lang="stylus">
#IHR_
  &home
    ~/global-report
      margin-bottom 60pt
      max-width 100%
      height 450px
      background-color black
      background-image url('@/assets/imgs/global-banner.png')
      background-repeat no-repeat
      background-position right top
      background-size contain
      @media screen and (max-width: 1024px) {
        background-position center center
        background-size cover
      }

      &-button
        margin-top 40px
        border white solid 4px
        text-align center
        font-weight 500
        transition all 0.6s
        max-width 300pt
        display block
        color white
        font-size 2rem
        text-decoration none
        @media screen and (max-width: 600px)
          font-size 1.5rem
          margin-left auto
          margin-right auto
          max-width 200pt

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
          display flex
          flex-direction column
          text-shadow 0 0 8px #000000;
          @media screen and (max-width: 600px)
            padding-top 100pt
            padding-left 0
            text-align center
            font-size 2rem

    ~/graphs-types
      width 100%

      & > div
        background-color white
        padding 1.6em
        border gray solid 1px

        > h2
          font-weight 400
          margin-bottom 4pt
          font-size 28pt
          @media screen and (max-width: 600px)
            font-size 22pt
          &:first-letter
            text-transform uppercase


.IHR_
  &description_text
    height 220px
.IHR_
  &description,
  &description_text
    font-size 18pt
    width 90%
    margin 30pt auto
    text-align left
    padding: 0 1rem;
    @media screen and (max-width: 600px)
        font-size 12pt
    #IHR_graphs-types &
      text-align justify

    &-main
      font-size 20pt
      margin 30pt auto !important
      text-align center
      width 50%
      @media screen and (max-width: 600px)
        font-size 14pt

    &-link
      position relative
      text-align right

  &section
    margin 60pt auto 40px auto
    width 85%
    font-size 18pt
    text-align center
    & > h2
      font-size 32pt
      @media screen and (max-width: 600px)
        font-size 22pt

  ~/ack-logo
      margin-left auto
      margin-right auto
      text-align center
      height 200px
      width 400px

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

      & > img:hover {
        transform: scale(1.1);
      }  
        

.analysis-modules
    max-width 600px
    text-align left
    border-radius 15px !important

.user-modules
  min-width 500px
  min-height 300px
  text-align left
  border-radius 15px !important
  max-height 500px
  margin auto

.userInfo
  font-size 19px
  font-weight 550

.userInfoCard 
  margin-top 0px !important

#loading-wrapper
  margin-top 110px !important

@media(max-width 1411px)
  .analysis-modules
    margin-left 0

@media(max-width 1450px)
  .IHR_tweets-types
        max-width 600px !important

@media(max-width 1023px)
  .userInfoCard
    display none !important

  .user-modules
    min-width 0px

@media(min-width 1024px)
  .userInfoCardMobile
    display none !important

.IHR_tweets-types
      margin-left auto
      margin-right auto
      max-width 800px
      text-align center
      border-radius 15px

      & > div
        background-color white

        > h2
          font-weight 400
          margin-bottom 4pt
          &:first-letter
            text-transform uppercase
</style>