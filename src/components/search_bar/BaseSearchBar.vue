<template>
  <q-select
    ref="search"
    :dark="dark"
    dense
    standout
    use-input
    hide-selected
    color="black"
    :stack-label="false"
    :label="placeholder"
    v-model="text"
    :options="options"
    @filter="filter"
    class="IHR_search-bar"
  >
    <template v-slot:prepend>
      <q-icon name="fas fa-search" style="font-size: 0.82em; margin-rigth: 4px" />
    </template>
    <template v-slot:no-option>
      <q-item>
        <q-item-section>
          <div v-if="loading">
            <q-spinner color="secondary" size="2em" />
          </div>
          <div class="text-center" v-else>
            {{ $t('searchBar.noResultFound') }}
          </div>
        </q-item-section>
      </q-item>
    </template>

    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps" v-on="scope.itemEvents">
        <slot :elem="scope.opt"> </slot>
      </q-item>
    </template>
    <span slot="loading"></span>
  </q-select>
</template>

<script>
import { debounce } from 'quasar'

const MIN_CHARACTERS = 3
const MAX_RESULTS = 8
const DEFAULT_DEBOUNCE = 500

export default {
  props: {
    dark: {
      type: Boolean,
    },
    value: {
      type: Array,
      required: true,
    },
    placeholder: {
      type: String,
      required: true,
    },
  },
  emits: {
    'input': function(list) {
      if (list !== null) {
        return true;
      } else {
        console.warn('List is missing!');
        return false;
      }
    },
    'search': function(searchValue) {
      if (searchValue !== null) {
        return true;
      } else {
        console.warn('Search Value is missing!');
        return false;
      }
    }
  },
  data() {
    return {
      text: '',
      debouncedSearch: null,
    }
  },
  mounted() {
    this.debouncedSearch = debounce(
      value => {
        this.$emit('input', [])
        this.$emit('search', value)
      },
      DEFAULT_DEBOUNCE,
      false
    )
  },
  methods: {
    filter(value, update) {
      if (value == null) return
      if (value.length >= MIN_CHARACTERS) {
        update(() => {
          // eslint-disable-next-line vue/no-mutating-props
          this.value = null // TODO: need fix
          this.debouncedSearch(value)
        })
      }
    },
  },
  computed: {
    loading() {
      return this.value === null
    },
    options() {
      return this.value === null ? [] : this.value
    },
  },
}

export { MAX_RESULTS }
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
