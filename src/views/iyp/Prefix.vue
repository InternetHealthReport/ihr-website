<template>
  <div id="IHR_as-and-ixp-container" ref="ihrAsAndIxpContainer" class="IHR_char-container">
    <h1 class="text-center">{{ pageTitle }}</h1>
    <div>
      <q-list>
        <Overview :host="host" :prefixLength="prefixLength" :title="setPageTitle" />

        <q-expansion-item
          @click="handleClick('domains')"
          :label="$t('iyp.prefix.popularDomains.title')"
          :caption="$t('iyp.prefix.popularDomains.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="domains"
              :columns="domainsColumns"
              :loading-status="this.loadingStatus.domains"
              :cypher-query="cypherQueries.domains"
              :slot-length="3"
            >
              <GenericTreemapChart
                v-if="domains.length > 0"
                :chart-data="domains"
                :config="{ keys: ['tld', 'domainName', 'ip'], keyValue: 'inv_rank', root: this.getPrefix(), hovertemplate: '<b>%{customdata.domainName}<br>%{label}</b> <br><br>%{customdata.rankingName}: %{customdata.rank}<br>%{customdata.tags}<extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('nameservers')"
          :label="$t('iyp.prefix.nameservers.title')"
          :caption="$t('iyp.prefix.nameservers.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="nameservers"
              :columns="nameserversColumns"
              :loading-status="this.loadingStatus.nameservers"
              :cypher-query="cypherQueries.nameservers"
              :slot-length="3"
            >
              <GenericTreemapChart
                v-if="nameservers.length > 0"
                :chart-data="nameservers"
                :config="{ keys: ['tld', 'nameserver', 'ip'], root: this.getPrefix(), hovertemplate: '<b>%{customdata.nameserver}<br>%{label}</b> <br><br>Manage %{customdata.nb_domains} popular domains<extra></extra>' }"
              />
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('upstreams')"
          :label="$t('iyp.prefix.upstreams.title')"
          :caption="this.getPrefix()+' depends on these ASes'"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="dependencies"
              :columns="dependenciesColumns"
              :loading-status="this.loadingStatus.dependencies"
              :cypher-query="cypherQueries.dependencies"
              :slot-length="1"
            >
            <GenericBarChart v-if="dependencies.length > 0" :chart-data="dependencies"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"}, range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/>
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('roas')"
          :label="$t('iyp.prefix.roas.title')"
          :caption="$t('iyp.prefix.roas.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="roas"
              :columns="roasColumns"
              :loading-status="this.loadingStatus.roas"
              :cypher-query="cypherQueries.roas"
              :slot-length="0"
            >
           <!--  <GenericBarChart v-if="roas.length > 0" :chart-data="roas"  :chart-layout='{yaxis: { title: {text: "AS Hegemony (%)"},
             range: [0,100],}}' :config="{key:'asn', value:'hegemony_score' , xlabel_prefix:'AS'}"/> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('lessSpecific')"
          :label="$t('iyp.prefix.lessSpecific.title')"
          :caption="$t('iyp.prefix.lessSpecific.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="lessSpecific"
              :columns="lessSpecificColumns"
              :loading-status="this.loadingStatus.lessSpecific"
              :cypher-query="cypherQueries.lessSpecific"
            >
            <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>

        <q-expansion-item
          @click="handleClick('moreSpecific')"
          :label="$t('iyp.prefix.moreSpecific.title')"
          :caption="$t('iyp.prefix.moreSpecific.caption')+this.getPrefix()"
          header-class="IHR_charts-title"
        >
          <q-separator />

          <q-card v-if="tableVisible" class="q-ma-xl IHR_charts-body">
            <GenericTable
              :data="moreSpecific"
              :columns="moreSpecificColumns"
              :loading-status="this.loadingStatus.moreSpecific"
              :cypher-query="cypherQueries.moreSpecific"
            >
            <!-- <GenericPieChart v-if="lessSpecific.length > 0" :chart-data="lessSpecific" :chart-layout="{ title: 'Country' }" /> -->
            </GenericTable>
          </q-card>
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import Overview from '@/views/charts/iyp/PrefixOverview'
import GenericTable from '@/views/charts/iyp/GenericTable'
import GenericBarChart from '@/views/charts/iyp/GenericBarChart'
import GenericTreemapChart from '@/views/charts/iyp/GenericTreemapChart'


