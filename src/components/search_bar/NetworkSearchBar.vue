<template>
  <q-select
    :value="model"
    outlined
    dense
    use-input
    :label="placeholder"
    :options="options"
    @filter="filter"
    hide-dropdown-icon
    input-debounce="1000"
    :bg-color="bg"
    :label-color="label"
    :input-class="input"
  >
    <template v-slot:append>
      <div v-if="!loading">
        <q-icon :color="label" name="fas fa-search q-mb-xs" width="0.82em" />
      </div>
      <div v-else>
        <q-spinner :color="label" size="0.82em" />
      </div>
    </template>
    <template v-slot:loading> </template>
    <template v-slot:option="scope">
      <q-item v-if="scope.opt.type == 'asn'" v-bind="scope.itemProps" v-on="scope.itemEvents" @click="gotoASN(scope.opt.value)">
        <q-item-section side color="accent">{{ scope.opt.value | ihr_NumberToAsOrIxp }}</q-item-section>
        <q-item-section class="IHR_asn-element-name">{{ scope.opt.name }}</q-item-section>
      </q-item>
      <q-item
        v-else-if="scope.opt.type == 'country'" v-bind="scope.itemProps" v-on="scope.itemEvents" @click="gotoCountry(scope.opt.value)">     
        <q-item-section side color="accent"> Country </q-item-section>
        <q-item-section class="IHR_asn-element-name">{{ scope.opt.name }}</q-item-section>
      </q-item>
      <q-item>
        v-else-if="scope.opt.type == 'prefix'" v-bind= ="scope.itemProps" v-on="scope.itemEvents" @click="$event =>gotoPrefix(scope.opt.value)">
        <q-item-selection side color="accent">Prefix</q-item-selection>
        <q-item-selection class="IHR_asn-element-name">{{ scope.opt.name }}</q-item-selection>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import { NetworkQuery, CountryQuery } from '@/plugins/IhrApi';
import IhrQuery from '@/plugins/query/IhrQuery.js';

const MIN_CHARACTERS = 3
const MAX_RESULTS = 10

export default {
  props: {
    bg: {
      type: String,
      default: 'accent',
    },
    labelTxt: {
      type: String,
    },
    label: {
      type: String,
      default: 'grey-5',
    },
    input: {
      type: String,
      default: 'text-white text-weight-bold q-mt-xs',
    },
    noAS: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      options: [{ name: 'Suggestions' }, { label: 2497, value: 2497, name: 'IIJ' }],
      model: [],
      loading: false,
      always: false,
      networkQuery: new NetworkQuery().orderedByNumber(),
      countryQuery: new CountryQuery().orderedByCode(),
    }
  },
  methods: {
    search(value, update) {
      this.loading = true
      this.options = []
      if (value.includes('/')) {
        const prefixQuery = { prefix: value }
        this.$ihr_api.prefixes(prefixQuery, result => {
          result.results.some(element => {
            this.options.push({
              value: element.prefix,
              name: element.country,
              type: 'prefix',
            })
            update()
            return this.options.length > MAX_RESULTS
          })
          this.loading = false;
          window.location.href = 'prefixResults.html';
        }, error => {
          // eslint-disable-next-line no-console
          console.error(error)
        })
      }
      this.countryQuery.containsName(value)
      this.$ihr_api.country(this.countryQuery, result => {
        result.results.some(element => {
          this.options.push({
            value: element.code,
            name: element.name,
            type: 'country',
          })
          update()
        })
      })
      if (!this.noAS) {
        this.networkQuery.mixedContentSearch(value)
        this.$ihr_api.network(
          this.networkQuery,
          result => {
            result.results.some(element => {
              this.options.push({
                value: element.number,
                name: element.name,
                type: 'asn',
              })
              update()
              return this.options.length > MAX_RESULTS
            })
          },
          error => {
            // eslint-disable-next-line no-console
            console.error(error)
          }
        )
      }
      if (prefix) {
        const query = new IhrQuery()
        query.hegemonyPrefix(prefix)
        this.$ihr_api.hegemonyPrefix(query, result => {
          result.results.some(element => {
            const countryCode = element.country_code
            const rpki = element.rpki
            const irr = element.irr
            const delegatedStatus = element.delegated_status
            // display in table form in the html
            const asDependencies = element.as_dependencies
            //use this data for the graph
            this.options.push({
              value: element.prefix,
              name: element.description,
              type: 'prefix',
            })
            update()
            return this.options.length > MAX_RESULTS
          })
          this.loading = false
        })
      }
    },
    gotoPrefix(code) {
      this.$router.push({
        name: 'prefixes',
        params: { prefix: code },
      })
    },
    gotoASN(number) {
      this.$router.push({
        name: 'networks',
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(number) },
      })
    },
    gotoCountry(code) {
      this.$router.push({
        name: 'countries',
        params: { cc: code },
      })
    },
    filter(value, update, abort) {
      if (value.length < MIN_CHARACTERS) {
        abort()
      } else {
        this.search(value, update)
      }
    },
  },
  computed: {
    placeholder() {
      if (this.labelTxt == null) return `${this.$t('searchBar.placeholder')}`

      return this.labelTxt
    },
  },
}
</script>
<style lang="stylus" scoped>
.IHR_
  &asn-element
    width 100%
    margin 0px
    padding 0px
    &-name
      text-align left
      margin-left 10px

.IHR_search-bar
  text-color 'white'
  color 'white'
  input white
</style>
