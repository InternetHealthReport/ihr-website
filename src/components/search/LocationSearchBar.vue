<script setup>
import { QSelect, QIcon, QSpinner, QItem, QItemSection } from 'quasar'
import { NetworkDelayLocation, NetworkQuery } from '@/plugins/IhrApi'
import { ref, inject, watch, defineProps, defineEmits } from 'vue'

const ihr_api = inject('ihr_api')

const MIN_CHARACTERS = 3
const MAX_RESULTS = 100

const props = defineProps({
  dark: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: '',
  },
  hint: {
    type: String,
    default: '',
  },
  selected: {
    type: String,
    default: '',
  },
})

const emits = defineEmits(['select'])

const options = ref([])
const model = ref(props.selected)
const loading = ref(false)
const networkDelayLocation = ref(new NetworkDelayLocation().orderedByName())
const networkQuery = ref(new NetworkQuery().orderedByNumber())

const search = (value, update) => {
  loading.value = true
  options.value = []
  networkQuery.value.mixedContentSearch(value)
  ihr_api.network(
    networkQuery.value,
    result => {
       result.results.some(element => {
        const elem = {
          value: element,
          type: element.number < 0 ? 'IX' : 'AS',
          name: Math.abs(element.number),
          af: 4,
        }
        options.value.push({
          value: elem,
          type: elem.type,
          name: element.name + ' (' + elem.type + elem.name + ')',
          label: elem.type + elem.name,
          asFamily: elem.af,
        })
        update()
        return options.value.length > MAX_RESULTS
      })
      if (options.value.length === 0 ) {
        // Add "No results found" option
        options.value.push({
          value: null,
          name: `No results found for "${value}"`,
          label: `No results found for "${value}"`,
        });
        update()
      }
    },
    error => {
      console.error(error)
    }
  )
  networkDelayLocation.value.name(value)
  ihr_api.network_delay_location(
    networkDelayLocation.value,
    result => {
      result.results.some(element => {
        if (element.type != 'AS' && element.type != 'IX') {
          options.value.push({
            value: element,
            type: element.type,
            name: element.name,
            label: element.name,
            asFamily: element.af,
          })
          update()
        }
        return options.value.length > MAX_RESULTS
      })
      loading.value = false
    },
    error => {
      console.error(error)
    }
  )
}

const selectLocation = (loc) => {
  emits('select', loc)
}

const filter = (value, update, abort) => {
  if (value.length < MIN_CHARACTERS) {
    abort()
  } else {
    search(value, update)
  }
}

watch(() => props.selected, (newValue) => {
  model.value = newValue
})
</script>

<template>
  <QSelect
    :dark="dark"
    use-input
    clearable
    dense
    outlined
    :placeholder="!model?label:''"
    :options="options"
    v-model="model"
    @filter="filter"
    hide-dropdown-icon
    input-debounce="1000"
    class="IHR_search-bar"
    :hint="hint"
  >
    <template v-slot:append>
      <div v-if="!loading">
        <QIcon name="fas fa-search" style="font-size: 0.82em; margin-right: 4px" />
      </div>
      <div v-else>
        <QSpinner color="primary" size="0.82em" />
      </div>
    </template>
    <template v-slot:loading> </template>
    <template v-slot:option="scope">
      <QItem v-bind="scope.itemProps" @click="selectLocation(scope.opt.value)">
        <QItemSection side color="accent">{{ ihr_api.readableType(scope.opt.type) }}</QItemSection>
        <QItemSection class="IHR_asn-element-name">{{ scope.opt.name }}</QItemSection>
      </QItem>
    </template>
  </QSelect>
</template>

<style lang="stylus" scoped>
.IHR_
  &asn-element
    width 100%
    margin 0px
    padding 0px
    &-name
      text-align left
</style>