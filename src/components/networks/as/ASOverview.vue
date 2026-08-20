<script setup>
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import '@/styles/chart.css'
import NetworkTopologyChart from '@/components/charts/NetworkTopologyChart.vue'

const iyp_api = inject('iyp_api')

const props = defineProps({
  asNumber: {
    type: Number,
    required: true
  },
  asName: {
    type: String,
    required: false
  },
  peeringdbId: {
    type: Function,
    required: false
  },
  external: {
    type: Boolean,
    required: false,
    default: false
  }
})

const route = useRoute()

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net',
  'bgp.tools': 'https://bgp.tools/as',
  'peeringdb.com': 'https://www.peeringdb.com/net',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad'
}

const queries = ref([
  {
    data: [],
    query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p4:BGPPrefix {af:4})
      WITH COALESCE(COUNT(DISTINCT p4.prefix), 0) AS prefixes_v4, a
      OPTIONAL MATCH (a)-[:ORIGINATE]->(p6:BGPPrefix {af:6})
      WITH COALESCE(COUNT(DISTINCT p6.prefix), 0) AS prefixes_v6, prefixes_v4, a
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[:NAME]->(n:Name)
      OPTIONAL MATCH (a)-[:WEBSITE]->(u:URL)
      OPTIONAL MATCH (a)-[:MEMBER_OF]->(ixp:IXP)-[:EXTERNAL_ID]-(:PeeringdbIXID)
      OPTIONAL MATCH (ixp)-[:COUNTRY]-(ixp_country:Country)
      OPTIONAL MATCH (a)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN u.url AS website, c.country_code AS cc, c.name AS country, prefixes_v4, prefixes_v6, COALESCE(pdbn.name, btn.name, ripen.name) AS name, count(DISTINCT ixp) as nb_ixp, count(DISTINCT ixp_country) as nb_country `
  },
  {
    data: [],
    query: `MATCH (a:AS {asn: $asn})
      OPTIONAL MATCH (a)-[:PEERS_WITH]-(b:AS)
      OPTIONAL MATCH (a)-[r:RANK]->(s:Ranking)
      WHERE r.rank < 10
      RETURN COUNT(DISTINCT b.asn) AS peers, r.rank AS rank, s.name AS ranking_name ORDER BY rank LIMIT 1`
  },
  {
    data: [],
    query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(:BGPPrefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(h:HostName)-[:PART_OF]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
      WHERE rr.reference_name = "tranco.top1m" AND h.name = d.name
      RETURN DISTINCT h.name AS hostname, rr.rank AS rank
      ORDER BY rank LIMIT 5`
  }
])
const loading = ref(3)
const hasIpv4Topology = ref(true)
const hasIpv6Topology = ref(true)

const fetchData = async (asn) => {
  let params = { asn: asn }
  iyp_api.run([{ statement: queries.value[0].query, parameters: params }]).then((res) => {
    queries.value[0].data = res[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[1].query, parameters: params }]).then((res) => {
    queries.value[1].data = res[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[2].query, parameters: params }]).then((res) => {
    queries.value[2].data = res[0]
    loading.value -= 1
  })
}

const detectIpv4Topology = (length, af) => {
  if (length) {
    hasIpv4Topology.value = true
  } else {
    hasIpv4Topology.value = false
  }
}

const detectIpv6Topology = (length, af) => {
  if (length) {
    hasIpv6Topology.value = true
  } else {
    hasIpv6Topology.value = false
  }
}

watch(
  () => props.asNumber,
  () => {
    loading.value = 3
    queries.value.forEach((query) => {
      query.data = []
    })
    fetchData(props.asNumber)
  }
)

onMounted(() => {
  fetchData(props.asNumber)
})
</script>

