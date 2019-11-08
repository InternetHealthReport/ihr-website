<template>
  <base-search-bar
    :dark="dark"
    :placeholder="placeholder"
    v-model="retrievedValues"
    @search="search"
  >
    <template v-slot:default="scope">
      <slot :asn="scope.elem">
        <q-btn @click="gotoASN(scope.elem.number)" flat class="IHR_asn-element">
          <q-item-section side>{{scope.elem.number | ihr_NumberToAsOrIxp}}</q-item-section>
          <q-item-section class="IHR_asn-element-name">{{scope.elem.name}}</q-item-section>
        </q-btn>
      </slot>
    </template>
  </base-search-bar>
</template>

<script>
import BaseSearchBar, { MAX_RESULTS } from "./BaseSearchBar";
import { NetworkQuery } from "@/plugins/IhrApi";

export default {
  components: { BaseSearchBar },
  props: {
    dark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      retrievedValues: [],
      networkQuery: new NetworkQuery().orderedByNumber()
    };
  },
  methods: {
    search(value) {
      this.networkQuery.mixedContentSearch(value);
      this.$ihr_api.network(
        this.networkQuery,
        result => {
          result.results.some(element => {
            this.retrievedValues.push({
              label: element.number,
              number: element.number,
              name: element.name
            });
            return this.retrievedValues.length > MAX_RESULTS;
          });
        },
        error => {
          console.error(error);
        }
      );
    },
    gotoASN(number) {
      this.$router.push({
        name: "as_and_ixp",
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(number) }
      });
    }
  },
  computed: {
    placeholder() {
      return `ASN or IXP ${this.$t("searchBar.placeholder")}...`;
    }
  }
};
</script>
<style lang="stylus" scoped>
.IHR_
  &asn-element
    width 100%
    margin 0px
    padding 0px
    &-name
      text-align left

</style>
