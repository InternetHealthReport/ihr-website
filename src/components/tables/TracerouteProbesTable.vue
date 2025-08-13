<script setup>
import { QInput, QTable, QSpinner } from 'quasar'
import { ref, computed, watch, onMounted } from 'vue'
import '@/styles/chart.css'

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
  { name: 'ipv4', align: 'left', label: 'IPv4 Address', field: 'address_v4' },
  { name: 'ipv6', align: 'left', label: 'IPv6 Address', field: 'address_v6' },
  { name: 'country_code', align: 'left', label: 'Country Code', field: 'country_code' },
  { name: 'asn_v4', align: 'left', label: 'ASN4', field: 'asn_v4' },
  { name: 'asn_v6', align: 'left', label: 'ASN6', field: 'asn_v6' }
]

const toggleSelectAll = (value) => {
  if (value) {
    emit('setSelectedProbes', props.allProbes)
  } else {
    emit('setSelectedProbes', [])
  }
}

watch(
  [() => props.selectedProbes, () => props.allProbes, () => props.probeDetailsMap],
  () => {
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
  />
  <div v-if="isLoading" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>
