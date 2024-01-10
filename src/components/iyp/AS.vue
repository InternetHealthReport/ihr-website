<script setup>
import { QList, QExpansionItem, QSeparator, QCard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import ASOverview from './ASOverview.vue'
import IypGenericTable from '../tables/IypGenericTable.vue'
import IypGenericPieChart from '../charts/IypGenericPieChart.vue'
import IypGenericBarChart from '../charts/IypGenericBarChart.vue'
import IypGenericIndicatorsChart from '../charts/IypGenericIndicatorsChart.vue'
import IypGenericTreemapChart from '../charts/IypGenericTreemapChart.vue'
import { isoCountries } from '@/plugins/countryName'

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const asn = ref(Number(route.params.id.replace('AS','')))
const peeringdbId = ref(null)
const pageTitle = ref('ASN - AS Name')
const sections = ref({
  // Connected ASes
  peers: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})-[:PEERS_WITH]-(peer:AS)
      OPTIONAL MATCH (peer)-[:NAME]->(n:Name)
      OPTIONAL MATCH (peer)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN c.country_code AS cc, peer.asn AS asn, head(collect(DISTINCT(n.name))) AS name`,
    columns: [
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    ]
  },
  // Originated prefixes
  prefixes: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:AS {asn: $asn})-[o:ORIGINATE]->(p:Prefix)
      OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
      OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
      OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
      RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix as prefix, collect(DISTINCT(t.label)) AS tags, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility`,
    columns: [
      { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
      { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true },
      { name: 'Geoloc. Country', label: 'Geoloc. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad' },
      { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true },
      { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
      { name: 'Visibility', label: 'Visibility', align: 'left', field: row => Number(row.get('visibility')), format: val => `${val.toFixed(2)}%`, sortable: true },
    ]
  },
  // IXPs
  ixps: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})-[:MEMBER_OF]->(i:IXP)-[:EXTERNAL_ID]->(p:PeeringdbIXID)
      OPTIONAL MATCH (i)-[:COUNTRY]->(c:Country)
      RETURN c.country_code as cc, i.name as name, p.id as id`,
    columns: [
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'IXP', label: 'IXP Name', align: 'left', field: row => row.get('name'), format: val => `${val}` },
      { name: 'PeeringDB ID', label: 'PeeringDB ID', align: 'left', field: row => row.get('id'), format: val => `${val}` },
    ]
  },
  roas: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(p:Prefix)
      OPTIONAL MATCH (b:AS)-[:ORIGINATE]->(p)
      RETURN p.prefix AS prefix, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri, COLLECT(DISTINCT b.asn) AS bgp`,
    columns: [
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
      { name: 'Max. Prefix Length', label: 'Max. Prefix Length', align: 'left', field: row => row.get('maxLength'), format: val => `${val}`, sortable: true },
      { name: 'NotBefore', label: 'NotBefore', align: 'left', field: row => row.get('notBefore'), format: val => `${val}`, sortable: true },
      { name: 'NotAfter', label: 'NotAfter', align: 'left', field: row => row.get('notAfter'), format: val => `${val}`, sortable: true },
      { name: 'URL', label: 'URL', align: 'left', field: row => row.get('uri'), format: val => `${val}`, sortable: true },
      { name: 'Origin in BGP', label: 'Origin in BGP', align: 'left', field: row => row.get('bgp'), format: val => val.length?`AS${val}`:'-', sortable: true },
    ]
  },
  rankings: {
    data: [],
    show: false,
    loading: true,
    query: 'MATCH (:AS {asn: $asn})-[r:RANK]->(s:Ranking) RETURN r.rank AS rank, s.name AS name ORDER BY rank',
    columns: [
      { name: 'Rank', label: 'Rank', align: 'left', field: row => row.get('rank'), format: val => `${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    ]
  },
  domains: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:AS {asn: $asn})-[:ORIGINATE]->(p:Prefix)<-[:PART_OF]-(:IP)<-[:RESOLVES_TO]-(d:DomainName)-[rr:RANK]->(rn:Ranking)
      WHERE rr.rank < 100000 and rn.name = 'Tranco top 1M'
      RETURN DISTINCT d.name AS domainName, rr.rank AS rank, rn.name AS rankingName, split(d.name, '.')[-1] AS tld, 1/toFloat(rr.rank) AS inv_rank, COLLECT(DISTINCT p.prefix) AS prefix
      ORDER BY rank`,
    columns: [
      { name: 'Rank', label: 'Rank', align: 'left', field: row => row.get('rank'), format: val => `${val}`, sortable: true },
      { name: 'Domain Name', label: 'Domain Name', align: 'left', field: row => row.get('domainName'), format: val => `${val}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val.join(', ')}`, sortable: true },
      { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.get('rankingName'), format: val => `${val}`, sortable: true, },
    ]
  },
  cofacilities: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (n:AS {asn: $asn})-[:LOCATED_IN]->(f:Facility)<-[:LOCATED_IN]-(p:AS)
      MATCH (n)-[:PEERS_WITH]-(p)
      RETURN p.asn as asn, collect(DISTINCT f.name) as name`,
    columns: [
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
      { name: 'Facilities', label: 'Facilities', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    ]
  },
  siblings: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})-[:SIBLING_OF]-(sibling:AS)
      OPTIONAL MATCH (sibling)-[:COUNTRY {reference_org:'NRO'}]->(c)
      OPTIONAL MATCH (sibling)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (sibling)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (sibling)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN DISTINCT sibling.asn AS asn, c.country_code AS cc, COALESCE(pdbn.name, btn.name, ripen.name) AS name`,
    columns: [
      { name: 'Country', label: 'Reg. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
    ]
  },
  downstreams: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})<-[d:DEPENDS_ON]-(b:AS)
      WHERE a.asn <> b.asn
      OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      OPTIONAL MATCH (b)-[:CATEGORIZED]->(t:Tag)
      RETURN DISTINCT b.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS cc, 100*d.hege AS hegemony_score, collect(DISTINCT t.label) AS tags, 'IPv'+d.af AS af`,
    columns: [
      { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
      { name: 'Hegemony Score', label: 'Hegemony Score', align: 'left', field: row => row.get('hegemony_score'), format: val => `${Number(val).toFixed(2)}%`, sortable: true, },
      { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true },
    ]
  },
  upstreams: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (a:AS {asn: $asn})-[d:DEPENDS_ON]->(b:AS)
      WHERE a.asn <> b.asn
      OPTIONAL MATCH (b)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (b)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (b)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (b)-[:COUNTRY {reference_name: 'nro.delegated_stats'}]->(c:Country)
      RETURN DISTINCT b.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, c.country_code AS cc, 100*d.hege AS hegemony_score, 'IPv'+d.af AS af`,
    columns: [
      { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
      { name: 'Hegemony Score', label: 'Hegemony Score', align: 'left', field: row => row.get('hegemony_score'), format: val => `${Number(val).toFixed(2)}%`, sortable: true, },
    ]
  },
  atlas: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (atlas:AtlasProbe)-[loc:LOCATED_IN]->(a:AS {asn: $asn})
      OPTIONAL MATCH (atlas)-[:COUNTRY]-(cc:Country)
      CALL{
        WITH atlas, loc
        WITH atlas, loc
        WHERE loc.af = 4
        RETURN atlas.prefix_v4 AS prefix

        UNION
        WITH atlas, loc
        WITH atlas, loc
        WHERE loc.af = 6
        RETURN atlas.prefix_v6 AS prefix

      }
      RETURN atlas.id AS id, atlas.status_name AS status, 'IPv'+loc.af AS af, cc.country_code as cc, prefix`,
    columns: [
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'Probe ID', label: 'ID', align: 'left', field: row => row.get('id'), format: val => `${val}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
      { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true },
      { name: 'Status', label: 'Status', align: 'left', field: row => row.get('status'), format: val => `${val}`, sortable: true },
    ]
  }
})

