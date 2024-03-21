<script setup>
import { RouterLink } from 'vue-router'
import {QMarkupTable, QSpinner, QCard, QCardSection} from 'quasar'
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

    <QCard class="userInfoCard">

        <QCardSection class="q-pa-xs userInfoCard_title">
            YOUR CONNECTION
        </QCardSection>

          <QCard class="userInfoCard_secondCard" v-if="!as_info_query.loading" >

            <QMarkupTable class="userInfoCard_modules" >

              <tbody class="userInfoCard_userInfo">

                  <tr>
                    <td class="userInfoCard_tableText">IP</td>
                    <td class="userInfoCard_tableText">{{userInfo.IP}}</td>
                  </tr>

                  <tr>
                    <td class="userInfoCard_tableText">AS</td>
                    <td class="userInfoCard_tableText">
                      <RouterLink class="link" :to="`networks/AS${userInfo.AS}`">
                      AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
                      </RouterLink>
                    </td>
                  </tr>

                  <tr>
                    <td class="userInfoCard_tableText">PREFIX</td>
                    <td class="userInfoCard_tableText"><RouterLink class="link" :to="`networks/${userInfo.PREFIX}`">
                      {{userInfo.PREFIX}}
                      </RouterLink>
                    </td>
                  </tr>

                  <tr>
                    <td class="userInfoCard_tableText">COUNTRY</td>
                    <td class="userInfoCard_tableText"><RouterLink class="link" :to="`countries/${userInfo.CC}`">
                      {{userInfo.COUNTRY}}
                      </RouterLink>
                    </td>
                  </tr>
                
              </tbody>
          
            </QMarkupTable>
        
          </QCard>

          <div v-else class="loading-spinner">
            <QSpinner color="secondary" size="1em" />
          </div>

    </QCard>

</template>

<style lang="stylus">

.userInfoCard 
  margin-top 15px
  min-width 300pt
  max-width 300pt
  min-height 220px
  max-height 220px
  border white solid 4px
  background: rgba(0,0,0,0) !important

.userInfoCard_
  &modules
  &secondCard
    background: rgba(0,0,0,0) !important

  &userInfo
    transition all 0.6s
    font-weight 600

  &title
    text-align center
    font-size 23px 
    font-weight 750
    border-bottom white solid 3px

  &tableText
    color white 
    height 40px !important
    font-size 14px !important

.link
    color white !important
    

.loading-spinner
  margin-top 30px
  text-align center

@media(max-width 600px)
  .userInfoCard
      margin auto
      margin-top 8px
      min-width 200pt
      max-width 200pt
      min-height 200px
      max-height 200px

  .userInfoCard_
    &title
      font-size 17px 

    &tableText
      font-size 12px !important

@media(max-width 320px)
  .userInfoCard
      min-height 170px
      max-height 170px

  .userInfoCard_
    &title
      font-size 14px 

    &tableText
      font-size 10px !important
      height: 30px !important

</style>