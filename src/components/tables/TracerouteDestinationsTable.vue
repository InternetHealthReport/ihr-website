<script setup>
import { QInput, QCheckbox, QTable, QTd, QTr, QSpinner } from 'quasar'
import { ref, computed, watch } from 'vue'
import '@/styles/chart.css'

const props = defineProps({
  nodes: {
    type: Object
  },
  allDestinations: {
    type: Array
  },
  selectAllDestinations: {
    type: Boolean
  },
  ipToAsnMap: {
    type: Object
  },
  selectedDestinations: {
    type: Array
  },
  isLoading: {
    type: Boolean
  }
})

const emit = defineEmits([
  'loadMeasurementOnSearchQuery',
  'setSelectedDestinations',
  'setSelectAllDestinations'
])

const destinationSearchQuery = ref('')
const selectAllDestinationsModel = ref(props.selectAllDestinations)
const selectDestinationsModel = ref(props.selectedDestinations)
const selectedDestinationDetailsList = ref([])

const filteredDestinationRows = computed(() => {
  const query = destinationSearchQuery.value.toLowerCase()
  return destinationRows.value.filter((row) => {
    return ['destination', 'ip', 'asn'].some((field) => {
      return row[field] && row[field].toString().toLowerCase().includes(query)
    })
  })
})

const toggleSelectAllDestinations = (value) => {
  if (value) {
    emit('setSelectedDestinations', props.allDestinations)
    emit('setSelectAllDestinations', true)
  } else {
    emit('setSelectedDestinations', [])
    emit('setSelectAllDestinations', false)
  }
}

const destinationColumns = [
  { name: 'destination', align: 'left', label: 'Destination IP', field: 'destination' },
  { name: 'ip', align: 'left', label: 'IP Address', field: 'ip' },
  { name: 'asn', align: 'left', label: 'ASN', field: 'asn' }
]

const destinationRows = computed(() => {
  return props.allDestinations.map((destination) => {
    const nodeInfo = props.nodes[destination] || { label: destination }
    const asn = props.ipToAsnMap[nodeInfo.label] || 'unknown'

    return {
      destination: destination,
      ip: nodeInfo.label,
      asn: asn
    }
  })
})

watch(
  () => props.nodes,
  () => {
    if (selectAllDestinationsModel.value === true) {
      emit('setSelectedDestinations', props.allDestinations)
    }
  }
)

watch([() => props.selectedDestinations, () => props.allDestinations], () => {
  // selectDestinationsModel.value = props.selectedDestinations
  filteredDestinationRows.value.forEach((destinationDetails, ind) => {
    if (
      props.selectedDestinations.includes(destinationDetails.destination) &&
      selectedDestinationDetailsList.value.filter((x) => x.destination === destinationDetails.destination).length === 0
    ) {
      selectedDestinationDetailsList.value.push(filteredDestinationRows.value[ind])
    }
  })
  if (props.selectedDestinations.length === props.allDestinations.length) {
    selectAllDestinationsModel.value = true
  } else if (props.selectedDestinations.length === 0) {
    selectAllDestinationsModel.value = false
  } else {
    selectAllDestinationsModel.value = null
  }

  emit('setSelectAllDestinations', selectAllDestinationsModel.value)
}, {deep: true})

// watch(selectDestinationsModel, () => {
//   emit('setSelectedDestinations', selectDestinationsModel.value)
// })

watch(selectedDestinationDetailsList, (newVal, oldVal) => {
  if (newVal.length !== oldVal.length) {
    emit(
      'setSelectedDestinations',
      selectedDestinationDetailsList.value.map((destination) => destination.destination)
    )
  }
})
</script>

<template>
  <QInput
    v-model="destinationSearchQuery"
    placeholder="Search destinations..."
    @input="emit('loadMeasurementOnSearchQuery')"
  />
  <QTable 
    v-model:selected="selectedDestinationDetailsList"
    :rows="filteredDestinationRows" 
    :columns="destinationColumns" 
    row-key="destination" 
    flat
    selection="multiple"
  >
    <!-- <template #header="props">
      <QTr :props="props">
        <QTd v-for="col in props.cols" :key="col.name" :props="props.colProps">
          <template v-if="col.name === 'destination'">
            <QCheckbox
              v-model="selectAllDestinationsModel"
              toggle-order="ft"
              @update:model-value="toggleSelectAllDestinations"
            />
          </template>
          <template v-else>
            {{ col.label }}
          </template>
        </QTd>
      </QTr>
    </template>
    <template #body="props">
      <QTr :props="props">
        <QTd>
          <QCheckbox
            v-model="selectDestinationsModel"
            :val="props.row.destination"
            :label="props.row.destination"
          />
        </QTd>
        <QTd>{{ props.row.ip }}</QTd>
        <QTd>{{ props.row.asn }}</QTd>
      </QTr>
    </template> -->
  </QTable>
  <div v-if="isLoading" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
