<i18n src="@/locales/long_langs/documentation.json"></i18n>
<template>
    <div>
        <div>
            <q-input debounce="300" v-model="tabFilter" placeholder="Search">
                <template v-slot:prepend>
                    <q-icon name="fas fa-search" />
                </template>
            </q-input>
        </div>
        <q-table
            :data="rows"
            :columns="columns"
            :visible-columns="visibleColumns()"
            row-key="asNumber"
            :pagination.sync="pagination"
            :loading="loading"
            :filter="tabFilter"
            separator="vertical"
            binary-state-sort
            flat
        >
            <div slot="header" slot-scope="props" style="display: contents">
                <q-tr>
                    <q-th :colspan="showCountry ? 3 : 2"><h3>Route</h3> </q-th>
                    <q-th colspan="5"
                        ><h3>
                            Status
                            <q-icon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
                            <q-tooltip max-width="360px">
                                <div v-html="$t(`documentationPage.sections.prefixasdependency.description[0].body`)"></div>
                            </q-tooltip></h3
                    ></q-th>
                    <q-th colspan="2"
                        ><h3>
                            AS dependency
                            <q-icon name="far fa-question-circle" color="grey" style="font-size: 0.9em" right />
                            <q-tooltip max-width="360px">
                                <div v-html="$t(`documentationPage.sections.prefixasdependency.description[1].body`)"></div>
                            </q-tooltip></h3
                    ></q-th>
                </q-tr>
                <q-tr>
                    <q-th key="country" :props="props">Country</q-th>
                    <q-th key="originASN" :props="props">Origin ASN</q-th>
                    <q-th key="prefix" :props="props">Prefix</q-th>
                    <q-th key="rpkiStatus" :props="props">RPKI</q-th>
                    <q-th key="irrStatus" :props="props">IRR</q-th>
                    <q-th key="delegatedPrefixStatus" :props="props">Prefix</q-th>
                    <q-th key="delegatedASNStatus" :props="props">Origin ASN</q-th>
                    <q-th key="visibility" :props="props">Visibility</q-th>
                    <q-th key="dependencies" :props="props">Main Transits</q-th>
                </q-tr>
            </div>

            <template v-slot:body-cell-country="props">
                <q-td :props="props">
                    <router-link class="IHR_delikify" :to="{ name: 'countries', params: { cc: props.row.country } }">
                        {{ props.row.country }}
                    </router-link>
                </q-td>
            </template>

            <template v-slot:body-cell-prefix="props">
                <q-td :props="props">
                    {{ props.row.prefix.value }}
                    <span class="text-weight-thin float-right">{{ props.row.prefix.descr }}</span>
                </q-td>
            </template>

            <template v-slot:body-cell-originASN="props">
                <q-td :props="props">
                    <router-link
                        class="IHR_delikify"
                        :to="{ name: 'networks', params: { asn: $options.filters.ihr_NumberToAsOrIxp(props.row.originasn.asn) } }"
                    >
                        <span :title="props.row.originasn.name">AS{{ props.row.originasn.asn }}</span>
                    </router-link>
                </q-td>
            </template>

            <template v-slot:body-cell-dependencies="props">
                <q-td :props="props">
                    <span v-for="dep in sorted(props.row.dependencies)" :key="dep.prefix" class="comma">
                        <router-link
                            class="IHR_delikify"
                            :to="{ name: 'networks', params: { asn: $options.filters.ihr_NumberToAsOrIxp(dep.asn) } }"
                        >
                            <span
                                v-if="(dep.hege / props.row.maxHege > 0.5) & (dep.asn != props.row.originasn.asn)"
                                class="text-grey-10"
                                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
                            >
                                <b>AS{{ dep.asn }}</b>
                            </span>
                            <span
                                v-else-if="(dep.hege / props.row.maxHege > 0.1) & (dep.asn != props.row.originasn.asn)"
                                class="text-grey-8"
                                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
                            >
                                AS{{ dep.asn }}
                            </span>
                            <span
                                v-else-if="dep.asn != props.row.originasn.asn"
                                class="text-grey-5"
                                :title="dep.name + '\n' + (dep.hege * 100).toFixed(2) + '%'"
                            >
                                AS{{ dep.asn }}
                            </span>
                        </router-link>
                    </span>
                </q-td>
            </template>

            <template v-slot:body-cell-rpkiStatus="props">
                <q-td :props="props">
                    <span v-if="props.row.rpki_status == 'Invalid'" justify>
                        <q-icon name="fas fa-times" color="red" left />
                        {{ props.row.rpki_status }}
                    </span>
                    <span v-else-if="props.row.rpki_status == 'Invalid,more-specific'">
                        <q-icon name="fas fa-times" color="red" left />
                        Invalid (more specific)
                    </span>
                    <span v-else-if="props.row.rpki_status.startsWith('Valid')">
                        <q-icon name="fas fa-check" color="green" left />
                        {{ props.row.rpki_status }}
                    </span>
                    <span v-else>
                        <q-icon name="fas fa-question" color="grey" left />
                        {{ props.row.rpki_status }}
                    </span>
                </q-td>
            </template>

            <template v-slot:body-cell-irrStatus="props">
                <q-td :props="props">
                    <span v-if="props.row.irr_status == 'Invalid'">
                        <q-icon name="fas fa-times" color="red" left />
                        {{ props.row.irr_status }}
                    </span>
                    <span v-else-if="props.row.irr_status == 'Invalid,more-specific'">
                        <q-icon name="fas fa-times" color="orange" left />
                        Invalid (more specific)
                    </span>
                    <span v-else-if="props.row.irr_status.startsWith('Valid')">
                        <q-icon name="fas fa-check" color="green" left />
                        {{ props.row.irr_status }}
                    </span>
                    <span v-else>
                        <q-icon name="fas fa-question" color="grey" left />
                        {{ props.row.irr_status }}
                    </span>
                </q-td>
            </template>

            <template v-slot:body-cell-delegatedPrefixStatus="props">
                <q-td :props="props">
                    <span
                        color="red"
                        v-if="(props.row.delegated_prefix_status == 'available') | (props.row.delegated_prefix_status == 'reserved')"
                    >
                        <q-icon name="fas fa-times" color="red" left />
                        {{ props.row.delegated_prefix_status }}
                    </span>
                    <span v-else-if="props.row.delegated_prefix_status == 'assigned'">
                        <q-icon name="fas fa-check" color="green" left />
                        {{ props.row.delegated_prefix_status }}
                    </span>
                    <span v-else>
                        <q-icon name="fas fa-question" color="grey" left />
                        {{ props.row.delegated_prefix_status }}
                    </span>
                </q-td>
            </template>

            <template v-slot:body-cell-delegatedASNStatus="props">
                <q-td :props="props">
                    <span
                        color="red"
                        v-if="(props.row.delegated_asn_status == 'available') | (props.row.delegated_asn_status == 'reserved')"
                    >
                        <q-icon name="fas fa-times" color="red" left />
                        {{ props.row.delegated_asn_status }}
                    </span>
                    <span v-else-if="props.row.delegated_asn_status == 'assigned'">
                        <q-icon name="fas fa-check" color="green" left />
                        {{ props.row.delegated_asn_status }}
                    </span>
                    <span v-else>
                        <q-icon name="fas fa-question" color="grey" left />
                        {{ props.row.delegated_asn_status }}
                    </span>
                </q-td>
            </template>
        </q-table>
    </div>
