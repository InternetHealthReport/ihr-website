<template>
  <q-select
    outlined
    dense 
    use-input
    :label="placeholder"
    :options="options"
    @filter="filter"
    hide-dropdown-icon
    input-debounce="1000"
    bg-color='accent'
    label-color='grey-5'
    input-class='text-white text-weight-bold'
  >
    <template v-slot:append>
        <div v-if="!loading">
            <q-icon color='grey-5' name="fas fa-search" style="font-size: 0.80em; margin: 2px;"/>
        </div>
        <div v-else>
              <q-spinner color="primary" size="0.82em" />
        </div>
    </template>
    <template v-slot:loading> </template>
    <template v-slot:option="scope">
        <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
            @click="gotoASN(scope.opt.value)" 
          >
          <q-item-section side color='accent'>{{scope.opt.value | ihr_NumberToAsOrIxp}}</q-item-section>
          <q-item-section class="IHR_asn-element-name">{{scope.opt.name}}</q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script>
import { NetworkQuery } from "@/plugins/IhrApi";

const MIN_CHARACTERS = 3;
const MAX_RESULTS = 10;

export default {
  props: {
    dark: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
        options: [
            {name: "Suggestions"},
            {label: 2497,
            value: 2497,
            name: "IIJ"}],
        model: null,
        loading: false,
        always: false,
      networkQuery: new NetworkQuery().orderedByNumber()
    };
  },
  methods: {
    search(value, update) {
      this.loading = true;
      this.options=[];
      this.networkQuery.mixedContentSearch(value);
      this.$ihr_api.network(
        this.networkQuery,
        result => {
          result.results.some(element => {
            this.options.push({
              value: element.number,
              name: element.name
            });
            update();
            return this.options.length > MAX_RESULTS;
          });
          this.loading = false;
        },
        error => {
          console.error(error);
        }
      );
    },
    gotoASN(number) {
      this.$router.push({
        name: "networks",
        params: { asn: this.$options.filters.ihr_NumberToAsOrIxp(number) }
      });
    },
    filter (value, update, abort) {
      if(value.length < MIN_CHARACTERS) {
        abort();
      }
      else{
        this.search(value, update)
      }
    }
  },
  computed: {
    placeholder() {
      return `${this.$t("searchBar.placeholder")}`;
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

.IHR_search-bar
  text-color 'white'
  color 'white'
  input white
</style>
