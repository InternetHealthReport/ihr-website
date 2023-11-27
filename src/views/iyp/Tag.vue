<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">Tag: {{ tag }}</h1>
    <div>
      <q-list>

        <q-expansion-item
          v-if='show.domains'
          @click="handleClick('domains')"
          :label="nodes[0].nb_domains+' '+$t('iyp.tag.popularDomains.title')"
          :caption="'Popular domain names classified as '+this.tag"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="domains"
              :columns="domainsColumns"
              :loading-status="this.loadingStatus.domains"
              :cypher-query="cypherQueries.domains"
              :slot-length="0"
            >
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          v-if='show.ases'
          @click="handleClick('ases')"
          :label="nodes[0].nb_ases+' '+$t('iyp.tag.ases.title')"
          :caption="'ASes classified as '+this.tag"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="ases"
              :columns="asesColumns"
              :loading-status="this.loadingStatus.ases"
              :cypher-query="cypherQueries.ases"
              :slot-length="1"
            >
                <GenericTreemapChart
                  v-if="ases.length > 0 & ases.length < 5000"
                  :chart-data="ases"
                  :chart-layout="{ title: 'Breakdown per RIR and registered country' }"
                  :config="{ keys: ['rir', 'cc', 'asn'], root: this.tag, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.name}<extra>%{customdata.__percent:.1f}%</extra>' }"
                 />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
            v-if='show.prefixes'
          @click="handleClick('prefixes')"
          :label="nodes[0].nb_prefixes+' '+$t('iyp.tag.prefixes.title')"
          :caption="$t('iyp.prefix.prefixes.caption')"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="prefixes"
              :columns="prefixesColumns"
              :loading-status="this.loadingStatus.prefixes"
              :cypher-query="cypherQueries.prefixes"
              :slot-length="1"
            >
                <GenericTreemapChart
                  v-if="prefixes.length > 0 & prefixes.length < 5000"
                  :chart-data="prefixes"
                  :chart-layout="{ title: 'Breakdown per origin AS' }"
                  :config="{ keys: ['origin_asn', 'prefix'], root: this.tag, show_percent: true, hovertemplate: '<b>%{label}</b><br>%{customdata.descr}<extra>%{customdata.__percent:.1f}%</extra>' }"
                 />
            </GenericTable>
          </q-card>
        </q-expansion-item>

      </q-list>
    </div>
  </div>
</template>

<script>
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'


