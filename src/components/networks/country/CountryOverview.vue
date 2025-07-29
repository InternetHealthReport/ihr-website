<script setup>
import { QSpinner, QMarkupTable, QCard, QCardSection, QCheckbox } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted } from 'vue'
import '@/styles/chart.css'
import { LMap, LTileLayer, LControl, LMarker, LPopup } from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { icon } from 'leaflet'
import { Country }  from 'country-state-city'

const iyp_api = inject('iyp_api')

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad'
}

const props = defineProps({
  countryCode: {
    type: String,
    required: true
  }
})

const route = useRoute()

const references = ref(REFERENCES)
const loading = ref(3)
const loadingMap = ref(3)
const queries = ref([
  {
    data: [],
    query: `MATCH (c:Country {country_code: $cc})
      OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(a:AS) WITH c, COUNT(DISTINCT a) as as_count
      OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "peeringdb.ix"}]-(i:IXP) WITH c, as_count, COUNT(DISTINCT i) as ixp_count
      OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "nro.delegated_stats"}]-(pd:RIRPrefix) WITH c, as_count, ixp_count, COUNT(DISTINCT pd) as preg_count
      OPTIONAL MATCH (c)<-[:COUNTRY {reference_name: "ihr.rov"}]-(pg:BGPPrefix) WITH c, as_count, ixp_count, preg_count, COUNT(DISTINCT pg) as pgeo_count
      RETURN c.name AS country_name, as_count, ixp_count, preg_count, pgeo_count`
  },
  {
    data: [],
    query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[rr:RANK]-(:Ranking)-[:COUNTRY]-(c)
      WHERE rr.rank < 10
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, SUM(10-rr.rank) AS nb_rankings
      ORDER BY nb_rankings DESC LIMIT 5`
  },
  {
    data: [],
    query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[ca:CATEGORIZED]-(:Tag {label:'Tranco 10k Host'}),
      (a)-[:ORIGINATE]-(:BGPPrefix)-[po:PART_OF]-(:IP)-[re:RESOLVES_TO {reference_name:'openintel.tranco1m'}]-(d:HostName)
      USING INDEX re:RESOLVES_TO(reference_name)
      WHERE "BGPPrefix" IN po.prefix_types
      WITH a, COUNT(DISTINCT d) AS nb_domains ORDER BY nb_domains DESC LIMIT 5
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, nb_domains`
  },
  {
    data: [],
    query: `MATCH (p:Point)-[:LOCATED_IN]-(f:Facility)-[:COUNTRY]-(:Country {country_code: $cc})
      RETURN p.position.longitude AS longitude, p.position.latitude AS latitude, f.name AS name`,
    icon: icon({
      iconUrl: '/leaflet/marker-icon-blue.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
      popupAnchor: [1, -34]
    })
  },
  {
    data: [],
    query: `MATCH (p:Point)-[:LOCATED_IN]-(a:AtlasProbe)-[:COUNTRY]-(:Country {country_code: $cc})
      RETURN p.position.longitude AS longitude, p.position.latitude AS latitude, a.id AS id, a.description AS description`,
    icon: icon({
    iconUrl: '/leaflet/marker-icon-red.png',
    shadowUrl: '/leaflet/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    shadowSize: [41, 41],
    popupAnchor: [1, -34]
  })
  },
  {
    data: [],
    query: `MATCH (p:Point)-[:LOCATED_IN]-(o:Organization)-[:COUNTRY]-(:Country {country_code: $cc})
      RETURN p.position.longitude AS longitude, p.position.latitude AS latitude, o.name AS name`,
    icon: icon({
      iconUrl: '/leaflet/marker-icon-green.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      shadowSize: [41, 41],
      popupAnchor: [1, -34]
    })
  },
])
const zoom = ref(5)
const countryInfo = ref(Country.getCountryByCode(props.countryCode))
const facilitiesPoints = ref(false)
const atlasProbePoints = ref(false)
const organizationPoints = ref(false)

const fetchData = async (cc) => {
  let params = { cc: cc.toUpperCase() }
  iyp_api.run([{ statement: queries.value[0].query, parameters: params }]).then((results) => {
    queries.value[0].data = results[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[1].query, parameters: params }]).then((results) => {
    queries.value[1].data = results[0]
    loading.value -= 1
  })

  iyp_api.run([{ statement: queries.value[2].query, parameters: params }]).then((results) => {
    queries.value[2].data = results[0]
    loading.value -= 1
  })
}

const fetchMapData = async (cc) => {
  let params = { cc: cc.toUpperCase() }
  iyp_api.run([{ statement: queries.value[3].query, parameters: params }]).then((results) => {
    queries.value[3].data = results[0]
    loadingMap.value -= 1
    facilitiesPoints.value = true
  })

  iyp_api.run([{ statement: queries.value[4].query, parameters: params }]).then((results) => {
    queries.value[4].data = results[0]
    loadingMap.value -= 1
    atlasProbePoints.value = true
  })

  iyp_api.run([{ statement: queries.value[5].query, parameters: params }]).then((results) => {
    queries.value[5].data = results[0]
    loadingMap.value -= 1
    organizationPoints.value = true
  })
}

