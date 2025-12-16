<script setup>
import { QBtn, QTable, QInput, QIcon, QTd, QSpinner, QTooltip, format } from 'quasar'
import { onMounted, ref, watch } from 'vue'
import report from '@/plugins/report'
import Tr from '@/i18n/translation'
import '@/styles/chart.css'

const props = defineProps({
  filteredMessages: {
    type: Array,
    default: () => []
  },
  selectedPeersNumber: {
    type: Number,
    default: 5
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

const selectedPeersModel = ref(
  props.filteredMessages.slice(0, props.selectedPeersNumber).map((obj) => ({ peer: obj.peer }))
)
const search = ref('')

const columns = ref([
  { name: 'peer_asn', label: 'Peer ASN', field: 'peer_asn', align: 'left', sortable: true },
  {
    name: 'peer',
    label: 'Peer IP',
    field: 'peer',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  },
  { name: 'type', label: 'Message Type', field: 'type', align: 'left', sortable: true },
  { name: 'timestamp', label: 'Timestamp', field: 'timestamp', align: 'left', sortable: true },
  {
    name: 'path',
    label: 'AS Path',
    field: 'path',
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
  const communityColumn = {
    name: 'community',
    label: 'Community',
    field: 'community',
    align: 'left',
    sortable: true,
    sort: (a, b) => a.length - b.length
  }
  if (props.dataSource === 'bgplay') {
    const rrcColumn = {
      name: 'rrc',
      label: 'RRC',
      field: 'rrc',
      align: 'left',
      sortable: true,
      format: (val) => Number(val)
    }
    const rpkiStatusColumn = {
      name: 'rpki_status',
      label: 'RPKI Status',
      field: 'rpki_status',
      align: 'left',
      sortable: true
    }
    columns.value.push(...[rpkiStatusColumn, communityColumn, rrcColumn])
  } else {
    columns.value.push(...[communityColumn])
  }
}

watch(
  () => props.dataSource,
  () => {
    addDynamicTableColumns()
  }
)

watch([() => props.selectedPeersNumber, () => props.filteredMessages], () => {
  selectedPeersModel.value = props.filteredMessages
    .slice(0, props.selectedPeersNumber)
    .map((obj) => ({ peer: obj.peer }))
})

watch(selectedPeersModel, () => {
  emit('update-selected-peers', selectedPeersModel.value.length)
})

onMounted(() => {
  addDynamicTableColumns()
})
</script>

<template>
  <QTable
    v-model:selected="selectedPeersModel"
    flat
    :rows="filteredMessages"
    :columns="columns"
    :filter="search"
    row-key="peer"
    selection="multiple"
    style="border-radius: 0px"
  >
    <template #top-left v-if="filteredMessages.length !== 0 && dataSource === 'ris-live'">
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
            <div v-for="(asn, index) in props.row.path" :key="index">
              <RouterLink
                :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${asn}` } })"
                target="_blank"
              >
                <QTooltip v-if="props.row.as_info.length > 0">{{
                  `${props.row.as_info.find((info) => info.asn === asn).asn_name}, ${props.row.as_info.find((info) => info.asn === asn).country_iso_code2}`
                }}</QTooltip>
                {{ asn }}
              </RouterLink>
            </div>
          </template>
          <template v-else>-</template>
        </span>
      </QTd>
    </template>
    <template #body-cell-timestamp="props">
      <QTd class="nowrap" :props="props">{{
        timestampToUTC(props.row.timestamp).slice(0, 16)
      }}</QTd>
    </template>
    <template #body-cell-community="props">
      <QTd :props="props">
        <template v-if="props.row.community.length > 0">
          <pre>{{
            props.row.community
              .map((c) => {
                if (c.description === 'Null') {
                  return `${c.community}, Unknown`
                }
                return `${c.community}, AS${c.comm_1}-${c.description}`
              })
              .join('\n')
          }}</pre>
        </template>
        <template v-else>-</template>
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
