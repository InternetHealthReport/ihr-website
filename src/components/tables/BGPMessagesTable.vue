<script setup>
import { QBtn, QTable, QInput, QIcon, QTd, QSpinner } from 'quasar'
import { onMounted, ref, watch } from 'vue'
import report from '@/plugins/report'
import Tr from '@/i18n/translation'
import '@/styles/chart.css'

const props = defineProps({
  filteredMessages: {
    type: Array,
    default: () => []
  },
  selectedPeers: {
    type: Array,
    default: () => []
  },
  isLiveMode: {
    type: Boolean
  },
  isPlaying: {
    type: Boolean
  },
  dataSource: {
    type: String
  },
  isLoadingBgplayData: {
    type: Boolean
  }
})

const { utcString } = report()

const emit = defineEmits(['enable-live-mode', 'update-selected-peers'])

const selectedPeersModel = ref(props.selectedPeers)
const search = ref('')

const columns = ref([
  { name: 'peer_asn', label: 'Peer ASN', field: 'peer_asn', align: 'left', sortable: true },
  {
    name: 'peer',
    label: 'Peer',
    field: 'peer',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  },
  {
    name: 'path',
    label: 'AS Path',
    field: 'path',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  },
  {
    name: 'as_info',
    label: 'AS Info',
    field: 'as_info',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', align: 'left', sortable: true },
  {
    name: 'community',
    label: 'Community',
    field: 'community',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  }
])

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
}

const enableLiveMode = () => {
  emit('enable-live-mode')
}

const addDynamicTableColumns = () => {
  columns.value = columns.value.filter((col) => col.name !== 'rrc')
  columns.value = columns.value.filter((col) => col.name !== 'rpki_status')
  if (props.dataSource === 'bgplay') {
    const index = columns.value.findIndex((col) => col.name === 'type') //to put rrc column before type comumn
    const rrcColumn = { name: 'rrc', label: 'RRC', field: 'rrc', align: 'left', sortable: true }
    const rpkiStatusColumn = {
      name: 'rpki_status',
      label: 'RPKI Status',
      field: 'rpki_status',
      align: 'left',
      sortable: true
    }
    if (index !== -1) {
      columns.value.splice(index, 0, rrcColumn)
      columns.value.splice(index + 1, 0, rpkiStatusColumn)
    } else {
      columns.value.push(rrcColumn)
      columns.value.push(rpkiStatusColumn)
    }
  }
}

watch(
  () => props.dataSource,
  () => {
    addDynamicTableColumns()
  }
)

watch(
  () => props.selectedPeers,
  () => {
    selectedPeersModel.value = props.selectedPeers
  }
)

watch(selectedPeersModel, () => {
  emit('update-selected-peers', selectedPeersModel.value)
})

onMounted(() => {
  addDynamicTableColumns()
})
</script>

<template>
  <QTable
    v-model:selected="selectedPeersModel"
    flat
    :rows="props.filteredMessages"
    :columns="columns"
    :filter="search"
    row-key="peer"
    selection="multiple"
    style="border-radius: 0px"
  >
    <template #top-left v-if="props.filteredMessages.length !== 0 && dataSource === 'ris-live'">
      <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
      <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    </template>
    <template #top-right>
      <QInput v-model="search" dense outlined debounce="300" color="accent" label="Search">
        <template #append>
          <QIcon name="search" />
        </template>
      </QInput>
    </template>
    <template #body-cell-peer_asn="props">
      <QTd :props="props">
        <RouterLink
          :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${props.row.peer_asn}` } })"
          target="_blank"
        >
          {{ props.row.peer_asn }}
        </RouterLink>
      </QTd>
    </template>
    <template #body-cell-path="props">
      <QTd :props="props">
        <span class="asn-list">
          <template v-if="props.row.path?.length">
            <RouterLink
              v-for="(asn, index) in props.row.path"
              :key="index"
              :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${asn}` } })"
              target="_blank"
            >
              {{ asn + (index < props.row.path.length - 1 ? ',' : '') }}
            </RouterLink>
          </template>
          <template v-else>Null</template>
        </span>
      </QTd>
    </template>
    <template #body-cell-as_info="props">
      <QTd :props="props">
        <template v-if="props.row.as_info.length > 0">
          <pre>{{
            props.row.as_info
              .map((info) => `${info.asn}: ${info.asn_name}, ${info.country_iso_code2}`)
              .join('\n')
          }}</pre>
        </template>
        <template v-else>Null</template>
      </QTd>
    </template>
    <template #body-cell-timestamp="props">
      <QTd class="nowrap" :props="props">{{ timestampToUTC(props.row.timestamp) }}</QTd>
    </template>
    <template #body-cell-community="props">
      <QTd :props="props">
        <template v-if="props.row.community.length > 0">
          <pre>{{
            props.row.community
              .map((c) => `${c.community}, AS${c.comm_1}-${c.description}`)
              .join('\n')
          }}</pre>
        </template>
        <template v-else> Null </template>
      </QTd>
    </template>
  </QTable>
  <div v-if="isLoadingBgplayData" class="IHR_loading-spinner">
    <QSpinner color="secondary" size="15em" />
  </div>
</template>

<style scoped>
.asn-list {
  display: flex;
  gap: 5px;
}
.nowrap {
  white-space: nowrap !important;
}
</style>
