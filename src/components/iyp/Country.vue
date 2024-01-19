<script setup>
import { QList, QExpansionItem, QSeparator, QCard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import CountryOverview from './CountryOverview.vue'
import IypGenericTable from '../tables/IypGenericTable.vue'
import IypGenericBarChart from '../charts/IypGenericBarChart.vue'
import IypGenericTreemapChart from '../charts/IypGenericTreemapChart.vue'
import { isoCountries } from '@/plugins/countryName'
import * as ipAddress from 'ip-address'

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const cc = ref(route.params.cc)
const pageTitle = ref(null)
const aggPrefixes = ref([])
const sections = ref({
  // Autonomous Systems
  ases: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'nro.delegated_stats'}]-(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (a)-[r:RANK {reference_org:'CAIDA'}]->(:Ranking {name:'CAIDA ASRank'})
      RETURN c.country_code AS cc, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, r['asnDegree:total'] AS degree`,
    columns: [
      { name: 'ASN', label: 'ASN', align: 'left', field: row => Number(row.get('asn')), format: val => `AS${val}`, sortable: true },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
      { name: 'Connected networks', label: 'Connected networks', align: 'left', field: row => Number(row.get('degree')), format: val => `${val}`, sortable: true },
    ],
    pagination: {
      sortBy: 'Connected networks', //string column name
      descending: true //boolean
    }
  },
  // IXPs
  ixps: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (c:Country {country_code: $cc})<-[:COUNTRY {reference_name: 'peeringdb.ix'}]-(i:IXP)
      MATCH (i)-[:EXTERNAL_ID]-(p:PeeringdbIXID)
      OPTIONAL MATCH (i)-[:MANAGED_BY]-(o:Organization)
      OPTIONAL MATCH (i)-[:MEMBER_OF]-(a:AS)
      RETURN c.country_code AS cc, i.name AS ixp, p.id AS id, o.name AS org, COUNT(DISTINCT a) AS nb_members`,
    columns: [
      { name: 'IXP', label: 'PeeringDB ID', align: 'left', field: row => row.get('id'), format: val => `IXP${val}`, sortable: true, description: 'Identifier used in the PeeringDB database and website.' },
      { name: 'Name', label: 'Name', align: 'left', field: row => row.get('ixp'), format: val => `${val}`, sortable: true, description: 'Name of the IXP as given by PeeringDB.'  },
      { name: 'Number of members', label: 'Number of members', align: 'left', field: row => row.get('nb_members'), format: val => `${val}`, sortable: true, description: 'Number of members according to PeeringDB.' },
    ],
    pagination: {
      sortBy: 'Number of members', //string column name
      descending: true //boolean
    }
  },
  // Prefixes
  prefixes: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(p:Prefix)
      OPTIONAL MATCH (p)<-[o:ORIGINATE {reference_org:'IHR'}]-(a:AS)
      OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
      OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
      OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
      RETURN c.country_code AS cc, toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, p.prefix AS prefix, COLLECT(DISTINCT(t.label)) AS tags, COLLECT(DISTINCT o.descr) AS descr, COLLECT(DISTINCT o.visibility) AS visibility, COLLECT(DISTINCT a.asn) AS asn `,
    columns: [
      { name: 'RIR', label: 'RIR', align: 'left', field: row => row.get('rir')? row.get('rir') : '', format: val => `${String(val).toUpperCase()}`, sortable: true, description: 'Regional Internet Registry where the prefix is allocated to (Delegated Stats).'  },
      { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.get('rir_country'), format: val => `${String(val).toUpperCase()}`, sortable: true,  description: 'Registered country code of the organization to which the prefix is allocated. (Delegated Stats)'  },
      { name: 'Geoloc. Country', label: 'Geoloc. Country', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true,  description: 'Geo-location of the prefix according to Maxmind. (Maxmind)'  },
      { name: 'ASN', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `${val.join(', ')}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true, sortOrder: 'ad', description: 'Autonomous System originating the prefix in BGP. (RIPE RIS, Routeviews)' },
      { name: 'Description', label: 'Description', align: 'left', field: row => row.get('descr'), format: val => `${val}`, sortable: true, description: 'Description of the prefix given in IRR. (IRR)' },
      { name: 'Tags', label: 'Tags', align: 'left', field: row => row.get('tags'), format: val => `${val.join(', ')}`, sortable: true, description: 'Tags assigned by various projects. See the corresponding tag page for more details.' },
      { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.get('visibility'), format: val => `${Number(val).toFixed(2)}%`, sortable: true, description: 'Percentage of RIPE RIS and Routeviews peers seeing this prefix/AS pair. (IHR)' },
    ],
  },
  // Rankings
  rankings: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(r:Ranking)-[rr:RANK]-(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN r.name AS rank_name, rr.rank AS rank, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, 1/(1+toFloat(rr.rank)) AS inv_rank`,
    columns: [
      { name: 'Ranking Name', label: 'ID', align: 'left', field: row => row.get('rank_name'), format: val => `${val}`, sortable: true, description: 'Name of the ranking. Different rankings have different meanings, please see the page corresponding to each ranking for more details.'  },
      { name: 'Rank', label: 'Rank', align: 'left', field: row => Number(row.get('rank')), format: val => `${val}`, sortable: true, description: 'Position in the ranking.'   },
      { name: 'ASN', label: 'AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true, description: 'Autonomous System.'    },
      { name: 'AS Name', label: 'Status', align: 'left', field: row => row.get('asname'), format: val => `${val}`, sortable: true, description: 'Name of the Autonomous System. (PeeringDB, BGP.Tools, RIPE NCC)'  },
    ],
    pagination: {
      sortBy: 'Rank', //string column name
      ascending: true //boolean
    }
  },
  // Atlas Probes
  atlas: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:Country {country_code: $cc})-[:COUNTRY]-(atlas:AtlasProbe)-[loc:LOCATED_IN]-(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN atlas.id AS id, atlas.status_name AS status, 'IPv'+loc.af AS af, a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname`,
    columns: [
      { name: 'Probe ID', label: 'ID', align: 'left', field: row => row.get('id'), format: val => `${val}`, sortable: true, description: 'Atlas identifier for this probe. (RIPE Atlas)'  },
      { name: 'IP version', label: 'IP version', align: 'left', field: row => row.get('af'), format: val => `${val}`, sortable: true, description: 'IP version used by the probe. (RIPE Atlas)'   },
      { name: 'ASN', label: 'AS', align: 'left', field: row => row.get('asn'), format: val => `AS${val}`, sortable: true, description: 'Autonomous System hosting the probe. (RIPE Atlas)'    },
      { name: 'AS Name', label: 'Status', align: 'left', field: row => row.get('asname'), format: val => `${val}`, sortable: true, description: 'Name of the Autonomous System. (PeeringDB, BGP.Tools, RIPE NCC)'  },
      { name: 'Status', label: 'Status', align: 'left', field: row => row.get('status'), format: val => `${val}`, sortable: true, description: 'Status of the probe: Connected/Disconnected/Abandonned. (RIPE Atlas)'  },
    ],
  }
})