</template>

<script>
import CommonTableMixin from './CommonTableMixin'

export default {
  mixins: [CommonTableMixin],
  props: {
    showCountry: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      pagination: {
        sortBy: 'visibility',
        descending: true,
        page: 1,
        rowsPerPage: 10,
      },
      tabFilter: '',
      columns: [
        {
          name: 'country',
          required: false,
          label: 'Country',
          align: 'center',
          field: row => row.country,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'originASN',
          required: true,
          label: 'ASN',
          align: 'center',
          field: row => row.originasn.asn,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'prefix',
          required: true,
          label: 'Prefix',
          align: 'left',
          field: row => row.prefix.value,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'rpkiStatus',
          required: true,
          label: 'RPKI',
          align: 'left',
          field: row => row.rpki_status,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'irrStatus',
          required: true,
          label: 'IRR',
          align: 'left',
          field: row => row.irr_status,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'delegatedPrefixStatus',
          required: true,
          label: 'Delegated (prefix)',
          align: 'left',
          field: row => row.delegated_prefix_status,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'delegatedASNStatus',
          required: true,
          label: 'Delegated (orig. ASN)',
          align: 'left',
          field: row => row.delegated_asn_status,
          format: val => `${val}`,
          sortable: true,
        },
        {
          name: 'visibility',
          required: true,
          label: 'Visibility',
          align: 'left',
          field: row => row.visibility,
          format: val => `${val.toFixed(1)}%`,
          sortable: true,
        },
        {
          name: 'dependencies',
          required: true,
          label: 'Dependencies',
          align: 'left',
          field: row => this.simpleDependenciesFormat(row.dependencies),
          format: val => `${val}`,
          sortable: true,
        },
      ],
    }
  },
  methods: {
    routeToAsn(asn, row) {
      asn = asn.field(row)
      this.$router.push({
        name: 'networks',
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(asn) },
      })
    },
    getClassByHegemony(hegemony) {
      if (hegemony >= 25) return 'IHR_color-deviation-high-threshold'
      if (hegemony >= 10) return 'IHR_color-deviation-mid-threshold'
      return ''
    },
    visibleColumns() {
      let vcolumns = []
      this.columns.forEach(elem => {
        if ((elem.name != 'country') | this.showCountry) {
          vcolumns.push(elem.name)
        }
      })
      return vcolumns
    },
    sorted(obj) {
      return Object.values(obj).sort((a, b) => b.hege - a.hege)
    },
    simpleDependenciesFormat(val) {
      var txt = ''
      for (const dep in this.sorted(val)) {
        txt += dep.asn
      }
      return txt
    },
  },
}
</script>
<style lang="stylus">
.comma:not(:empty) ~ .comma:not(:empty):before
  content ", ";
</style>
