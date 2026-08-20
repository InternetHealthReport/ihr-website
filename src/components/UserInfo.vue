<script setup>
import { RouterLink } from 'vue-router'
import { ref, onMounted, inject } from 'vue'
import Tr from '@/i18n/translation'

const iyp_api = inject('iyp_api')
const ripe_api = inject('ripe_api')

const as_info_query = ref({
  loading: true,
  query: `MATCH (p:BGPPrefix {af: $af})-[:ORIGINATE]-(a:AS)
      WHERE iyp.ipMatch($ip, p.prefix)
      ORDER BY p.prefixlen DESC
      LIMIT 1
      WITH DISTINCT p.prefix AS prefix, a
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN a.asn AS as, c.country_code AS cc, c.name AS country, prefix, COALESCE(pdbn.name, btn.name, ripen.name) AS name`
})

const getUserInfo = async () => {
  const userIP = (await ripe_api.userIP()).data
  userInfo.value.IP = userIP.data.ip

  as_info_query.value.loading = true
  let af = 4
  if (userInfo.value.IP.includes(':')) {
    af = 6
  }
  let query_params = { af: af, ip: userInfo.value.IP }
  iyp_api
    .run([{ statement: as_info_query.value.query, parameters: query_params }])
    .then((results) => {
      userInfo.value.AS = results[0][0].as
      userInfo.value.PREFIX = results[0][0].prefix
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
  <q-card class="user-info-card" flat>
    <q-card-section class="user-info-header">
      <q-icon name="fas fa-wifi" size="1rem" class="q-mr-sm" />
      <span class="user-info-header__text">{{ $t('homePage.yourConnection.title') }}</span>
    </q-card-section>
    <q-card-section v-if="!as_info_query.loading" class="user-info-body q-pt-sm">
      <div class="user-info-row">
        <span class="user-info-label">{{ $t('homePage.yourConnection.ip') }}</span>
        <span class="user-info-value">{{ userInfo.IP }}</span>
      </div>
      <div class="user-info-row">
        <span class="user-info-label">{{ $t('homePage.yourConnection.as') }}</span>
        <RouterLink
          :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${userInfo.AS}` } })"
          class="user-info-link"
        >
          AS{{ userInfo.AS }} — {{ userInfo.AS_NAME }}
        </RouterLink>
      </div>
      <div class="user-info-row">
        <span class="user-info-label">{{ $t('homePage.yourConnection.prefix') }}</span>
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
      </div>
      <div class="user-info-row">
        <span class="user-info-label">{{ $t('homePage.yourConnection.country') }}</span>
        <RouterLink
          :to="Tr.i18nRoute({ name: 'country', params: { cc: userInfo.CC } })"
          class="user-info-link"
        >
          {{ userInfo.COUNTRY }}
        </RouterLink>
      </div>
    </q-card-section>
    <q-card-section v-else class="text-center q-py-lg">
      <q-spinner color="white" size="1.5em" />
    </q-card-section>
  </q-card>
</template>

<style>
.user-info-card {
  background: rgba(255, 255, 255, 0.06) !important;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  overflow: hidden;
}
.user-info-header {
  display: flex;
  align-items: center;
  padding-bottom: 0.5rem !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.user-info-header__text {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
}
.user-info-body {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.user-info-row {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
}
.user-info-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  min-width: 55px;
  flex-shrink: 0;
}
.user-info-value {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  word-break: break-all;
}
.user-info-link {
  font-size: 0.9rem;
  font-weight: 500;
  color: #93c5fd !important;
  text-decoration: none;
  word-break: break-all;
  transition: color 0.15s;
}
.user-info-link:hover {
  color: #bfdbfe !important;
  text-decoration: underline;
}
</style>