const Address4 = ipAddress.Address4
const Address6 = ipAddress.Address6

const setPageTitle = (title) => {
  pageTitle.value = title
}

const loadSection = (key) => {
  // Don't do anything if already loaded
  if (!sections.value[key].loading) {
    return
  }

  // Run the cypher query
  let query_params = { cc: cc.value }
  iyp_api.run(sections.value[key].query, query_params).then(
    results => {
      sections.value[key].data = results.records
      // Post-processing for prefixes
      if (key == 'prefixes') {
        aggPrefixes.value = aggregatePrefixes(sections.value[key].data)
      }
      sections.value[key].loading = false
    }
  )
}

const aggregatePrefixes = (prefixData) => {
  const asCount = {}
  prefixData.forEach( item => {
    item.get('asn').forEach( asn => {
      if(!asCount[asn]){
        asCount[asn] = {
          nbPrefixes:1,
          asn: 'AS'+asn,
          get(key) {
            return this[key]
          }
        }
      }
      else{
        asCount[asn].nbPrefixes += 1
      }
    })
  })
  return Object.values(asCount)
}

const treemapClicked = (event) => {
  if (event.points && event.points.length) {
    const network = event.points[0].label
    if (typeof network === 'string') {
      let prefixMatch
      try {
        prefixMatch = (new Address4(network)).isCorrect()
      } catch (e) {
        prefixMatch = null
      }
      if (!prefixMatch) {
        try {
          prefixMatch = (new Address6(network)).isCorrect()
        } catch (e) {
          prefixMatch = null
        }
      }
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
      } else if (network.includes('AS')) {
        router.push(Tr.i18nRoute({
          name: 'networks',
          params: { id: network },
        }))
      }
    } 
  }
}

