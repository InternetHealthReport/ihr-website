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


const props = defineProps({
    icons: Array
})

const userInfo = ref({})


onMounted(() => {
    getUserInfo()
})

</script>

<template>

    <div class="userInfoCard">

        <QCard class="userInfoCard_modules">
            <QCardSection class="bg-primary text-white q-pa-sm">
            <div class="userInfoCard_title">
                <QAvatar size="md" :icon="props.icons[props.icons.length - 1].icon"></QAvatar>
                Your Connection
            </div>
            </QCardSection>
            <QCardSection class="q-pa-xs" >
            <div class="userInfoCard_userInfo" v-if="!as_info_query.loading" >
            
                <p>
                IP :  {{userInfo.IP}}
                </p>

                <p>
                AS : 
                <RouterLink :to="`networks/AS${userInfo.AS}`">
                AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
                </RouterLink>
                </p>

                <p>
                PREFIX : 
                <RouterLink :to="`networks/${userInfo.PREFIX}`">
                {{userInfo.PREFIX}}
                </RouterLink>
                </p>

                <p>
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
  
</template>

<style lang="stylus">

.userInfoCard_

  &modules
    margin-top 30px
    min-width 360px
    max-width 360px
    min-height 220px
    border-radius 15px !important
    text-shadow: none !important

  &userInfo
    font-weight 550
    margin-top 7px
    margin-left 15px
    color black !important

  &title
    margin-left 4px
    font-size 22px

#loading-wrapper
  margin-top 80px !important
  margin-left 40px !important

.imageLoading
  min-width 350px !important

@media(max-width 600px)
  .userInfoCard
    display none !important


</style>