<template>
  <div class="row q-col-gutter-xl q-mb-xl">
    <div class="col">
      <q-card>
        <q-card-section>
          <div class="text-h6">Summary</div>
          <!-- <div class="text-subtitle2"></div> -->
        </q-card-section>
        <q-separator inset />
        <q-card-section>
          <div>
            <q-skeleton type="text" v-if="!queries[0].data.length" />
            <div v-else>
              Registered in
              <RouterLink
                :to="Tr.i18nRoute({ name: 'country', params: { cc: queries[0].data[0].cc } })"
              >
                {{ queries[0].data[0].country }}
              </RouterLink>
            </div>

            <q-skeleton type="text" v-if="!queries[0].data.length" />
            <div v-else>
              Member of {{ queries[0].data[0].nb_ixp }}
              <RouterLink
                :to="
                  Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, { active: 'custom' }),
                    hash: '#IXPs'
                  })
                "
              >
                IXPs
              </RouterLink>
              in {{ queries[0].data[0].nb_country }} Countries
            </div>

            <q-skeleton type="text" v-if="!queries[0].data.length" />
            <div v-else>
              {{ queries[0].data[0].prefixes_v4 }} IPv4 and
              {{ queries[0].data[0].prefixes_v6 }} IPv6
              <RouterLink
                :to="
                  Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, { active: 'custom' }),
                    hash: '#Originated-Prefixes'
                  })
                "
              >
                Originated Prefixes
              </RouterLink>
            </div>

            <q-skeleton type="text" v-if="!queries[1].data.length" />
            <div v-else>
              {{ queries[1].data[0].peers }}
              <RouterLink
                :to="
                  Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, { active: 'custom' }),
                    hash: '#Connected-ASes'
                  })
                "
              >
                Connected ASes
              </RouterLink>
            </div>

            <q-skeleton type="text" v-if="!queries[0].data.length" />
            <div v-else>
              Website:
              <a :href="queries[0].data[0].website" target="_blank" rel="noopener noreferrer">{{
                queries[0].data[0].website
              }}</a>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col">
      <q-card>
        <q-card-section>
          <div class="text-h6">Top Rank</div>
          <!-- <div class="text-subtitle2"></div> -->
        </q-card-section>

        <q-separator inset />

        <q-card-section>
          <div>
            <q-skeleton type="text" v-if="!queries[1].data.length" />
            <div v-else>
              #{{ queries[1].data[0].rank }} in {{ queries[1].data[0].ranking_name }}
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <div class="col">
      <q-card>
        <q-card-section>
          <div class="text-h6">Popular Hostnames</div>
          <!-- <div class="text-subtitle2"></div> -->
        </q-card-section>

        <q-separator inset />

        <q-card-section>
          <div>
            <q-skeleton type="text" v-if="!queries[2].data.length" />
            <div v-if="queries[2].data.length > 0">
              <div v-for="item in queries[2].data" :key="item.hostname">
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'hostname', params: { hostname: item.hostname } })"
                >
                  {{ item.hostname }}
                </RouterLink>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </div>

  <div class="row q-col-gutter-xl">
    <div class="col">
      <q-card>
        <q-card-section>
          <div class="text-h6">IPv4 "Upstream" Topology</div>
          <!-- <div class="text-subtitle2"></div> -->
        </q-card-section>

        <q-separator inset />

        <q-card-section class="topology">
          <NetworkTopologyChart
            :search-input-p="String(asNumber)"
            af="IPv4"
            :is-component="true"
            :show-legend="hasIpv4Topology"
            @has-topology="detectIpv4Topology"
          />
        </q-card-section>
      </q-card>
    </div>

    <div class="col">
      <q-card>
        <q-card-section>
          <div class="text-h6">IPv6 "Upstream" Topology</div>
          <!-- <div class="text-subtitle2"></div> -->
        </q-card-section>

        <q-separator inset />

        <q-card-section class="topology">
          <NetworkTopologyChart
            :search-input-p="String(asNumber)"
            af="IPv6"
            :is-component="true"
            :show-legend="hasIpv6Topology"
            @has-topology="detectIpv6Topology"
          />
        </q-card-section>
      </q-card>
    </div>
  </div>
</template>

<style>
.topology {
  padding: 0 0 0 0 !important;
}
</style>
