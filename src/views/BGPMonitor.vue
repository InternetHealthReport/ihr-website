<script setup>
import { QBtn, QSelect, QInput, QSlider, QTable, QIcon, QTd, QCheckbox, uid } from 'quasar'
import { computed, onMounted, ref, watch, unref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import Plotly from 'plotly.js-dist'
import axios from 'axios'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import i18n from '@/i18n'
import { getASNamesCountryMappings } from '../plugins/AsNames'
import report from '@/plugins/report'
import BGPPathsChart from '@/components/charts/BGPPathsChart.vue'
import BGPLineChart from '@/components/charts/BGPLineChart.vue'

const { utcString } = report()
const { t } = i18n.global

const maxHops = ref(9)
const isPlaying = ref(false)
const rrcList = ref([])
const disableButton = ref(false)
const socket = ref(null)
const rawMessages = ref([])
const filteredMessages = ref([])
const uniquePeerMessages = new Map()


const sankeyChart = ref(null)
const search = ref('')
const selectedPeers = ref([])
const defaultSelectedPeerCount = ref(5)
const communities = ref([])
const isLiveMode = ref(true)

const selectedMaxTimestamp = ref(0)
const usedMessagesCount = ref(0)
const lineChart = ref(null)


const asNames = ref({})

const params = ref({
  peer: '',
  path: '',
  prefix: '202.164.222.0/24', //2600:40fc:1004::/48 , 196.249.102.0/24 , 170.238.225.0/24
  type: 'UPDATE',
  require: '',
  moreSpecific: false,
  lessSpecific: false,
  host: '',
  socketOptions: {
    includeRaw: false,
    acknowledge: false
  }
})

const route = useRoute()
const router = useRouter()

const toggleConnection = () => {
  isPlaying.value = !isPlaying.value
}

const resetData = () => {
  isPlaying.value = false
  rawMessages.value = []
  filteredMessages.value = []
  uniquePeerMessages.clear()

  search.value = ''
  selectedPeers.value = []
  defaultSelectedPeerCount.value = 5
  isLiveMode.value = true
  // minTimestamp.value = Infinity
  // maxTimestamp.value = -Infinity
  selectedMaxTimestamp.value = 0
  usedMessagesCount.value = 0
  // announcementsCount.value = {}
  withdrawalsCount.value = {}
  // chartData.value[0].x = []
  // chartData.value[0].y = []
  // chartData.value[1].x = []
  // chartData.value[1].y = []
  // removeVerticalLine()
}

const initRoute = () => {
  const query = { ...route.query }
  if (route.query.prefix) {
    params.value.prefix = route.query.prefix
  } else {
    query.prefix = params.value.prefix
  }
  if (route.query.maxHops) {
    maxHops.value = parseInt(route.query.maxHops)
  } else {
    query.maxHops = maxHops.value
  }
  if (route.query.rrc) {
    params.value.host = route.query.rrc
  } else {
    query.rrc = params.value.host
  }
  router.replace({ query })
}

const connectWebSocket = () => {
  socket.value = new WebSocket(`wss://ris-live.ripe.net/v1/ws/?client=ihr_${uid()}`)
  if (socket.value.readyState === WebSocket.CONNECTING) {
    disableButton.value = true
  }
  socket.value.onopen = () => {
    disableButton.value = false
    toggleRisProtocol()
  }
  socket.value.onclose = () => {
    socket.value = null
    if (isPlaying.value) {
      isPlaying.value = false
    }
  }
  socket.value.onerror = (error) => {
    console.log('WebSocket Error:', error)
    disableButton.value = false
    if (isPlaying.value) {
      isPlaying.value = false
    }
  }
  socket.value.onmessage = (event) => {
    const res = JSON.parse(event.data)
    if (res.type === 'ris_message') {
      handleMessages(res.data)
    } else if (res.type === 'ris_rrc_list') {
      handleRRC(res.data)
    } else if (res.type === 'ris_error') {
      console.log('Ris Live Error:', res.data.message)
    }
  }
}

const toggleRisProtocol = () => {
  if (!socket.value) {
    connectWebSocket()
  } else if (rrcList.value.length === 0) {
    sendSocketType('request_rrc_list', null)
  } else if (isPlaying.value) {
    sendSocketType('ris_subscribe', params.value)
  } else {
    socket.value.close()
  }
}

const handleRRC = (data) => {
  if (data?.length > 0) {
    if (route.query.rrc) {
      params.value.host = route.query.rrc
    } else {
      params.value.host = data[0]
    }
    rrcList.value = data.sort()
  }
}

const sendSocketType = (protocol, paramData) => {
  socket.value.send(
    JSON.stringify({
      type: protocol,
      data: paramData
    })
  )
}

const handleMessages = (data) => {
  if (data.community && Array.isArray(data.community)) {
    // Add descriptions to community data
    data.community = data.community.map(([comm_1, comm_2]) => {
      const community = `${comm_1}:${comm_2}`
      const description = findCommunityDescription(community)
      return { community: community, comm_1: comm_1, description: description }
    })
  }
  if (data.path && Array.isArray(data.path)) {
    // Creating new property and adding AS, AS names and country codes to the "as_info"
    data.as_info = data.path.map((asn) => getASInfo(asn))
  }
  // Creating new property to store the floor timestamp
  data.floor_timestamp = Math.floor(data.timestamp)

  if (
    defaultSelectedPeerCount.value > 0 &&
    !selectedPeers.value.some((peer) => peer.peer === data.peer)
  ) {
    selectedPeers.value.push({ peer: data.peer })
    defaultSelectedPeerCount.value--
  }

  rawMessages.value.push(data)
  if (isLiveMode.value) {
    handleFilterMessages(data)
  }
}

const findCommunityDescription = (communityToFind) => {
  const community = communities.value.find((c) => matchPattern(c.community, communityToFind))
  return community ? community.description : 'Null'
}

const getASInfo = (asn) => {
  if (asNames.value[asn]) {
    return { asn: asn, ...asNames.value[asn] }
  } else {
    return { asn: asn, asn_name: 'Unknown', cc: 'ZZ' }
  }
}

const handleFilterMessages = (data) => {
  if (data) {
    uniquePeerMessages.set(data.peer, data)
    usedMessagesCount.value = rawMessages.value.length
  } else {
    filteredMessages.value = []
    uniquePeerMessages.clear()
    const filteredRawMessages = rawMessages.value.filter((message) => 
      message.floor_timestamp <= selectedMaxTimestamp.value
    )
    usedMessagesCount.value = filteredRawMessages.length

    filteredRawMessages.forEach((message) => {
      uniquePeerMessages.set(message.peer, message)
    })
  }
  filteredMessages.value = Array.from(uniquePeerMessages.values())
}

const bgpMessageType = (data) => {
  if (data.announcements[0]?.prefixes.includes(params.value.prefix)) {
    return 'Announce'
  } else if (data.withdrawals.includes(params.value.prefix)) {
    return 'Withdraw'
  } else {
    return 'Unknown'
  }
}

const setSelectedMaxTimestamp = (val) => {
	selectedMaxTimestamp.value = val
  if (!isLiveMode.value) {
    handleFilterMessages()
  }
}

const disableLiveMode = () => {
  isLiveMode.value = false
}

const enableLiveMode = () => {
  isLiveMode.value = true
}

const fetchAllASInfo = async () => {
  try {
    const data = await getASNamesCountryMappings()
    asNames.value = data
  } catch (error) {
    console.error('Error fetching AS Info:', error)
  }
}

// watch(
//   [params, maxHops],
//   () => {
//     const query = {
//       ...route.query,
//       prefix: params.value.prefix,
//       maxHops: maxHops.value,
//       rrc: params.value.host
//     }
//     router.replace({ query })
//   },
//   { deep: true }
// )

// watch(
//   params,
//   () => {
//     params.value.prefix = params.value.prefix.trim()
//     resetData()
//   },
//   { deep: true }
// )

// const layout = ref({
//   font: {
//     size: 12
//   },
//   margin: { t: 20, b: 20, l: 20, r: 20 }
// })

// const config = ref({ responsive: true })


// watch(links, () => {
//   // plotSankey()
// })

// const columns = [
//   {
//     name: 'peer_asn',
//     required: true,
//     label: 'Peer ASN',
//     align: 'left',
//     field: 'peer_asn'
//   },
//   {
//     name: 'peer',
//     align: 'left',
//     label: 'Peer',
//     field: 'peer'
//   },
//   {
//     name: 'path',
//     label: 'AS Path',
//     field: 'path',
//     align: 'left'
//   },
//   {
//     name: 'as_info',
//     label: 'AS Info',
//     field: 'as_info',
//     align: 'left'
//   },
//   {
//     name: 'type',
//     label: 'Type',
//     field: 'type',
//     align: 'left'
//   },
//   {
//     name: 'timestamp',
//     label: 'Timestamp',
//     field: 'timestamp',
//     align: 'left'
//   },
//   {
//     name: 'community',
//     label: 'Community',
//     field: 'community',
//     align: 'left'
//   }
// ]

// const rows = computed(() =>
//   filteredMessages.value.map((message) => ({
//     peer_asn: message.peer_asn,
//     peer: message.peer,
//     path: message.path?.length > 0 ? message.path : null,
//     as_info:
//       message.as_info?.length > 0
//         ? message.as_info
//             .map((info) => `${info.asn}: ${info.asn_name}, ${info.country_iso_code2}`)
//             .join('\n')
//         : 'Null',
//     type: bgpMessageType(message),
//     timestamp: timestampToUTC(message.floor_timestamp),
//     community:
//       message.community?.length > 0
//         ? message.community
//             .map((c) => `${c.community}, ${'AS' + c.comm_1}-${c.description}`)
//             .join('\n')
//         : 'Null'
//   }))
// )

// watch(isLiveMode, () => {
//   updateTimeRange()
//   handleFilterMessages()
// })

// const initMessagesRecivedLineChart = () => {
//   Plotly.newPlot(lineChart.value, chartData.value, chartLayout.value, config.value)
//   lineChart.value.on('plotly_click', handlePlotlyClick)
//   lineChart.value.on('plotly_relayout', adjustQSliderWidth)
// }

// const fetchGithubFiles = async () => {
//   const repoUrl = 'https://api.github.com/repos/NLNOG/lg.ring.nlnog.net/contents/communities'
//   try {
//     const response = await axios.get(repoUrl)
//     const files = response.data
//     const txtFiles = files.filter(
//       (file) => file.name.startsWith('as') && file.name.endsWith('.txt')
//     )
//     const fetchFilePromises = txtFiles.map((file) => axios.get(file.download_url))
//     const fileContents = await Promise.all(fetchFilePromises)
//     const processedCommunities = fileContents.flatMap((content) => {
//       const lines = content.data.trim().split('\n')
//       return lines
//         .filter((line) => line.trim() !== '' && !line.startsWith('#'))
//         .map((line) => {
//           const [community, description] = line.split(',')
//           if (community && description) {
//             return { community: community.trim(), description: description.trim() }
//           }
//           return null // Return null for improperly formatted lines
//         })
//         .filter((entry) => entry !== null) // Filter out null entries
//     })
//     communities.value = processedCommunities
//   } catch (error) {
//     console.error('Error fetching the GitHUb files: ', error)
//   }
// }

// const matchPattern = (community, communityToFind) => {
//   if (community.split(':').length !== 2 || communityToFind.split(':').length !== 2) return false
//   // Exact Match
//   if (community === communityToFind) return true
//   const [pattern_1, pattern_2] = community.split(':')
//   const [comm_1, comm_2] = communityToFind.split(':')
//   // Range Match
//   if (pattern_2.includes('-')) {
//     const [start, end] = pattern_2.split('-').map(Number)
//     const commNumber = Number(comm_2)
//     if (pattern_1 === comm_1 && commNumber >= start && commNumber <= end) {
//       //console.log('Range', community, communityToFind)
//       return true
//     }
//   }
//   // Single Digit Wildcard Match
//   if (pattern_2.includes('x')) {
//     const regex = new RegExp(`^${pattern_2.replace('x', '\\d')}$`)
//     if (pattern_1 === comm_1 && regex.test(comm_2)) {
//       //console.log('Wildcard', community, communityToFind)
//       return true
//     }
//   }
//   // Any Number Match
//   if (pattern_2.includes('nnn')) {
//     const regex = new RegExp(`^${pattern_2.replace('nnn', '\\d+')}$`)
//     if (pattern_1 === comm_1 && regex.test(comm_2)) {
//       //console.log('Any', community, communityToFind)
//       return true
//     }
//   }
//   return false
// }

// const adjustQSliderWidth = () => {
//   const rectElement = document.querySelector('rect.nsewdrag')
//   const width = rectElement.getAttribute('width')
//   const timestampSliderElement = document.querySelector('.timetampSlider')
//   timestampSliderElement.style.width = `${width}px`
// }

watch(isPlaying, () => {
  toggleRisProtocol()
})

onMounted(() => {
	initRoute()
  connectWebSocket()
  fetchAllASInfo()
  // fetchGithubFiles()
  // initMessagesRecivedLineChart()
  // adjustQSliderWidth()
})
</script>

<template>
	<div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <h1 class="text-center q-pa-xl">Real-Time BGP Monitor</h1>
    <div class="controls justify-center q-pa-md flex">
      <QInput
        outlined
        placeholder="Prefix"
        :dense="true"
        color="accent"
        v-model="params.prefix"
        :disable="isPlaying"
      />
      <QSelect
        style="min-width: 100px"
        filled
        v-model="params.host"
        :options="rrcList"
        label="RRC"
        :dense="true"
        color="accent"
        :disable="isPlaying"
      />
      <QSlider
        style="max-width: 250px"
        v-model="maxHops"
        :min="1"
        :max="9"
        :step="1"
        label-always
        snap
        label
        :label-value="'Max Hops: ' + maxHops"
        color="accent"
        marker-labels
      />
    </div>
    <div class="controlsContainer">
      <div class="controls justify-center q-pa-md flex">
        <QBtn
          @click="toggleConnection"
          :color="disableButton ? 'grey-9' : isPlaying ? 'secondary' : 'positive'"
          :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
          :disable="disableButton || params.prefix === ''"
        />
        <QBtn @click="resetData" color="negative" :label="'Reset'" :disable="isPlaying" />
      </div>
      <div class="stats">
        <span>Displaying Unique Peer messages: {{ filteredMessages.length }}</span>
        <span>Total messages received: {{ rawMessages.length }}</span>
      </div>
    </div>
    <GenericCardController
      :title="'123'"
      :sub-title="'123'"
      :info-title="'123'"
      :info-description="'123'"
      class="card"
    >
      <BGPPathsChart
				:filteredMessages="filteredMessages"
				:maxHops="maxHops"
				:selectedPeers="selectedPeers"
        :isLiveMode="isLiveMode"
				:isPlaying="isPlaying"
				:bgpMessageType="bgpMessageType"
        @enable-live-mode="enableLiveMode"
			/>
    </GenericCardController>
    <GenericCardController
      :title="'123'"
      :sub-title="'123'"
      :info-title="'123'"
      :info-description="'123'"
      class="card"
    >
      <BGPLineChart 
				:rawMessages="rawMessages"
				:maxHops="maxHops"
				:selectedPeers="selectedPeers"
				:bgpMessageType="bgpMessageType"
				:usedMessagesCount="usedMessagesCount"
				:isLiveMode="isLiveMode"
				:isPlaying="isPlaying"
				@setSelectedMaxTimestamp="setSelectedMaxTimestamp"
				@disable-live-mode="disableLiveMode"
				@enable-live-mode="enableLiveMode"
			/>
    </GenericCardController>
    <!-- <GenericCardController
      :title="$t('charts.bgpMessagesTable.title')"
      :sub-title="$t('charts.bgpMessagesTable.subTitle')"
      :info-title="$t('charts.bgpMessagesTable.info.title')"
      :info-description="$t('charts.bgpMessagesTable.info.description')"
      class="card"
    >
      <div class="tableContainer">
        <QTable
          flat
          :rows="rows"
          :columns="columns"
          :filter="search"
          row-key="peer"
          selection="multiple"
          v-model:selected="selectedPeers"
        >
          <template v-slot:top-left>
            <QBtn :color="isLiveMode && isPlaying ? 'negative' : 'grey-9'" :label="'Live'" />
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
                :to="{ name: 'network', params: { id: `AS${props.row.peer_asn}` } }"
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
                      :to="{ name: 'network', params: { id: `AS${asn}` } }"
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
      </div>
    </GenericCardController> -->
  </div>
</template>

<style>
.controls{
	gap: 30px;
}
.chartContainer{
  position: relative;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  width: 100%;
}
.sankeyChart{
  height: 100vh;
  width: 100%;
}
.timetampSlider {
  display: flex;
  flex-direction: column;
  gap: 30px;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin: 0 auto;
}
.timetampSliderContainer{
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.timestampInfo{
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.timeStampControls{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}
.controlsContainer{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
}
.stats{
  display: flex;
  flex-direction: column;
}
.noData{
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.tableContainer{
  height: 100vh;
  overflow-y: scroll;
}
.asn-list {
  display: inline-flex;
  flex-wrap: nowrap;
}
.asn-list > span {
  display: inline;
}
</style>