export default {
  components: {
    GenericTable,
    GenericTreemapChart
  },
  data() {
    return {
      tag: null,
      domainsColumns: [
        { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.classifier_org, row.classifier_name], format: val => `${val[0]} (${val[1]})`, sortable: true },
        { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.rank?Number(row.rank): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
        { name: 'TLD', label: 'TLD', align: 'left', field: row => row.tld, format: val => `${val}`, sortable: true },
        { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.other_tags, format: val => `${val.join(', ')}`, sortable: true },
      ],
      asesColumns: [
        { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.classifier_org, row.classifier_name], format: val => `${val[0]} (${val[1]})`, sortable: true },
        { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.cc, format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.other_tags, format: val => `${val.join(', ')}`, sortable: true },
      ],
      prefixesColumns: [
        { name: 'Classified by', label: 'Classified by', align: 'left', field: row => [row.classifier_org, row.classifier_name], format: val => `${val[0]} (${val[1]})`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.origin_asn, format: val => `${val}`, sortable: true },
        { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
        { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Other Tags', align: 'left', field: row => row.other_tags, format: val => `${val.join(', ')}`, sortable: true },
      ],
      nodes: [],
      domains: [],
      ases: [],
      prefixes: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        domains: false,
        ases: false,
        prefixes: false,
      },
      loadingStatus: {
        domains: false,
        ases: false,
        prefixes: false,
      },
      count: {
        domains: 0,
        ases: 0,
        prefixes: 0,
      },
      expanded: [],
    }
  },
  created() {
    this.tag = this.$route.params.tag
  },
  mounted() {
    this.handleClick('nodes')
  },
  methods: {
    getNodeCounts(){
      const query = `
      MATCH (t:Tag {label: $tag})
      OPTIONAL MATCH (t)<-[:CATEGORIZED]-(d:DomainName) WITH t, count(DISTINCT d) as nb_domains
      OPTIONAL MATCH (t)<-[:CATEGORIZED]-(a:AS) WITH t, nb_domains, count(DISTINCT a) as nb_ases
      OPTIONAL MATCH (t)<-[:CATEGORIZED]-(p:Prefix) WITH t, nb_domains, nb_ases, count(DISTINCT p) as nb_prefixes
      RETURN  nb_domains, nb_ases, nb_prefixes
      `

      const mapping = {
        nb_domains: 'nb_domains',
        nb_ases: 'nb_ases',
        nb_prefixes: 'nb_prefixes',
      }
      return { cypherQuery: query, params: { tag: this.tag }, mapping, data: 'nodes' }


    },
    getDomains() {
      const query = `
      MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(d:DomainName)
      OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
      OPTIONAL MATCH (d)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
      RETURN d.name AS domain, collect(DISTINCT to.label) AS other_tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, rn.name AS rankingName, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url
`

      const mapping = {
        rank: 'rank',
        domainName: 'domain',
        other_tags: 'other_tags',
        rankingName: 'rankingName',
        tld: 'tld',
        classifier_org: 'classifier_org',
        classifier_url: 'classifier_url',
        classifier_name: 'classifier_name'
      }
      return { cypherQuery: query, params: { tag: this.tag }, mapping, data: 'domains' }
    },
    getASes() {
      const query = `
      MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(a:AS)
      OPTIONAL MATCH (a)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
      OPTIONAL MATCH (a)-[:NAME {reference_org:'RIPE NCC'}]->(n:Name)
      OPTIONAL MATCH (a)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
      RETURN a.asn as asn, n.name as name, collect(DISTINCT to.label) as other_tags, toUpper(COALESCE(creg.registry,  '-')) AS rir, creg_country.country_code AS cc, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url`

      const mapping = {
        asn: 'asn',
        name: 'name',
        cc: 'cc',
        rir: 'rir',
        other_tags: 'other_tags',
        classifier_org: 'classifier_org',
        classifier_url: 'classifier_url',
        classifier_name: 'classifier_name'
      }
      return { cypherQuery: query, params: { tag: this.tag }, mapping, data: 'ases' }
    },
    getPrefixes() {
      const query = `
      MATCH (t:Tag {label: $tag})<-[cat:CATEGORIZED]-(p:Prefix)
      OPTIONAL MATCH (p)<-[o:ORIGINATE]-(a:AS)
      OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
      OPTIONAL MATCH (p)-[:CATEGORIZED]->(to:Tag) WHERE t <> to
      RETURN p.prefix as prefix, collect(DISTINCT to.label) as other_tags, c.country_code AS cc, collect(DISTINCT a.asn) as origin_asn, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility, cat.reference_org AS classifier_org, split(cat.reference_name, '.')[-1] AS classifier_name, cat.reference_url AS classifier_url
      `

      const mapping = {
        prefix: 'prefix',
        cc: 'cc',
        origin_asn: 'origin_asn',
        descr: 'descr',
        other_tags: 'other_tags',
        visibility: 'visibility',
        classifier_org: 'classifier_org',
        classifier_url: 'classifier_url',
        classifier_name: 'classifier_name'
      }
      return { cypherQuery: query, params: { tag: this.tag }, mapping, data: 'prefixes' }
    },
    async handleClick(key) {
      if (!this.expanded.includes(key)) {
        this.expanded.push(key)
      }

      const clickedItem = key
      let query = {}
      if (clickedItem === 'nodes') {
        query = this.getNodeCounts()
      } else if (clickedItem === 'domains') {
        query = this.getDomains()
      } else if (clickedItem === 'ases') {
        query = this.getASes()
      } else if (clickedItem === 'prefixes') {
        query = this.getPrefixes()
      } else {
        return
      }

      this.count[query.data] += 1
      if (this.count[query.data] > 1) {
        return
      }
      this.loadingStatus[query.data] = true
      const results = await this.$iyp_api.run(query.cypherQuery, query.params)
      const formattedRes = this.$iyp_api.formatResponse(results, query.mapping)
      this[query.data] = formattedRes

      this.cypherQueries[query.data] = query.cypherQuery
      this.loadingStatus[query.data] = false
    },
  },
  watch: {
    'nodes': {
      handler: async function () {
        this.show.domains = this.nodes[0].nb_domains > 0
        this.show.ases = this.nodes[0].nb_ases > 0
        this.show.prefixes = this.nodes[0].nb_prefixes > 0
      }
    },
    '$route.params': {
      handler: async function (params) {
        if (params.tag != this.tag) {
          this.tag = this.$route.params.tag

          // reset to zero
          let items = Object.keys(this.count)
          items.forEach(item => (this.count[item] = 0))

          this.expanded.forEach(async key => {
            await this.handleClick(key)
          })
        }
      },
      deep: true,
    },
  },
}
</script>