const setPageTitle = (title) => {
  pageTitle.value = `AS${asn.value} - ${title}`
}

const setPeeringdbId = (id) => {
  peeringdbId.value = id
}

const loadSection = (key) => {
  // Don't do anything if already loaded
  if(!sections.value[key].loading){
    return
  }

  // Run the cypher query
  let query_params = { asn: asn.value }
  iyp_api.run(sections.value[key].query, query_params).then(
    results => {
      sections.value[key].data = results.records
      sections.value[key].loading = false
    }
  )
}

const treemapClicked = (event) => {
  if (event.points && event.points.length) {
    const network = event.points[0].label
    if (typeof network === 'string') {
      const prefixRegex = /^(?:(?:\d{1,3}\.){0,3}\d{0,3}(?:\/\d{1,2})?|(?:[0-9a-fA-F]{1,4}:){0,7}[0-9a-fA-F]{0,4}(?:\/\d{1,3})?)$/
      const prefixMatch = prefixRegex.exec(network)
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/
      const domainMatch = domainRegex.exec(network)
      if (prefixMatch) {
        const [host, prefixLength] = network.split('/')
        if (prefixLength) {
          router.push(Tr.i18nRoute({
            name: 'networks',
            params: { id: host, length: prefixLength },
          }))
        }
      } else if (network.split(' ')[0] in isoCountries) {
        router.push(Tr.i18nRoute({
          name: 'countries',
          params: { cc: network.split(' ')[0] },
        }))
      } else if (domainMatch) {
        router.push(Tr.i18nRoute({
          name: 'domains',
          params: { domain: network },
        }))
      }
    } else if (typeof network === 'object') {
      const asId = `AS${network.low}`
      router.push(Tr.i18nRoute({
        name: 'networks',
        params: { id: asId },
      }))
    }
  }
}

