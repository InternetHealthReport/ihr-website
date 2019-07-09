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
      <q-item-section side>
        {{(scope.opt.number < 0)? "IXP" : "ASN" + scope.opt.number}}
      </q-item-section>
      <q-item-section>
        {{scope.opt.name}}
      </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import { NetworkQuery } from "@/plugins/IhrApi";

const minCharacters = 3;
const maxResults = 8;

export default {
  data() {
    return {
      text: "",
      minCharacters: minCharacters,
      maxResults: maxResults,
      retrievedValues: [],
      networkQuery: (new NetworkQuery()).orderedByNumber()
      };
  },
  methods: {
    filter (value, update) {
      if(value == null)
        return;
      //TODO debounce filter!
      if(value.length > this.minCharacters) {
        update(() => {
          this.networkQuery.mixedContentSearch(value);
          this.search();
        });
      }
    },
    search () {
      this.$ihr_api.networks(this.networkQuery,
      (result)=> {
        this.retrievedValues = []
        console.log(result)
        result.results.some(element => {
          this.retrievedValues.push({label: element.number, number: element.number, name: element.name, url: `https://ihr.iijlab.net/ihr/${element.number}/asn/`});
          return this.retrievedValues.length > this.maxResults;
        });
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

<style>

</style>