const handleReference = (key) => {
  let externalLink = ''
  let cc = props.countryCode

  if (key === 'bgp.he.net') {
    externalLink = `${references.value[key]}/${cc}`
  } else if (key === 'radar.cloudflare.com') {
    externalLink = `${references.value[key]}/${cc}`
  } else if (key === 'stat.ripe.net') {
    externalLink = `${references.value[key]}/${cc}`
  } else {
    console.log('none')
    return
  }
  return externalLink
}

watch(
  () => props.countryCode,
  () => {
    loading.value = 3
    queries.value.forEach((query) => {
      query.data = []
    })
    fetchData(props.countryCode)
    fetchMapData(props.countryCode)
  }
)

onMounted(() => {
  fetchData(props.countryCode)
  fetchMapData(props.countryCode)
})
</script>

<template>
  <div>
    <QMarkupTable separator="horizontal">
      <div v-if="loading > 0" class="IHR_loading-spinner">
        <QSpinner color="secondary" size="15em" />
      </div>
      <thead>
        <tr>
          <th class="text-left">Summary</th>
          <th class="text-left">Prominent ISPs</th>
          <th class="text-left">Prominent Hosting Providers</th>
          <th class="text-left">External Links</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-left">
            <div v-if="queries[0].data.length > 0">
              <div>
                {{ queries[0].data[0].as_count }} registered
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#Autonomous-Systems'
                    })
                  "
                >
                  ASes
                </RouterLink>
              </div>
              <div>
                {{ queries[0].data[0].preg_count }} registered
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#IP-Prefixes'
                    })
                  "
                >
                  prefixes
                </RouterLink>
              </div>
              <div>
                {{ queries[0].data[0].pgeo_count }} geolocated
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#IP-Prefixes'
                    })
                  "
                >
                  prefixes
                </RouterLink>
              </div>
              <div>
                {{ queries[0].data[0].ixp_count }}
                <RouterLink
                  :to="
                    Tr.i18nRoute({
                      replace: true,
                      query: Object.assign({}, route.query, { active: 'custom' }),
                      hash: '#Internet-Exchange-Points'
                    })
                  "
                >
                  Internet Exchange Points
                </RouterLink>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[1].data.length > 0">
              <div v-for="item in queries[1].data" :key="Number(item.asn)">
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${item.asn}` } })"
                >
                  AS{{ item.asn }} - {{ item.as_name }}
                </RouterLink>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[2].data.length > 0">
              <div v-for="item in queries[2].data" :key="Number(item.asn)">
                <RouterLink
                  :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${item.asn}` } })"
                >
                  AS{{ item.asn }} - {{ item.as_name }}
                </RouterLink>
              </div>
            </div>
          </td>
          <td class="text-left">
            <div v-if="queries[0].data.length > 0">
              <div v-for="(value, key) in references" :key="key">
                <a :href="handleReference(key)" target="_blank" rel="noreferrer">
                  {{ key }}
                </a>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </QMarkupTable>
    <br />
    <QMarkupTable separator="horizontal">
      <thead>
        <tr>
          <th class="text-left">Map</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="height: 600px;">
            <LMap v-model="zoom" v-model:zoom="zoom" :center="[countryInfo.latitude, countryInfo.longitude]" :use-global-leaflet="false">
              <LTileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" layer-type="base" name="OpenStreetMap"></LTileLayer>
              <LControl>
                <QCard>
                  <QCardSection>
                    <div>
                      <QCheckbox v-model="facilitiesPoints" label="Facilities" color="blue" keep-color />
                    </div>
                    <div>
                      <QCheckbox v-model="organizationPoints" label="Organizations" color="green" keep-color />
                    </div>
                    <div>
                      <QCheckbox v-model="atlasProbePoints" label="Atlas Probes" color="red" keep-color />
                    </div>
                  </QCardSection>
                </QCard>
              </LControl>
              <LMarker v-if="facilitiesPoints" v-for="(item, index) in queries[3].data" :key="index" :lat-lng="[item.latitude, item.longitude]" :icon="queries[3].icon">
                <LPopup>{{ item.name }}</LPopup>
              </LMarker>
              <LMarker v-if="atlasProbePoints" v-for="(item, index) in queries[4].data" :key="index" :lat-lng="[item.latitude, item.longitude]" :icon="queries[4].icon">
                <LPopup v-if="item.description">{{ item.id }} - {{ item.description }}</LPopup>
                <LPopup v-else>{{ item.id }}</LPopup>
              </LMarker>
              <LMarker v-if="organizationPoints" v-for="(item, index) in queries[5].data" :key="index" :lat-lng="[item.latitude, item.longitude]" :icon="queries[5].icon">
                <LPopup>{{ item.name }}</LPopup>
              </LMarker>
            </LMap>
          </td>
        </tr>
      </tbody>
    </QMarkupTable>
  </div>
</template>

<style>
p {
  font-size: 1rem;
  margin-bottom: 0;
}
h3 {
  font-size: 1rem;
  line-height: 1.5;
}
.overview-footer {
  text-decoration: underline;
  cursor: pointer;
  width: 100%;
  text-align: right;
}
</style>
