<template>
  <q-select
    ref="search" dark dense standout use-input hide-selected
    class="GL__toolbar-select"
    color="black" :stack-label="false" :label="placeholder"
    v-model="text" :options="retrievedValues"
    @filter="filter"
    style="width: 300px"
  >
    <template v-slot:prepend>
      <q-icon name="fas fa-search" style="font-size: 0.82em; margin-rigth: 4px;"/>
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section>
          <div class="text-center">
             0 {{$t("searchBar.resultsFound")}}...
          </div>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:option="scope">
      <q-item
        v-bind="scope.itemProps"
        v-on="scope.itemEvents"
        class="GL__select-GL__menu-link"
      >
      <router-link :to="{name : 'as_and_ixp', params:{asn: asnOrIxp(scope.opt.number)}}" class="IHR_searchbar-routerlink">
        <q-item-section side>
          {{$ihr_api.getAsOrIxp(scope.opt.number)}}
        </q-item-section>
        <q-item-section>
          {{scope.opt.name}}
        </q-item-section>
      </router-link>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import { NetworksQuery } from "@/plugins/IhrApi";
import { debounce } from "quasar";

const MIN_CHARACTERS = 3;
const MAX_RESULTS = 8;
const DEFAULT_DEBOUNCE = 500;

export default {
  data() {
    return {
      text: "",
      debouncedSearch: null,
      minCharacters: MIN_CHARACTERS,
      maxResults: MAX_RESULTS,
      value: null,
      retrievedValues: [],
      networksQuery: (new NetworksQuery()).orderedByNumber()
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
      //TODO debounce filter!
      if(value.length > this.minCharacters) {
        update(() => {
          this.value = value;
          this.debouncedSearch();
        });
      }
    },
    search () {
      this.networksQuery.mixedContentSearch(this.value);
      this.$ihr_api.networks(this.networksQuery,
      (result)=> {
        this.retrievedValues = []
        result.results.some(element => {
          this.retrievedValues.push({label: element.number, number: element.number, name: element.name, url: `https://ihr.iijlab.net/ihr/${element.number}/asn/`});
          return this.retrievedValues.length > this.maxResults;
        });
      },
      (error) => {
        console.error(error);
      })
    },
    asnOrIxp(value) {
      return (value < 0)? "IXP" : "AS" + Math.abs(value);
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
  &searchbar-routerlink
    text-decoration none

    &:first-child
      margin-right 0px
    
    & > *
      margin-right 0px
      padding-right 0px 
</style>
