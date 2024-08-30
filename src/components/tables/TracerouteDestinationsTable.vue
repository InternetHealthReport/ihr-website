<script setup>
import { QInput, QCheckbox, QTable, QTd, QTr } from "quasar"
import { ref, computed, watch } from 'vue'

const props = defineProps({
  nodes: {
    type: Object,
  },
  allDestinations: {
    type: Array,
  },
  selectAllDestinations: {
    type: Boolean
  },
  ipToAsnMap: {
    type: Object
  },
  selectedDestinations: {
    type: Array
  }
})

const emit = defineEmits(["loadMeasurementOnSearchQuery", "setSelectedDestinations"])

const destinationSearchQuery = ref("")
const selectAllDestinationsModel = ref(props.selectAllDestinations)
const selectDestinationsModel = ref(props.selectedDestinations)

const filteredDestinationRows = computed(() => {
  const query = destinationSearchQuery.value.toLowerCase()
  return destinationRows.value.filter(row => {
    return ["destination", "ip", "asn"].some(field => {
      return row[field] && row[field].toString().toLowerCase().includes(query)
    })
  })
})

const toggleSelectAllDestinations = (value) => {
  if (value) {
    emit("setSelectedDestinations", props.allDestinations)
  } else {
    emit("setSelectedDestinations", [])
  }
}

const destinationColumns = [
  { name: "destination", align: "left", label: "Destination IP", field: "destination" },
  { name: "ip", align: "left", label: "IP Address", field: "ip" },
  { name: "asn", align: "left", label: "ASN", field: "asn" },
]

const destinationRows = computed(() => {
  return props.allDestinations.map(destination => {
    const nodeInfo = props.nodes[destination] || { label: destination }
    const asn = props.ipToAsnMap[nodeInfo.label] || "unknown"

    return {
      destination: destination,
      ip: nodeInfo.label,
      asn: asn,
    }
  })
})

watch(() => props.nodes, () => {
  selectAllDestinationsModel.value = true
})

watch(() => props.selectedDestinations, () => {
  selectDestinationsModel.value = props.selectedDestinations
})

watch(selectDestinationsModel, () => {
  emit("setSelectedDestinations", selectDestinationsModel.value)
})
</script>

<template>
  <QInput v-model="destinationSearchQuery" placeholder="Search destinations..." @input="emit('loadMeasurementOnSearchQuery')" :disable="Object.keys(nodes).length < 1" />
  <QTable :rows="filteredDestinationRows" :columns="destinationColumns" row-key="destination" flat>
    <template v-slot:header="props">
      <QTr :props="props">
        <QTd :props="props.colProps" v-for="col in props.cols" :key="col.name">
          <template v-if="col.name === 'destination'">
            <QCheckbox v-model="selectAllDestinationsModel" @update:model-value="toggleSelectAllDestinations" :disable="Object.keys(nodes).length < 1" />
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
          <QCheckbox v-model="selectDestinationsModel" :val="props.row.destination" :label="props.row.destination" />
        </QTd>
        <QTd>{{ props.row.ip }}</QTd>
        <QTd>{{ props.row.asn }}</QTd>
      </QTr>
    </template>
  </QTable>
</template>