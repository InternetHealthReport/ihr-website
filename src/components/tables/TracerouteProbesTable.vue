<script setup>
import { QInput, QTable, QSpinner } from 'quasar'
import { ref, computed, watch } from 'vue'
import '@/styles/chart.css'
import { ipAddressSortFunction } from '../../plugins/tracerouteFunctions'

const props = defineProps({
  nodes: {
    type: Object
  },
  allProbes: {
    type: Array
  },
  probeDetailsMap: {
    type: Object
  },
  selectedProbes: {
    type: Array
  },
  isLoading: {
    type: Boolean
  }
})

const emit = defineEmits(['loadMeasurementOnSearchQuery', 'setSelectedProbes'])

const customSort = (rows, sortBy, descending) => {
  const data = [...rows]

  if (sortBy) {
    data.sort((a, b) => {
      const x = descending ? b : a
      const y = descending ? a : b

      if (sortBy === 'probe') {
        return +x[sortBy] > +y[sortBy] ? 1 : +x[sortBy] < +y[sortBy] ? -1 : 0
      } else if (sortBy === 'ipv4') {
        // IP Sort function
        return ipAddressSortFunction(x.address_v4, y.address_v4)
      } else {
        // regular sort
        return x[sortBy] > y[sortBy] ? 1 : x[sortBy] < y[sortBy] ? -1 : 0
      }
    })
  }

  return data
}

const searchQuery = ref('')

const paginatedProbes = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return props.allProbes
    .map((probe) => ({
      probe,
      ...props.probeDetailsMap[probe]
    }))
    .filter((probe) => {
      return ['address_v4', 'address_v6', 'country_code', 'asn_v4', 'asn_v6', 'id'].some(
        (field) => {
          return probe[field] && probe[field].toString().toLowerCase().includes(query)
        }
      )
    })
})

const selectedProbesDetailsList = ref([])

const columns = [
  { name: 'probe', align: 'left', label: 'Probe', field: 'probe', sortable: true },
  { name: 'ipv4', align: 'left', label: 'IPv4 Address', field: 'address_v4', sortable: true },
  { name: 'ipv6', align: 'left', label: 'IPv6 Address', field: 'address_v6', sortable: true },
  {
    name: 'country_code',
    align: 'left',
    label: 'Country Code',
    field: 'country_code',
    sortable: true
  },
  { name: 'asn_v4', align: 'left', label: 'ASN4', field: 'asn_v4', sortable: true },
  { name: 'asn_v6', align: 'left', label: 'ASN6', field: 'asn_v6', sortable: true }
]

watch(
  [() => props.selectedProbes, () => props.allProbes, () => props.probeDetailsMap],
  () => {
    if (!props.allProbes.length) {
      selectedProbesDetailsList.value = []
    }
    paginatedProbes.value.forEach((probe, ind) => {
      if (
        props.selectedProbes.includes(probe.probe) &&
        selectedProbesDetailsList.value.filter((x) => x.probe === probe.probe).length === 0
      ) {
        selectedProbesDetailsList.value.push(paginatedProbes.value[ind])
      }
    })
  },
  { deep: true }
)

watch(selectedProbesDetailsList, (newVal, oldVal) => {
  if (newVal.length !== oldVal.length) {
    emit(
      'setSelectedProbes',
      selectedProbesDetailsList.value.map((probeDetails) => probeDetails.probe)
    )
  }
})
</script>

<template>
  <QInput
    v-model="searchQuery"
    placeholder="Search..."
    @input="emit('loadMeasurementOnSearchQuery')"
  />
  <QTable
    v-model:selected="selectedProbesDetailsList"
    :rows="paginatedProbes"
    :columns="columns"
    row-key="probe"
    flat
    selection="multiple"
    :sort-method="customSort"
  />
  <div v-if="isLoading" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
