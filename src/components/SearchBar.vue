<template>
  <q-select
    ref="search" :dark="dark" dense standout use-input hide-selected
    color="black" :stack-label="false" :label="placeholder"
    v-model="text" :options="retrievedValues"
    @filter="filter"
    class="IHR_search-bar"
  >
    <template v-slot:prepend>
      <q-icon name="fas fa-search" style="font-size: 0.82em; margin-rigth: 4px;"/>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section>
          <div v-if="beforeQuery">
            <q-spinner color="secondary" size="2em" />
          </div>
          <div class="text-center" v-else>
             0 {{$t("searchBar.resultsFound")}}...
          </div>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:option="scope">
      <q-item
        v-bind="scope.itemProps"
        v-on="scope.itemEvents"
      >
      <slot :asn="scope.opt">
        <router-link :to="{name : 'as_and_ixp', params:{asn: $options.filters.ihr_getAsOrIxp(scope.opt.number) }}" class="IHR_searchbar-routerlink">
          <q-item-section side>
            {{scope.opt.number | ihr_getAsOrIxp}}
          </q-item-section>
          <q-item-section>
            {{scope.opt.name}}
          </q-item-section>
        </router-link>
      </slot>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import { NetworkQuery } from "@/plugins/IhrApi";
import { debounce } from "quasar";

const MIN_CHARACTERS = 3;
const MAX_RESULTS = 8;
const DEFAULT_DEBOUNCE = 500;

export default {
  props: {
    dark: {
      type: Boolean
    }
  },
  data() {
    return {
      text: "",
      debouncedSearch: null,
      minCharacters: MIN_CHARACTERS,
      maxResults: MAX_RESULTS,
      value: null,
      retrievedValues: [],
      networkQuery: (new NetworkQuery()).orderedByNumber(),
      beforeQuery: true
      };
  },
  mounted() {
    this.debouncedSearch = debounce(
      () => {
        this.search();
      },
      DEFAULT_DEBOUNCE,
      false
    );
  },
  methods: {
    filter (value, update) {
      if(value == null)
        return;
      if(value.length > this.minCharacters) {
        update(() => {
          this.value = value;
          this.beforeQuery = true;
          this.debouncedSearch();
        });
      }
    },
    search () {
      this.networkQuery.mixedContentSearch(this.value);
      this.$ihr_api.network(this.networkQuery,
      (result)=> {
        this.retrievedValues = []
        result.results.some(element => {
          this.retrievedValues.push({label: element.number, number: element.number, name: element.name});
          return this.retrievedValues.length > this.maxResults;
        });
        this.beforeQuery = false;
      },
      (error) => {
        console.error(error);
      })
    }
  },
  computed: {
    placeholder() {
      return `ASN, IXP ${this.$t("searchBar.placeholder")}...`;
    }
  }
}
</script>
<style lang="stylus" scoped>
.IHR_
  &search-bar
    width 260px

  &searchbar-routerlink
    text-decoration none

    &:first-child
      margin-right 0px

    & > *
      margin-right 0px
      padding-right 0px
</style>
