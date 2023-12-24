<script setup>
import { QList, QExpansionItem, QSeparator, QCard } from 'quasar'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Tr from '@/i18n/translation'
import { ref, inject, computed, watch, nextTick, onMounted } from 'vue'
import IypGenericTable from '@/components/tables/IypGenericTable.vue'
import IypGenericTreemapChart from '@/components/charts/IypGenericTreemapChart.vue'
import IypGenericBarChart from '@/components/charts/IypGenericBarChart.vue'

const iyp_api = inject('iyp_api')

const route = useRoute()
const router = useRouter()

const domainName = ref(route.params.domain)
const pageTitle = ref(domainName.value)
const sections = ref({
  // Rankings
  rankings: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:DomainName {name: $domain})-[rr:RANK]-(r:Ranking)
      RETURN r.name AS rank_name, rr.rank AS rank, 1/(1+toFloat(rr.rank)) AS inv_rank`,
    columns: [
      { name: 'Ranking Name', label: 'Ranking Name', align: 'left', field: row => row.get('rank_name'), format: val => `${val}`, sortable: true, description: 'Name of the ranking. Different rankings have different meanings, please see the page corresponding to each ranking for more details.'  },
      { name: 'Rank', label: 'Rank', align: 'left', field: row => Number(row.get('rank')), format: val => `${val}`, sortable: true, description: 'Position in the ranking.'   },
    ],
    pagination: {
      sortBy: 'Rank', //string column name
      ascending: true //boolean
    }
  },
  nameservers: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:DomainName {name: $domain})-[:MANAGED_BY]-(n:AuthoritativeNameServer)
      OPTIONAL MATCH (n)-[:RESOLVES_TO]->(i:IP)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      RETURN  DISTINCT i.ip AS ip, n.name as nameserver, 'AS'+a.asn AS asn, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
    columns: [
      { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.get('nameserver'), format: val => `${val}`, sortable: true },
      { name: 'IP', label: 'IP', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
      { name: 'Prefix Tags', label: 'Prefix Tags', align: 'left', field: row => row.get('tags'), format: val => `${val}`, sortable: true },
      { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
    ]
  },
  ips: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:DomainName {name: $domain})-[:RESOLVES_TO]-(i:IP)
      OPTIONAL MATCH (i)-[:PART_OF]-(p:Prefix)-[:ORIGINATE]-(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(t:Tag)
      RETURN DISTINCT 'AS'+a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS asname, i.ip as ip, p.prefix AS prefix, COLLECT(DISTINCT t.label) AS tags`,
    columns: [
      { name: 'IP address', label: 'IP address', align: 'left', field: row => row.get('ip'), format: val => `${val}`, sortable: true },
      { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.get('prefix'), format: val => `${val}`, sortable: true },
      { name: 'Prefix Tags', label: 'Prefix Tags', align: 'left', field: row => row.get('tags'), format: val => `${val}`, sortable: true },
      { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
      { name: 'Name', label: 'AS Name', align: 'left', field: row => row.get('asname'), format: val => `${val}`, sortable: true },
    ]
  },
  country_query: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:DomainName {name: $domain})-[q:QUERIED_FROM]->(c:Country)
      RETURN  c.country_code AS cc, c.name AS name, q.value AS perc`,
    columns: [
      { name: 'CC', label: 'CC', align: 'left', field: row => row.get('cc'), format: val => `${val}`, sortable: true },
      { name: 'Country', label: 'Country', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
      { name: 'Percentage of DNS queries', label: 'Percentage of DNS queries', align: 'left', field: row => Number(row.get('perc')), format: val => `${val.toFixed(2)}`, sortable: true, description: 'Percentage of DNS queries received by Cloudflare\'s open resolver in the country. (Cloudflare Radar)' },
    ],
    pagination: {
      sortBy: 'Percentage of DNS queries', //string column name
      descending: true //boolean
    }
  },
  as_query: {
    data: [],
    show: false,
    loading: true,
    query: `MATCH (:DomainName {name: $domain})-[q:QUERIED_FROM]->(a:AS)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'PeeringDB'}]->(pdbn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'BGP.Tools'}]->(btn:Name)
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(ripen:Name)
      RETURN  a.asn AS asn, COALESCE(pdbn.name, btn.name, ripen.name) AS name, q.value AS perc`,
    columns: [
      { name: 'ASN', label: 'ASN', align: 'left', field: row => row.get('asn'), format: val => `${val}`, sortable: true },
      { name: 'AS Name', label: 'AS Name', align: 'left', field: row => row.get('name'), format: val => `${val}`, sortable: true },
      { name: 'Percentage of DNS queries', label: 'Percentage of DNS queries', align: 'left', field: row => Number(row.get('perc')), format: val => `${val.toFixed(2)}`, sortable: true, description: 'Percentage of DNS queries received by Cloudflare\'s open resolver in the country. (Cloudflare Radar)' },
    ],
    pagination: {
      sortBy: 'Percentage of DNS queries', //string column name
      descending: true //boolean
    }
  }
})

const loadSection = (key) => {
  // Don't do anything if already loaded
  if(!sections.value[key].loading){
    return
  }

  // Run the cypher query
  let query_params = { domain: domainName.value }
  iyp_api.run(sections.value[key].query, query_params).then(
    results => {
      sections.value[key].data = results.records
      sections.value[key].loading = false
    }
  )
}

watch(() => route.params.domain, () => {
  const newDomain = route.params.domain
  if (newDomain != domainName.value) {
    domainName.value = newDomain
    pageTitle.value = newDomain
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
    <!-- Overview: IPv4, IPv6 addresses, RPKI, # Nameservers? -->
    <div>
      <QList>

        <QExpansionItem
          @click="loadSection('ips')"
          :label="$t('iyp.domainname.ips.title')"
          :caption="$t('iyp.domainname.ips.caption')+pageTitle"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.ips.data"
              :columns="sections.ips.columns"
              :loading-status="sections.ips.loading"
              :cypher-query="sections.ips.query"
              :slot-length="1"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <IypGenericBarChart v-if="sections.ips.data.length > 0" :chart-data="sections.ips.data" :config="{key:'tags'}" :chart-layout="{ title: 'Prefix Tags' }" />
                </div>
                <div class="col-8">
                  <IypGenericTreemapChart
                    v-if="sections.ips.data.length > 0"
                    :chart-data="sections.ips.data"
                    :config="{ keys: ['asn', 'prefix', 'ip'], root: pageTitle, hovertemplate: '<b>%{label}<br>%{value}</b> <br><br><extra></extra>' }"
                  />
                </div>
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('nameservers')"
          :label="$t('iyp.domainname.nameservers.title')"
          :caption="$t('iyp.domainname.nameservers.caption')+pageTitle"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.nameservers.data"
              :columns="sections.nameservers.columns"
              :loading-status="sections.nameservers.loading"
              :cypher-query="sections.nameservers.query"
              :slot-length="1"
            >
              <div class="row justify-evenly">
                <div class="col-4">
                  <IypGenericBarChart v-if="sections.nameservers.data.length > 0" :chart-data="sections.nameservers.data" :config="{key:'tags'}" :chart-layout="{ title: 'Prefix Tags' }" />
                </div>
                <div class="col-8">
                  <IypGenericTreemapChart
                    v-if="sections.nameservers.data.length > 0"
                    :chart-data="sections.nameservers.data"
                    :config="{ keys: ['asn', 'prefix', 'ip', 'nameserver'], root: pageTitle, hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br><extra></extra>' }"
                  />
                </div>
              </div>
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('country_query')"
          :label="$t('iyp.domainname.country_query.title')"
          :caption="$t('iyp.domainname.country_query.caption')+pageTitle"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.country_query.data"
              :columns="sections.country_query.columns"
              :loading-status="sections.country_query.loading"
              :cypher-query="sections.country_query.query"
              :slot-length="1"
              :pagination="sections.as_query.pagination"
            >
              <IypGenericTreemapChart
                v-if="sections.country_query.data.length > 0"
                :chart-data="sections.country_query.data"
                :config="{ keys: ['name'], keyValue: 'perc', root: pageTitle, hovertemplate: '<b>%{label}<br>%{value}%</b> <br><br><extra></extra>' }"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('as_query')"
          :label="$t('iyp.domainname.as_query.title')"
          :caption="$t('iyp.domainname.as_query.caption')+pageTitle"
          header-class="IHR_charts-title"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.as_query.data"
              :columns="sections.as_query.columns"
              :loading-status="sections.as_query.loading"
              :cypher-query="sections.as_query.query"
              :slot-length="1"
              :pagination="sections.as_query.pagination"
            >
              <IypGenericTreemapChart
                v-if="sections.as_query.data.length > 0"
                :chart-data="sections.as_query.data"
                :config="{ keys: ['name'], keyValue: 'perc', root: pageTitle, hovertemplate: '<b>%{label}<br>%{value}%</b> <br><br><extra></extra>' }"
              />
            </IypGenericTable>
          </QCard>
        </QExpansionItem>

        <QExpansionItem
          @click="loadSection('rankings')"
          :label="$t('iyp.domainname.rankings.title')"
          :caption="$t('iyp.domainname.rankings.caption')+pageTitle"
          header-class="IHR_charts-title"
          v-model="sections.rankings.show"
        >
          <QSeparator />

          <QCard class="q-ma-xl IHR_charts-body">
            <IypGenericTable
              :data="sections.rankings.data"
              :columns="sections.rankings.columns"
              :loading-status="sections.rankings.loading"
              :cypher-query="sections.rankings.query"
              :pagination="sections.rankings.pagination"
            >
            </IypGenericTable>
          </QCard>
        </QExpansionItem>


      </QList>
    </div>
  </div>
</template>