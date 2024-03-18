<script setup>
import { RouterLink } from 'vue-router'
import { QCard, QCardSection, QAvatar} from 'quasar'
import { ref, onMounted, inject } from 'vue'
import ripeApi from '@/plugins/RipeApi'

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

const userInfo = ref({})

onMounted(() => {
    getUserInfo()
})

</script>

<template>

    <div class="userInfoCard">

        <div class="line"></div>

        <QCard class="userInfoCard_modules">
            
            <QCardSection class="q-pa-xs userInfoCard_title">
                YOUR CONNECTION
            </QCardSection>

            <QCardSection class="q-pa-xs" >

                <div class="userInfoCard_userInfo" v-if="!as_info_query.loading" >
                
                    <p>
                    IP :  {{userInfo.IP}}
                    </p>

                    <p class="xyz">
                    AS : 
                    <RouterLink class="link" :to="`networks/AS${userInfo.AS}`">
                    AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
                    </RouterLink>
                    </p>

                    <p>
                    PREFIX : 
                    <RouterLink class="link" :to="`networks/${userInfo.PREFIX}`">
                    {{userInfo.PREFIX}}
                    </RouterLink>
                    </p>

                    <p>
                    COUNTRY : 
                    <RouterLink class="link" :to="`countries/${userInfo.CC}`">
                    {{userInfo.COUNTRY}}
                    </RouterLink>
                    </p>

                </div>

                <div v-else id="loading-wrapper">
                    <div class="blink-image">
                        <div class="loading">
                            <div class="imageLoading">
                                <h1>L<span class="image"> </span>ading...</h1>
                            </div>
                        </div>
                    </div>
                </div>

            </QCardSection>
            
        </QCard>

    </div>
  
</template>

<style lang="stylus">

.userInfoCard_
  background: rgba(0,0,0,0);
  border white solid 4px

  &modules
    margin-top 13px
    min-width 300pt
    max-width 300pt
    min-height 220px
    background: rgba(0,0,0,0) !important
    border white solid 4px
    border-radius 0px !important

  &userInfo
    margin-top 8px
    margin-left 85px
    transition all 0.6s
    font-weight 600

  &title
    text-align center
    font-size 23px 
    font-weight 750
    border-bottom white solid 3px

#loading-wrapper
  margin-top 60px !important
  margin-left 95px !important

.imageLoading
  min-width 350px !important

  h1 
    color white !important
    font-size 35px !important
 
.image
    width: 22px !important
    height: 22px !important

.line
  margin-top 13px
  min-height 3px
  max-width 300pt
  background: white

.link
    color white !important
    text-decoration none!important

@media(max-width 600px)
  .userInfoCard
    display none !important


</style>