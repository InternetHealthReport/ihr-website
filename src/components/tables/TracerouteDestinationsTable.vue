<script setup>
import { QInput, QCheckbox, QTable, QTd, QTr, QSpinner } from 'quasar'
import { ref, computed, watch } from 'vue'
import '@/styles/chart.css'
import { ipAddressSortFunction } from '../../plugins/tracerouteFunctions'

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

const customSort = (rows, sortBy, descending) => {
  const data = [...rows]

  if (sortBy) {
    data.sort((a, b) => {
      const x = descending ? b : a
      const y = descending ? a : b

      if (sortBy === 'destination') {
        // IP Sort function
        return ipAddressSortFunction(x.destination, y.destination)
      } else if (sortBy === 'asn') {
        // numeric sort
        const x_asn = +x.asn
        const y_asn = +y.asn

        return x_asn > y_asn ? 1 : x_asn < y_asn ? -1 : 0
      } else {
        // regular sort
        return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
      }
    })
  }

  return data
}

const destinationSearchQuery = ref('')
const selectAllDestinationsModel = ref(props.selectAllDestinations)
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
  {
    name: 'destination',
    align: 'left',
    label: 'Destination IP',
    field: 'destination',
    sortable: true
  },
  { name: 'asn', align: 'left', label: 'ASN', field: 'asn', sortable: true }
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

watch(
  [() => props.selectedDestinations, () => props.allDestinations],
  () => {
    filteredDestinationRows.value.forEach((destinationDetails, ind) => {
      if (
        props.selectedDestinations.includes(destinationDetails.destination) &&
        selectedDestinationDetailsList.value.filter(
          (x) => x.destination === destinationDetails.destination
        ).length === 0
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
  },
  { deep: true }
)

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
    :sort-method="customSort"
  />
  <div v-if="isLoading" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