watch(() => route.params.cc, () => {
  const newCc = root.params.cc
  if (newCc != cc.value) {
    cc.value = newCc
    // re-load opened sections
    let keys = Object.keys(sections.value)
    keys.forEach( key => {
      if (!sections.value[key].loading) {
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
        <CountryOverview :country-code="cc" :title="setPageTitle" />

        <QExpansionItem
          @click="loadSection('rankings')"
          :label="$t('iyp.country.rankings.title')"
          :caption="$t('iyp.country.rankings.caption')+pageTitle"
          header-class="IHR_chart-title"
          v-model="sections.rankings.show"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.rankings.data"
              :columns="sections.rankings.columns"
              :loading-status="sections.rankings.loading"
              :cypher-query="sections.rankings.query.replace(/\$(.*?)}/, `'${cc}'`)"
              :pagination="sections.rankings.pagination"
              :slot-length=1
            >

              <IypGenericTreemapChart
                v-if="sections.rankings.data.length > 0"
                :chart-data="sections.rankings.data"
                :config="{ keys: ['asn', 'rank_name'], keyValue: 'inv_rank', root: pageTitle, hovertemplate: '<b>%{customdata.asn} %{customdata.asname}</b> <br><br>%{customdata.rank_name}: #%{customdata.rank}<extra></extra>' }"
                @treemap-clicked="treemapClicked($event)"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('ases')"
          :label="$t('iyp.country.ases.title')"
          :caption="$t('iyp.country.ases.caption')+pageTitle"
          header-class="IHR_chart-title"
          v-model="sections.ases.show"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.ases.data"
              :columns="sections.ases.columns"
              :loading-status="sections.ases.loading"
              :cypher-query="sections.ases.query.replace(/\$(.*?)}/, `'${cc}'`)"
              :pagination="sections.ases.pagination"
            />
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('ixps')"
          :label="$t('iyp.country.ixps.title')"
          :caption="$t('iyp.country.ixps.caption')+pageTitle"
          header-class="IHR_chart-title"
        >
          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.ixps.data"
              :columns="sections.ixps.columns"
              :loading-status="sections.ixps.loading"
              :cypher-query="sections.ixps.query.replace(/\$(.*?)}/, `'${cc}'`)"
              :pagination="sections.ixps.pagination"
              :slot-length=1
            >
              <div class="col-6">
                <IypGenericTreemapChart
                  v-if="sections.ixps.data.length > 0"
                  :chart-data="sections.ixps.data"
                  :chart-layout="{ title: 'IXPs in '+pageTitle+' weighted by their number of members' }"
                  :config="{ keys: ['org', 'ixp'], keyValue: 'nb_members', root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} members<extra></extra>' }"
                  @treemap-clicked="treemapClicked($event)"
                />
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('prefixes')"
          :label="$t('iyp.country.prefixes.title')"
          :caption="$t('iyp.country.prefixes.caption')+pageTitle"
          header-class="IHR_chart-title"
          v-model="sections.prefixes.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.prefixes.data"
              :columns="sections.prefixes.columns"
              :loading-status="sections.prefixes.loading"
              :cypher-query="sections.prefixes.query.replace(/\$(.*?)}/, `'${cc}'`)"
              :slot-length="2"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <IypGenericBarChart v-if="sections.prefixes.data.length > 0" :chart-data="sections.prefixes.data" :config="{key:'tags'}" :chart-layout="{ title: 'Tags' }" />
                </div>
               <div class="col-8">
                  <IypGenericTreemapChart
                    v-if="aggPrefixes.length > 0"
                    :chart-data="aggPrefixes"
                    :chart-layout="{ title: 'Number of prefixes per Origin AS' }"
                    :config="{ keys: ['asn'], keyValue: 'nbPrefixes', root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} prefixes<extra></extra>' }"
                    @treemap-clicked="treemapClicked($event)"
                  />
                </div>
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('atlas')"
          :label="$t('iyp.country.atlas.title')"
          :caption="$t('iyp.country.atlas.caption')+pageTitle"
          header-class="IHR_chart-title"
          v-model="sections.atlas.show"
        >
          <QSeparator />
          <QCard class="IHR_charts-body">
            <IypGenericTable
              :data="sections.atlas.data"
              :columns="sections.atlas.columns"
              :loading-status="sections.atlas.loading"
              :cypher-query="sections.atlas.query.replace(/\$(.*?)}/, `'${cc}'`)"
              :slot-length="1"
            >
              <IypGenericTreemapChart
                v-if="sections.atlas.data.length > 0"
                :chart-data="sections.atlas.data"
                :chart-layout="{ title: 'RIPE Atlas probes per AS' }"
                :config="{ keys: ['af', 'asn', 'status', 'id'],  root: pageTitle, hovertemplate: '<b>%{label}</b><br>%{value} probes<extra></extra>' }"
                @treemap-clicked="treemapClicked($event)"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>


      </QList>
    </div>
  </div>
</template>