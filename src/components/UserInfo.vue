<script setup>
import { RouterLink } from 'vue-router'
import { QMarkupTable, QSpinner } from 'quasar'
import { ref, onMounted, inject } from 'vue'
import Tr from '@/i18n/translation'

const iyp_api = inject('iyp_api')
const ripe_api = inject('ripe_api')

const as_info_query = ref({
  loading: true,
  query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p4:BGPPrefix {af:4})
      WITH COALESCE(COUNT(DISTINCT p4.prefix), 0) AS prefixes_v4, a
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p6:BGPPrefix {af:6})
      WITH COALESCE(COUNT(DISTINCT p6.prefix), 0) AS prefixes_v6, prefixes_v4, a
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:NAME]->(n:Name)
      OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:COUNTRY]-(ixp_country:Country)
      OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country `
})

const getUserInfo = async () => {
  const userIP = (await ripe_api.userIP()).data
  const userASN = (await ripe_api.userASN(userIP.data.ip)).data
  userInfo.value.IP = userIP.data.ip
  userInfo.value.AS = userASN.data.asns[0]
  userInfo.value.PREFIX = userASN.data.prefix

  as_info_query.value.loading = true
  let query_params = { asn: Number(userASN.data.asns[0]) }
  iyp_api
    .run([{ statement: as_info_query.value.query, parameters: query_params }])
    .then((results) => {
      userInfo.value.AS_NAME = results[0][0].name
      userInfo.value.COUNTRY = results[0][0].country
      userInfo.value.CC = results[0][0].cc
      as_info_query.value.loading = false
    })
}

const userInfo = ref({})

onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <QMarkupTable
    class="user-info-card"
    dense
    bordered
  >
    <thead>
      <tr>
        <th
          :colspan="2"
          align="center"
          style="border-bottom: 1px solid white; font-size: large"
        >
          YOUR CONNECTION
        </th>
      </tr>
    </thead>
    <tbody v-if="!as_info_query.loading">
      <tr>
        <td
          align="right"
          class="user-info-text"
        >
          IP:
        </td>
        <td
          align="left"
          class="user-info-text"
        >
          {{ userInfo.IP }}
        </td>
      </tr>
      <tr>
        <td
          align="right"
          class="user-info-text"
        >
          AS:
        </td>
        <td
          align="left"
          class="user-info-text"
        >
          <RouterLink
            :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${userInfo.AS}` } })"
            class="user-info-link"
          >
            AS{{ userInfo.AS }} - {{ userInfo.AS_NAME }}
          </RouterLink>
        </td>
      </tr>
      <tr>
        <td
          align="right"
          class="user-info-text"
        >
          PREFIX:
        </td>
        <td
          align="left"
          class="user-info-text"
        >
          <RouterLink
            :to="
              Tr.i18nRoute({
                name: 'prefix',
                params: { ip: userInfo.PREFIX.split('/')[0], length: userInfo.PREFIX.split('/')[1] }
              })
            "
            class="user-info-link"
          >
            {{ userInfo.PREFIX }}
          </RouterLink>
        </td>
      </tr>
      <tr>
        <td
          align="right"
          class="user-info-text"
        >
          COUNTRY:
        </td>
        <td
          align="left"
          class="user-info-text"
        >
          <RouterLink
            :to="Tr.i18nRoute({ name: 'country', params: { cc: userInfo.CC } })"
            class="user-info-link"
          >
            {{ userInfo.COUNTRY }}
          </RouterLink>
        </td>
      </tr>
    </tbody>
    <div
      v-else
      class="loading-spinner"
    >
      <QSpinner
        color="secondary"
        size="1em"
      />
    </div>
  </QMarkupTable>
</template>

<style>
.user-info-card {
  width: inherit;
  background-color: rgba(0, 0, 0, 0) !important;
  border-color: #fff !important;
  color: #fff !important;
}
.user-info-text {
  font-size: 14px !important;
  font-weight: 500 !important;
}
.user-info-link {
  color: #fff !important;
}
.loading-spinner {
  margin-bottom: 10px;
  text-align: center;
}
</style>