export default {
  components: {
    Overview,
    GenericTable,
    GenericBarChart,
    GenericTreemapChart,
  },
  data() {
    return {
      host: null,
      prefixLength: null,
      pageTitle: 'Prefix - Loading..',
      domainsColumns: [
        { name: 'Tranco Rank', label: 'Tranco Rank', align: 'left', field: row => row.rank?Number(row.rank): 1000001, format: val => val!=1000001? val: '-', sortable: true, sortOrder: 'ad' },
        { name: 'TLD', label: 'TLD', align: 'left', field: row => row.tld, format: val => `${val}`, sortable: true },
        { name: 'Domain', label: 'Domain Name', align: 'left', field: row => row.domainName, format: val => `${val}`, sortable: true },
        { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Tags', label: 'Domain Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
      ],
      nameserversColumns: [
        { name: 'TLD', label: 'TLD', align: 'left', field: row => row.tld, format: val => `${val}`, sortable: true },
        { name: 'Nameserver', label: 'Authoritative Nameserver', align: 'left', field: row => row.nameserver, format: val => `${val}`, sortable: true },
        { name: 'Domain', label: 'Nb. Popular Domain Names', align: 'left', field: row => row.nb_domains, format: val => `${val}`, sortable: true },
        { name: 'IP', label: 'IP', align: 'left', field: row => row.ip, format: val => `${val}`, sortable: true },
      ],
      dependenciesColumns: [
        { name: 'CC', label: 'CC', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Name', label: 'AS Name', align: 'left', field: row => row.name, format: val => `${val}`, sortable: true },
      ],
      roasColumns: [
        { name: 'ASN', label: 'ASN', align: 'left', field: row => row.asn, format: val => `AS${val}`, sortable: true },
        { name: 'Prefix Length', label: 'Prefix Length', align: 'left', field: row => row.maxLength, format: val => `${val}`, sortable: true },
        { name: 'NotBefore', label: 'NotBefore', align: 'left', field: row => row.notBefore, format: val => `${val}`, sortable: true },
        { name: 'NotAfter', label: 'NotAfter', align: 'left', field: row => row.notAfter, format: val => `${val}`, sortable: true },
        { name: 'URL', label: 'URL', align: 'right', field: row => row.uri, format: val => `${val}`, sortable: true },
      ],
      lessSpecificColumns: [
        { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.rir_country, format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.origin, format: val => `AS${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.visibility, format: val => `${Number(val).toFixed(2)}%`, sortable: true },
      ],
      moreSpecificColumns: [
        { name: 'RIR', label: 'RIR', align: 'left', field: row => row.rir? row.rir : '', format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Reg. Country', label: 'Reg. Country ', align: 'left', field: row => row.rir_country, format: val => `${String(val).toUpperCase()}`, sortable: true },
        { name: 'Geoloc. Country', label: 'Geoloc', align: 'left', field: row => row.cc, format: val => `${val}`, sortable: true },
        { name: 'Origin AS', label: 'Origin AS', align: 'left', field: row => row.origin, format: val => `AS${val}`, sortable: true },
        { name: 'Prefix', label: 'Prefix', align: 'left', field: row => row.prefix, format: val => `${val}`, sortable: true, sortOrder: 'ad' },
        { name: 'Description', label: 'Description', align: 'left', field: row => row.descr, format: val => `${val}`, sortable: true },
        { name: 'Tags', label: 'Tags', align: 'left', field: row => row.tags, format: val => `${val.join(', ')}`, sortable: true },
        { name: 'Visibility', label: 'Visibility', align: 'left', field: row => row.visibility, format: val => `${Number(val).toFixed(2)}%`, sortable: true },
      ],
      domains: [],
      nameservers: [],
      dependencies: [],
      roas: [],
      lessSpecific: [],
      moreSpecific: [],
      cypherQueries: {},
      tableVisible: true,
      show: {
        overview: true,
        domains: false,
        nameservers: false,
        dependencies: false,
        roas: false,
        lessSpecific: false,
        moreSpecific: false,
      },
      loadingStatus: {
        domains: false,
        nameservers: false,
        dependencies: false,
        roas: false,
        lessSpecific: false,
        moreSpecific: false,
      },
      count: {
        domains: 0,
        nameservers: 0,
        dependencies: 0,
        roas: 0,
        lessSpecific: 0,
        moreSpecific: 0,
      },
      expanded: [],
    }
  },
  created() {
    this.host = this.$route.params.host
    this.prefixLength = this.$route.params.prefix_length
  },
  async mounted() {},
  methods: {
    setPageTitle(title) {
      this.pageTitle = `${this.getPrefix()} ${title}`
    },
    getPrefix() {
      return `${this.host}/${this.prefixLength}`
    },
    getDomains() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(d:DomainName)
      OPTIONAL MATCH (d)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (d)-[ra:RANK]->(rn:Ranking {name: 'Tranco top 1M'})
      RETURN COLLECT(DISTINCT i.ip) AS ip, d.name as domain, collect(DISTINCT t.label) as tags, ra.rank AS rank, split(d.name, '.')[-1] AS tld, 1/toFloat(ra.rank) AS inv_rank, rn.name as rankingName

      `
      const mapping = {
        rank: 'rank',
        ip: 'ip',
        domainName: 'domain',
        tags: 'tags',
        inv_rank: 'inv_rank',
        rankingName: 'rankingName',
        tld: 'tld'
      }
      const prefix = this.getPrefix()
      // console.log(prefix)
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'domains' }
    },
    getNameservers() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF]-(i:IP)<-[:RESOLVES_TO]-(n:AuthoritativeNameServer)
      OPTIONAL MATCH (n)<-[:MANAGED_BY]-(d:DomainName)
      RETURN COLLECT(DISTINCT i.ip) AS ip, n.name as nameserver, split(n.name, '.')[-1] AS tld, COUNT(DISTINCT d.name) AS nb_domains

      `
      const mapping = {
        ip: 'ip',
        tld: 'tld',
        nb_domains: 'nb_domains',
        nameserver: 'nameserver'
      }
      const prefix = this.getPrefix()
      // console.log(prefix)
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'nameservers' }
    },
    getDependencies() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})-[dep:DEPENDS_ON]-(a:AS)-[:NAME]-(n:Name)
      OPTIONAL MATCH (a)-[:COUNTRY]-(c:Country)
      RETURN DISTINCT a.asn AS asn, head(collect(c.country_code)) AS cc, head(collect(DISTINCT(n.name))) AS name, 100*dep.hege AS hege
      `

      const mapping = {
        cc: 'cc',
        asn: 'asn',
        name: 'name',
        hegemony_score: 'hege'
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'dependencies' }
    },
    getRoas() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})-[roa:ROUTE_ORIGIN_AUTHORIZATION]-(a:AS)
      RETURN a.asn AS asn, roa.maxLength AS maxLength, roa.notBefore AS notBefore, roa.notAfter AS notAfter, roa.uri AS uri
      `

      const mapping = {
        asn: 'asn',
        maxLength: 'maxLength',
        notBefore: 'notBefore',
        notAfter: 'notAfter',
        uri: 'uri',
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'roas' }
    },
    getLessSpecific() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})-[:PART_OF*]->(x:Prefix)
      WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0'
      OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
      OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
      OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
      OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
      OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
      RETURN c.country_code AS cc, x.prefix as prefix, collect(DISTINCT a.asn) as origin_asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility
      `

      const mapping = {
        cc: 'cc',
        rir: 'rir',
        rir_country: 'rir_country',
        prefix: 'prefix',
        origin: 'origin_asn',
        tags: 'tags',
        descr: 'descr',
        visibility: 'visibility'
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'lessSpecific' }
    },
    getMoreSpecific() {
      const query = `
      MATCH (p:Prefix {prefix: $prefix})<-[:PART_OF*]-(x:Prefix)
      WHERE x.prefix <> '0.0.0.0/0' AND x.prefix <> '::/0'
      OPTIONAL MATCH (p)-[:COUNTRY {reference_org:'IHR'}]->(c:Country)
      OPTIONAL MATCH (x)-[:CATEGORIZED]->(t:Tag)
      OPTIONAL MATCH (p)-[creg:COUNTRY {reference_org:'NRO'}]->(creg_country:Country)
      OPTIONAL MATCH (p)-[:PART_OF]->(cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(:OpaqueID)
      OPTIONAL MATCH (cover:Prefix)-[cover_creg:ASSIGNED {reference_org:'NRO'}]->(cover_creg_country:Country)
      OPTIONAL MATCH (x)<-[o:ORIGINATE]-(a:AS)
      RETURN c.country_code AS cc, x.prefix as prefix, collect(DISTINCT a.asn) as origin_asn, collect(DISTINCT t.label) as tags,  toUpper(COALESCE(creg.registry, cover_creg.registry, '-')) AS rir, toUpper(COALESCE(creg_country.country_code, cover_creg_country.country_code, '-')) AS rir_country, collect(DISTINCT o.descr) as descr, collect(DISTINCT o.visibility) as visibility
      `

      const mapping = {
        cc: 'cc',
        rir: 'rir',
        rir_country: 'rir_country',
        prefix: 'prefix',
        origin: 'origin_asn',
        tags: 'tags',
        descr: 'descr',
        visibility: 'visibility'
      }
      const prefix = this.getPrefix()
      return { cypherQuery: query, params: { prefix: prefix }, mapping, data: 'moreSpecific' }
    },
    async handleClick(key) {
      if (!this.expanded.includes(key)) {
        this.expanded.push(key)
      }

      const clickedItem = key
      let query = {}
      if (clickedItem === 'domains') {
        query = this.getDomains()
      } else if (clickedItem === 'nameservers') {
        query = this.getNameservers()
      } else if (clickedItem === 'upstreams') {
        query = this.getDependencies()
      } else if (clickedItem === 'roas') {
        query = this.getRoas()
      } else if (clickedItem === 'lessSpecific') {
        query = this.getLessSpecific()
      } else if (clickedItem === 'moreSpecific') {
        query = this.getMoreSpecific()
      } else {
        return
      }

      this.count[query.data] += 1
      if (this.count[query.data] > 1) {
        return
      }
      // console.log(`${this.count[query.data]} time`)
      this.loadingStatus[query.data] = true
      const results = await this.$iyp_api.run(query.cypherQuery, query.params)
      const formattedRes = this.$iyp_api.formatResponse(results, query.mapping)
      this[query.data] = formattedRes

      this.cypherQueries[query.data] = query.cypherQuery
      this.loadingStatus[query.data] = false
    },
  },
  watch: {
    '$route.params': {
      handler: async function (params) {
        if (params.host != this.host || params.prefixLength != this.prefixLength) {
          this.host = this.$route.params.host
          this.prefixLength = this.$route.params.prefix_length

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
