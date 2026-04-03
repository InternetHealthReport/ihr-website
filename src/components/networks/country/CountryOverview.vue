<script setup>
import { QSpinner, QMarkupTable, QCard, QCardSection, QCheckbox } from 'quasar'
import { RouterLink, useRoute } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, watch, onMounted, nextTick } from 'vue'
import '@/styles/chart.css'
import {
  LMap,
  LTileLayer,
  LControl,
  LMarker,
  LPopup,
  LPolyline,
  LCircleMarker
} from '@vue-leaflet/vue-leaflet'
import 'leaflet/dist/leaflet.css'
import { icon } from 'leaflet'
import { Country } from 'country-state-city'

const iyp_api = inject('iyp_api')
const submarine_cable_map_api = inject('submarine_cable_map_api')

const REFERENCES = {
  'bgp.he.net': 'https://bgp.he.net/country',
  'radar.cloudflare.com': 'https://radar.cloudflare.com',
  'stat.ripe.net': 'https://stat.ripe.net/app/launchpad'
}

let LANDING_POINT_COUNTRY_ISO = null

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
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS as_name, SUM(10-rr.rank) AS nb_rankings
      ORDER BY nb_rankings DESC LIMIT 5`
  },
  {
    data: [],
    query: `MATCH (c:Country {country_code: $cc})-[:COUNTRY {reference_name:'nro.delegated_stats'}]-(a:AS)-[ca:CATEGORIZED]-(:Tag {label:'Tranco 10k Host'}),
      (a)-[:ORIGINATE]-(:BGPPrefix)-[:PART_OF]-(:IP)-[re:RESOLVES_TO {reference_name:'openintel.tranco1m'}]-(d:HostName)
      USING INDEX re:RESOLVES_TO(reference_name)
      WITH a, COUNT(DISTINCT d) AS nb_domains ORDER BY nb_domains DESC LIMIT 5
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'bgp.tools'}]->(btn:Name)
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
    query: `MATCH (p:Point)-[:LOCATED_IN]-(a:AtlasProbe {status_name: 'Connected'})-[:COUNTRY]-(:Country {country_code: $cc})
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
  }
])

const getSubmarineCables = (cc, cableGeoData, landingPointGeoData) => {
  const domesticLPs = []
  const nonDomesticLPs = []
  for (const f of landingPointGeoData.features) {
    const name = f.properties.name
    const idx = name.indexOf(',')
    if (idx === -1) continue
    if (LANDING_POINT_COUNTRY_ISO[name.substring(idx + 6)] === cc) {
      domesticLPs.push(f.geometry.coordinates)
    } else if (LANDING_POINT_COUNTRY_ISO[name.substring(idx + 2)] === cc) {
      domesticLPs.push(f.geometry.coordinates)
    } else {
      nonDomesticLPs.push(f.geometry.coordinates)
    }
  }

  if (!domesticLPs.length) {
    return { domestic: [], international: [], domesticLPs: [], internationalLPs: [] }
  }

  const isNear = ([ax, ay], [bx, by], tol) => Math.abs(ax - bx) < tol && Math.abs(ay - by) < tol
  const findMatched = (points, lpList, tol) =>
    lpList.filter((lp) => points.some((pt) => isNear(pt, lp, tol)))

  const domestic = []
  const international = []
  const domesticLPsSeen = new Set()
  const usedDomesticLPs = []
  const internationalLPsSeen = new Set()
  const internationalLPs = []

  const addUnique = (lp, seen, arr) => {
    const key = lp.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      arr.push(lp)
    }
  }

  const mergedFeatures = []
  const cableById = new Map()
  for (const feature of cableGeoData.features) {
    const id = feature.properties.id
    if (cableById.has(id)) {
      cableById.get(id).geometry.coordinates.push(...feature.geometry.coordinates)
    } else {
      const merged = {
        ...feature,
        geometry: { ...feature.geometry, coordinates: [...feature.geometry.coordinates] }
      }
      cableById.set(id, merged)
      mergedFeatures.push(merged)
    }
  }
  cableGeoData = { ...cableGeoData, features: mergedFeatures }

  for (const cable of cableGeoData.features) {
    const allPoints = cable.geometry.coordinates.flat()
    const hasDomestic = allPoints.some((pt) => domesticLPs.some((lp) => isNear(pt, lp, 0.1)))
    if (!hasDomestic) continue
    const hasNonDomestic = allPoints.some((pt) => nonDomesticLPs.some((lp) => isNear(pt, lp, 0.1)))
    if (hasNonDomestic) {
      const endpoints = cable.geometry.coordinates.flatMap((line) => [
        line[0],
        line[line.length - 1]
      ])
      international.push(cable)
      for (const lp of findMatched(allPoints, domesticLPs, 0.1)) {
        addUnique(lp, internationalLPsSeen, internationalLPs)
      }

      for (const lp of nonDomesticLPs.filter(
        (lp) =>
          endpoints.some((ep) => isNear(ep, lp, 0.1)) ||
          allPoints.some((pt) => isNear(pt, lp, 0.04))
      )) {
        addUnique(lp, internationalLPsSeen, internationalLPs)
      }
    } else {
      domestic.push(cable)
      for (const lp of findMatched(allPoints, domesticLPs, 0.1)) {
        addUnique(lp, domesticLPsSeen, usedDomesticLPs)
      }
    }
  }

  return { domestic, international, domesticLPs: usedDomesticLPs, internationalLPs }
}

const zoom = ref(5)
const countryInfo = ref(Country.getCountryByCode(props.countryCode))
const cableRenderCoords = (coordinates) => {
  const allLngs = coordinates
    .flat()
    .map(([lng]) => lng)
    .sort((a, b) => a - b)
  const refLng = allLngs[Math.floor(allLngs.length / 2)]
  const normalized = coordinates.map((line) =>
    line.map(([lng, lat]) => {
      while (lng - refLng > 180) lng -= 360
      while (refLng - lng > 180) lng += 360
      return [lat, lng]
    })
  )
  return [-360, 0, 360].flatMap((offset) =>
    normalized.map((line) => line.map(([lat, lng]) => [lat, lng + offset]))
  )
}

const submarineCables = ref(null)
const facilitiesPoints = ref(false)
const atlasProbePoints = ref(false)
const organizationPoints = ref(false)
const domesticSubmarineCables = ref(true)
const internationalSubmarineCables = ref(true)

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

const fetchSubmarineCableMapData = async () => {
  const cableGeoData = (await submarine_cable_map_api.cableGeo()).data
  const landingPointGeoData = (await submarine_cable_map_api.landingPointGeo()).data
  LANDING_POINT_COUNTRY_ISO = (await submarine_cable_map_api.landingPointCountryMap()).data

  submarineCables.value = getSubmarineCables(props.countryCode, cableGeoData, landingPointGeoData)
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
    fetchSubmarineCableMapData()
  }
)

onMounted(() => {
  fetchData(props.countryCode)
  fetchMapData(props.countryCode)
  fetchSubmarineCableMapData()
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
          <td style="height: 600px">
            <LMap
              v-model:zoom="zoom"
              :center="[countryInfo.latitude, countryInfo.longitude]"
              :use-global-leaflet="false"
              :options="{ attributionControl: false, worldCopyJump: true, minZoom: 3 }"
              @ready="(map) => nextTick(() => map.invalidateSize())"
            >
              <LTileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
                class="grayscale-tiles"
              ></LTileLayer>
              <LControl>
                <QCard>
                  <QCardSection>
                    <div>
                      <QCheckbox
                        v-model="facilitiesPoints"
                        label="Facilities"
                        color="blue"
                        keep-color
                      />
                    </div>
                    <div>
                      <QCheckbox
                        v-model="organizationPoints"
                        label="Organizations"
                        color="green"
                        keep-color
                      />
                    </div>
                    <div>
                      <QCheckbox
                        v-model="atlasProbePoints"
                        label="Atlas Probes"
                        color="red"
                        keep-color
                      />
                    </div>
                    <div v-if="submarineCables?.domestic.length">
                      <QCheckbox
                        v-model="domesticSubmarineCables"
                        label="Domestic Submarine Cables"
                      />
                    </div>
                    <div v-if="submarineCables?.international.length">
                      <QCheckbox
                        v-model="internationalSubmarineCables"
                        label="International Submarine Cables"
                      />
                    </div>
                  </QCardSection>
                </QCard>
              </LControl>
              <template
                v-if="domesticSubmarineCables && submarineCables?.domesticLPs.length"
                v-for="([lng, lat], index) in submarineCables.domesticLPs"
                :key="`dlp-${index}`"
              >
                <LCircleMarker
                  v-for="offset in [-360, 0, 360]"
                  :key="`dlp-${index}-${offset}`"
                  :lat-lng="[lat, lng + offset]"
                  :radius="5"
                  color="#333"
                  :fill="true"
                  fill-color="#fff"
                  :fill-opacity="1"
                />
              </template>
              <template
                v-if="internationalSubmarineCables && submarineCables?.internationalLPs.length"
                v-for="([lng, lat], index) in submarineCables.internationalLPs"
                :key="`ilp-${index}`"
              >
                <LCircleMarker
                  v-for="offset in [-360, 0, 360]"
                  :key="`ilp-${index}-${offset}`"
                  :lat-lng="[lat, lng + offset]"
                  :radius="5"
                  color="#333"
                  :fill="true"
                  fill-color="#fff"
                  :fill-opacity="1"
                />
              </template>
              <template
                v-if="domesticSubmarineCables && submarineCables?.domestic.length"
                v-for="(cable, cIndex) in submarineCables.domestic"
                :key="`d-${cIndex}`"
              >
                <LPolyline
                  v-for="(latLngs, lIndex) in cableRenderCoords(cable.geometry.coordinates)"
                  :key="`d-${cIndex}-${lIndex}`"
                  :lat-lngs="latLngs"
                  :color="cable.properties.color"
                >
                  <LPopup
                    ><a
                      target="_blank"
                      :href="`https://www.submarinecablemap.com/submarine-cable/${cable.properties.id}`"
                      >{{ cable.properties.name }}</a
                    ></LPopup
                  >
                </LPolyline>
              </template>
              <template
                v-if="internationalSubmarineCables && submarineCables?.international.length"
                v-for="(cable, cIndex) in submarineCables.international"
                :key="`i-${cIndex}`"
              >
                <LPolyline
                  v-for="(latLngs, lIndex) in cableRenderCoords(cable.geometry.coordinates)"
                  :key="`i-${cIndex}-${lIndex}`"
                  :lat-lngs="latLngs"
                  :color="cable.properties.color"
                >
                  <LPopup
                    ><a
                      target="_blank"
                      :href="`https://www.submarinecablemap.com/submarine-cable/${cable.properties.id}`"
                      >{{ cable.properties.name }}</a
                    ></LPopup
                  >
                </LPolyline>
              </template>
              <LMarker
                v-if="facilitiesPoints"
                v-for="(item, index) in queries[3].data"
                :key="index"
                :lat-lng="[item.latitude, item.longitude]"
                :icon="queries[3].icon"
              >
                <LPopup>{{ item.name }}</LPopup>
              </LMarker>
              <LMarker
                v-if="atlasProbePoints"
                v-for="(item, index) in queries[4].data"
                :key="index"
                :lat-lng="[item.latitude, item.longitude]"
                :icon="queries[4].icon"
              >
                <LPopup v-if="item.description">{{ item.id }} - {{ item.description }}</LPopup>
                <LPopup v-else>{{ item.id }}</LPopup>
              </LMarker>
              <LMarker
                v-if="organizationPoints"
                v-for="(item, index) in queries[5].data"
                :key="index"
                :lat-lng="[item.latitude, item.longitude]"
                :icon="queries[5].icon"
              >
                <LPopup>{{ item.name }}</LPopup>
              </LMarker>
            </LMap>
          </td>
        </tr>
      </tbody>
    </QMarkupTable>
  </div>
</template>

<style scoped>
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
:deep(.leaflet-tile-pane) {
  filter: grayscale(100%) brightness(1.1);
}
.landing-point {
  z-index: 1000;
}
</style>
