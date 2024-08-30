<script setup>
import { QInput, QCheckbox, QTable, QTd, QTr } from "quasar"
import { ref, computed, watch } from "vue"

const props = defineProps({
  nodes: {
    type: Object,
  },
  allProbes: {
    type: Array
  },
  probeDetailsMap: {
    type: Object
  },
  selectedProbes: {
    type: Array
  }
})

const emit = defineEmits(["loadMeasurementOnSearchQuery", "setSelectedProbes"])

const searchQuery = ref("")
const selectAllProbes = ref(true)
const selectedProbesModel = ref(props.selectedProbes)

const paginatedProbes = computed(() => {
  const query = searchQuery.value.toLowerCase()
  const uniqueProbes = new Set()
  return props.allProbes.map(probe => ({
    probe,
    ...props.probeDetailsMap[probe]
  })).filter(probe => {
    if (uniqueProbes.has(probe.probe)) return false
    uniqueProbes.add(probe.probe)
    return ["address_v4", "address_v6", "country_code", "asn_v4", "asn_v6"].some(field => {
      return probe[field] && probe[field].toString().toLowerCase().includes(query)
    })
  })
})

const columns = [
  { name: "probe", align: "left", label: "Probe", field: "probe" },
  { name: "ipv4", align: "left", label: "IPv4 Address", field: "ipv4" },
  { name: "ipv6", align: "left", label: "IPv6 Address", field: "ipv6" },
  { name: "country_code", align: "left", label: "Country Code", field: "country_code" },
  { name: "asn_v4", align: "left", label: "ASN4", field: "asn_v4" },
  { name: "asn_v6", align: "left", label: "ASN6", field: "asn_v6" }
]

const toggleSelectAll = (value) => {
  if (value) {
    emit("setSelectedProbes", props.allProbes)
  } else {
    emit("setSelectedProbes", [])
  }
}

watch(() => props.nodes, () => {
  selectAllProbes.value = true
})

watch(() => props.selectedProbes, () => {
  selectedProbesModel.value = props.selectedProbes
})

watch(selectedProbesModel, () => {
  emit("setSelectedProbes", selectedProbesModel.value)
})
</script>

<template>
  <QInput v-model="searchQuery" placeholder="Search..." @input="emit('loadMeasurementOnSearchQuery')" :disable="Object.keys(nodes).length < 1" />
  <QTable :rows="paginatedProbes" :columns="columns" row-key="probe" flat>
    <template v-slot:header="props">
      <QTr :props="props">
        <QTd :props="props.colProps" v-for="col in props.cols" :key="col.name">
          <template v-if="col.name === 'probe'">
            <QCheckbox v-model="selectAllProbes" @update:model-value="toggleSelectAll" :disable="Object.keys(nodes).length < 1" />
          </template>
          <template v-else>
            {{ col.label }}
          </template>
        </QTd>
      </QTr>
    </template>
    <template v-slot:body="props">
      <QTr :props="props">
        <QTd>
          <QCheckbox v-model="selectedProbesModel" :val="props.row.probe" :label="props.row.probe" />
        </QTd>
        <QTd>{{ props.row.address_v4 }}</QTd>
        <QTd>{{ props.row.address_v6 }}</QTd>
        <QTd>{{ props.row.country_code }}</QTd>
        <QTd>{{ props.row.asn_v4 }}</QTd>
        <QTd>{{ props.row.asn_v6 }}</QTd>
      </QTr>
    </template>
  </QTable>
</template>