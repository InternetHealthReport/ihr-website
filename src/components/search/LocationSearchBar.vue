<script setup>
import { QSelect, QIcon, QSpinner, QItem, QItemSection } from 'quasar'
import { NetworkDelayLocation, NetworkQuery } from '@/plugins/IhrApi'
import { ref, inject, watch } from 'vue'

const ihr_api = inject('ihr_api')

const MIN_CHARACTERS = 3
const MAX_RESULTS = 100

const props = defineProps({
  dark: {
    type: Boolean,
    default: false
  },
  label: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  selected: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  peeringdbId: {
    type: Number,
    default: -1
  }
})

const emits = defineEmits({
  select: function (location) {
    if (location !== null) {
      return true
    } else {
      console.warn('Location is missing!')
      return false
    }
  }
})

const options = ref([])
let modelInit
if (!props.readonly) {
  modelInit = props.selected
} else {
  if (props.peeringdbId !== -1) {
    modelInit = `IXP${props.peeringdbId}`
  } else {
    modelInit = props.selected
  }
}
const model = ref(modelInit)
const loading = ref(false)
const always = ref(false)
const networkDelayLocation = ref(new NetworkDelayLocation().orderedByName())
const networkQuery = ref(new NetworkQuery().orderedByNumber())

const search = (value, update) => {
  loading.value = true
  options.value = []
  networkQuery.value.mixedContentSearch(value)
  ihr_api.network(
    networkQuery.value,
    (result) => {
      result.results.some((element) => {
        const elem = {
          value: element,
          type: element.number < 0 ? 'IX' : 'AS',
          name: Math.abs(element.number),
          af: 4
        }
        options.value.push({
          value: elem,
          type: elem.type,
          name: element.name + ' (' + elem.type + elem.name + ')',
          label: elem.type + elem.name,
          asFamily: elem.af
        })
        update()
        return options.value.length > MAX_RESULTS
      })
    },
    (error) => {
      console.error(error)
    }
  )
  networkDelayLocation.value.name(value)
  ihr_api.network_delay_location(
    networkDelayLocation.value,
    (result) => {
      result.results.some((element) => {
        if (element.type != 'AS' && element.type != 'IX') {
          options.value.push({
            value: element,
            type: element.type,
            name: element.name,
            label: element.name,
            asFamily: element.af
          })
          update()
        }
        return options.value.length > MAX_RESULTS
      })
      loading.value = false
    },
    (error) => {
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

watch(
  () => props.selected,
  (newValue) => {
    if (!props.readonly) {
      model.value = newValue
    }
  }
)
</script>

<template>
  <QSelect
    v-model="model"
    :dark="dark"
    use-input
    clearable
    dense
    outlined
    :placeholder="!model ? label : ''"
    :options="options"
    hide-dropdown-icon
    input-debounce="1000"
    class="IHR_search-bar"
    :hint="hint"
    :readonly="readonly"
    @filter="filter"
  >
    <template #append>
      <div v-if="!loading">
        <QIcon v-if="!readonly" name="fas fa-search" style="font-size: 0.82em; margin-right: 4px" />
      </div>
      <div v-else>
        <QSpinner color="primary" size="0.82em" />
      </div>
    </template>
    <template #loading />
    <template #option="scope">
      <QItem v-bind="scope.itemProps" @click="selectLocation(scope.opt.value)">
        <QItemSection side color="accent">
          {{ ihr_api.readableType(scope.opt.type) }}
        </QItemSection>
        <QItemSection class="IHR_asn-element-name">
          {{ scope.opt.name }}
        </QItemSection>
      </QItem>
    </template>
  </QSelect>
</template>

<style scoped>
.IHR_asn-element {
  width: 100%;
  margin: 0px;
  padding: 0px;
}
.IHR_asn-element-name {
  text-align: left;
}
</style>
