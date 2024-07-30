<script setup>
import { QBtn, QTable, QInput, QIcon, QTd } from 'quasar'
import { ref, onMounted, computed, watch } from 'vue'
import report from '@/plugins/report'
import Tr from '@/i18n/translation'

const props  = defineProps({
  filteredMessages: {
		type: Array,
    default: () => [],
	},
	selectedPeers: {
		type: Array,
		default: () => [],
	},
	bgpMessageType: {
		type: Function
	},
  isLiveMode: {
		type: Boolean
	},
	isPlaying: {
		type: Boolean
	}
})

const { utcString } = report()

const emit = defineEmits(['enable-live-mode', 'update-selected-peers'])

const selectedPeersModel = ref(props.selectedPeers)
const search = ref('')
const columns = ref([
  {
    name: 'peer_asn',
    required: true,
    label: 'Peer ASN',
    align: 'left',
    field: 'peer_asn'
  },
  {
    name: 'peer',
    align: 'left',
    label: 'Peer',
    field: 'peer'
  },
  {
    name: 'path',
    label: 'AS Path',
    field: 'path',
    align: 'left'
  },
  {
    name: 'as_info',
    label: 'AS Info',
    field: 'as_info',
    align: 'left'
  },
  {
    name: 'type',
    label: 'Type',
    field: 'type',
    align: 'left'
  },
  {
    name: 'timestamp',
    label: 'Timestamp',
    field: 'timestamp',
    align: 'left'
  },
  {
    name: 'community',
    label: 'Community',
    field: 'community',
    align: 'left'
  }
])

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
}

const enableLiveMode = () => {
	emit('enable-live-mode')
}

const rows = computed(() =>
  props.filteredMessages.map((message) => ({
    peer_asn: message.peer_asn,
    peer: message.peer,
    path: message.path?.length > 0 ? message.path : null,
    as_info:
      message.as_info?.length > 0
        ? message.as_info
            .map((info) => `${info.asn}: ${info.asn_name}, ${info.country_iso_code2}`)
            .join('\n')
        : 'Null',
    type: props.bgpMessageType(message),
    timestamp: timestampToUTC(message.floor_timestamp),
    community:
      message.community?.length > 0
        ? message.community
            .map((c) => `${c.community}, AS${c.comm_1}-${c.description}`)
            .join('\n')
        : 'Null'
  }))
)

watch(selectedPeersModel, () => {
  emit('update-selected-peers', selectedPeersModel.value)
})

onMounted(() => {
  
})
</script>

<template>
  <QTable
    flat
    :rows="rows"
    :columns="columns"
    :filter="search"
    row-key="peer"
    selection="multiple"
    v-model:selected="selectedPeersModel"
  >
    <template v-slot:top-left>
      <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
    <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    </template>
    <template v-slot:top-right>
      <QInput dense outlined debounce="300" color="accent" label="Search" v-model="search">
        <template v-slot:append>
          <QIcon name="search" />
        </template>
      </QInput>
    </template>
    <template v-slot:body-cell-peer_asn="props">
      <QTd :props="props">
        <RouterLink
          :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${props.row.peer_asn}` } })"
          target="_blank"
        >
          {{ props.row.peer_asn }}
        </RouterLink>
      </QTd>
    </template>
    <template v-slot:body-cell-path="props">
      <QTd :props="props">
        <span class="asn-list">
          <template v-if="props.row.path">
            <span v-for="(asn, index) in props.row.path" :key="index">
              <RouterLink
                :to="Tr.i18nRoute({ name: 'network', params: { id: `AS${asn}` } })"
                target="_blank"
              >
                {{ asn }}
              </RouterLink>
              <span v-if="index < props.row.path.length - 1">&nbsp;</span>
            </span>
          </template>
          <template v-else> Null </template>
        </span>
      </QTd>
    </template>
    <template v-slot:body-cell-as_info="props">
      <QTd :props="props">
        <pre>{{ props.row.as_info }}</pre>
      </QTd>
    </template>
    <template v-slot:body-cell-community="props">
      <QTd :props="props">
        <pre>{{ props.row.community }}</pre>
      </QTd>
    </template>
  </QTable>
</template>

<style>
.asn-list {
  display: inline-flex;
  flex-wrap: nowrap;
}
.asn-list > span {
  display: inline;
}
</style>