watch(() => route.params.id, () => {
  const newAsn = Number(route.params.id.replace('AS',''))
  if (newAsn != asn.value) {
    asn.value = newAsn
    // re-load opened sections
    let keys = Object.keys(sections.value)
    keys.forEach( key => {
      if( !sections.value[key].loading ){
        sections.value[key].loading = true
        sections.value[key].show = false
        // loadSection(key)
      }
    })
  }
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <QList>
        <ASOverview :as-number="asn" :title="setPageTitle" :peeringdbId="setPeeringdbId" />

        <QExpansionItem
          @click="loadSection('prefixes')"
          :label="$t('iyp.as.ipPrefix.title')"
          :caption="$t('iyp.as.ipPrefix.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.prefixes.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.prefixes.data"
              :columns="sections.prefixes.columns"
              :loading-status="sections.prefixes.loading"
              :cypher-query="sections.prefixes.query"
              :slot-length="1"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <IypGenericPieChart v-if="sections.prefixes.data.length > 0" :chart-data="sections.prefixes.data" :chart-layout="{ title: 'Geo-location (Maxmind)' }" />
                </div>
                <div class="col-6">
                  <IypGenericBarChart v-if="sections.prefixes.data.length > 0" :chart-data="sections.prefixes.data" :config="{key:'tags'}" :chart-layout="{ title: 'Tags' }" />
                </div>
               <div class="col-10">
                <IypGenericTreemapChart
                  v-if="sections.prefixes.data.length > 0"
                  :chart-data="sections.prefixes.data"
                  :chart-layout="{ title: 'Breakdown per RIR and geo-location (Maxmind)' }"
                  :config="{ keys: ['rir', 'cc', 'prefix'], root: pageTitle, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.descr}<extra>%{customdata.percent:.1f}%</extra>' }"
                  @treemap-clicked="treemapClicked($event)"
                 />
                </div>
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('peers')"
          :label="$t('iyp.as.peers.title')"
          :caption="$t('iyp.as.peers.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.peers.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.peers.data"
              :columns="sections.peers.columns"
              :loading-status="sections.peers.loading"
              :cypher-query="sections.peers.query"
              :slot-length="1"
            >
              <IypGenericTreemapChart
                v-if="sections.peers.data.length > 0"
                :chart-data="sections.peers.data"
                :config="{ keys: ['cc', 'asn'], root: pageTitle, show_percent: true, hovertemplate: '<b>%{label} %{customdata.name}</b><extra>%{customdata.percent:.1f}%</extra>' }"
                @treemap-clicked="treemapClicked($event)"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('upstreams')"
          :label="$t('iyp.as.upstreams.title')"
          :caption="'AS'+asn+' depends on these peer & upstream ASes'"
          header-class="IHR_charts-title"
          v-model="sections.upstreams.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.upstreams.data"
              :columns="sections.upstreams.columns"
              :loading-status="sections.upstreams.loading"
              :cypher-query="sections.upstreams.query"
              :slot-length="1"
            >
            <IypGenericBarChart v-if="sections.upstreams.data.length > 0" :chart-data="sections.upstreams.data" :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"}, range: [0,100],}}' :config="{key:'asn', groupKey:'af', value:'hegemony_score' , xlabel_prefix:'AS'}"/>
             <!--  <IypGenericTreemapChart
                v-if="dependings.length > 0"
                :chart-data="dependings"
                :chart-layout="{ title: 'Dependings' }"
                :config="{ keys: ['cc', 'asn'], keyValue: 'hegemony_score', root: this.asn, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
                /> -->
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('downstreams')"
          :label="$t('iyp.as.downstreams.title')"
          :caption="$t('iyp.as.downstreams.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.downstreams.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.downstreams.data"
              :columns="sections.downstreams.columns"
              :loading-status="sections.downstreams.loading"
              :cypher-query="sections.downstreams.query"
              :slot-length="1"
            >
              <div class="col-6">
                <IypGenericTreemapChart
                  v-if="sections.downstreams.data.length > 0"
                  :chart-data="sections.downstreams.data"
                  :chart-layout="{ title: '' }"
                  :config="{ keys: ['af', 'cc', 'asn'], keyValue: 'hegemony_score', root: pageTitle, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<br><br> Hegemony value: %{customdata.hegemony_score:.2f}%<extra></extra>' }"
                  @treemap-clicked="treemapClicked($event)"
                />
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('domains')"
          :label="$t('iyp.as.popularDomains.title')"
          :caption="$t('iyp.as.popularDomains.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.domains.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.domains.data"
              :columns="sections.domains.columns"
              :loading-status="sections.domains.loading"
              :cypher-query="sections.domains.query"
              :slot-length="1"
            >
         <!--      <GenericHoverEventsChart
                v-if="popularDomains.length > 0"
                :chart-data="popularDomains"
                :chart-layout="{ title: 'Popular Domains' }"
                /> -->
              <IypGenericTreemapChart
                v-if="sections.domains.data.length > 0"
                :chart-data="sections.domains.data"
                :config="{ keys: ['tld', 'domainName'], keyValue: 'inv_rank', root: pageTitle, textinfo: 'label', hovertemplate: '<b>%{label}</b> <br><br>%{customdata.rankingName}: #%{customdata.rank}<extra></extra>' }"
                @treemap-clicked="treemapClicked($event)"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('atlas')"
          :label="$t('iyp.as.atlas.title')"
          :caption="$t('iyp.as.atlas.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.atlas.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.atlas.data"
              :columns="sections.atlas.columns"
              :loading-status="sections.atlas.loading"
              :cypher-query="sections.atlas.query"
              :slot-length="1"
            >
              <IypGenericTreemapChart
                v-if="sections.atlas.data.length > 0"
                :chart-data="sections.atlas.data"
                :chart-layout="{ title: 'RIPE Atlas probes per prefix' }"
                :config="{ keys: ['af', 'prefix', 'id'],  root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} probes<extra></extra>' }"
                @treemap-clicked="treemapClicked($event)"
                />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('rankings')"
          :label="$t('iyp.as.rankings.title')"
          :caption="$t('iyp.as.rankings.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.rankings.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.rankings.data"
              :columns="sections.rankings.columns"
              :loading-status="sections.rankings.loading"
              :cypher-query="sections.rankings.query"
              :slot-length="1"
            >
              <IypGenericIndicatorsChart v-if="sections.rankings.data.length > 0" :chart-data="sections.rankings.data" />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('roas')"
          :label="$t('iyp.as.roas.title')"
          :caption="$t('iyp.as.roas.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.roas.show"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.roas.data"
              :columns="sections.roas.columns"
              :loading-status="sections.roas.loading"
              :cypher-query="sections.roas.query"
              :slot-length="0"
            >
           <!--  <IypGenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
             range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/> -->
            </IypGenericTable>
          </QCard>
        </QExpansionItem>


        <QExpansionItem
          @click="loadSection('siblings')"
          :label="$t('iyp.as.siblings.title')"
          :caption="$t('iyp.as.siblings.caption')"
          header-class="IHR_charts-title"
          v-model="sections.siblings.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.siblings.data"
              :columns="sections.siblings.columns"
              :loading-status="sections.siblings.loading"
              :cypher-query="sections.siblings.query"
            />
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('ixps')"
          :label="$t('iyp.as.ixp.title')"
          :caption="$t('iyp.as.ixp.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.ixps.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.ixps.data"
              :columns="sections.ixps.columns"
              :loading-status="sections.ixps.loading"
              :cypher-query="sections.ixps.query"
              :slot-length="2"
            >
              <IypGenericTreemapChart v-if="sections.ixps.data.length > 0"
                :chart-data="sections.ixps.data"
                :config="{ keys: ['cc', 'name'],  keyValue: '', root: pageTitle, show_percent: true }"
                @treemap-clicked="treemapClicked($event)"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('cofacilities')"
          :label="$t('iyp.as.facilities.title')"
          :caption="$t('iyp.as.facilities.caption')+asn"
          header-class="IHR_charts-title"
          v-model="sections.cofacilities.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.cofacilities.data"
              :columns="sections.cofacilities.columns"
              :loading-status="sections.cofacilities.loading"
              :cypher-query="sections.cofacilities.query"
            />
          </QCard>
        </QExpansionItem>

      </QList>
    </div>
  </div>
</template>