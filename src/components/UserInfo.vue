<script setup>
import { RouterLink } from 'vue-router'
import {QMarkupTable, QSpinner} from 'quasar'
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

        <div class="q-pa-xs userInfoCard_title">
            YOUR CONNECTION
        </div>

          <div v-if="!as_info_query.loading" >

            <QMarkupTable class="userInfoCard_modules" >

              <tbody class="userInfoCard_userInfo">

                  <tr>
                    <td >IP</td>
                    <td>{{userInfo.IP}}</td>
                  </tr>

                  <tr>
                    <td>AS</td>
                    <td>
                      <RouterLink class="link" :to="`networks/AS${userInfo.AS}`">
                      AS{{userInfo.AS}} - {{userInfo.AS_NAME}}
                      </RouterLink>
                    </td>
                  </tr>

                  <tr>
                    <td>PREFIX</td>
                    <td><RouterLink class="link" :to="`networks/${userInfo.PREFIX}`">
                      {{userInfo.PREFIX}}
                      </RouterLink>
                    </td>
                  </tr>

                  <tr>
                    <td>COUNTRY</td>
                    <td><RouterLink class="link" :to="`countries/${userInfo.CC}`">
                      {{userInfo.COUNTRY}}
                      </RouterLink>
                    </td>
                  </tr>
                
              </tbody>
          
            </QMarkupTable>
        
          </div>

          <div v-else class="loading-spinner">
            <QSpinner color="secondary" size="1em" />
          </div>

    </div>

</template>

<style lang="stylus">

.userInfoCard 
  margin-top 15px
  min-width 300pt
  max-width 300pt
  min-height 220px
  max-height 220px
  border white solid 4px

.userInfoCard_
  &modules
    background: rgba(0,0,0,0) !important
    margin-left 40px

  &userInfo
    transition all 0.6s
    font-weight 600

  &title
    text-align center
    font-size 23px 
    font-weight 750
    border-bottom white solid 3px

.link
    color white !important
    text-decoration none!important
    
.q-table tbody td
  height 40px !important
  color white !important
  font-size 14px !important

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
    &modules
      margin-left 0px

    &title
      font-size 19px 

  .q-table tbody td
    font-size 10px !important
    height 35px !important

@media(max-width 315px)
  .q-table tbody td
      font-size px !important
      height 15px !important

  .userInfoCard
      min-height 170px
      max-height 170px

</style>