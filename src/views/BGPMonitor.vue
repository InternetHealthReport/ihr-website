<script setup>
import {
  QBtn,
  QSelect,
  QInput,
  QSlider,
  uid,
  QDialog,
  QCard,
  QCardSection,
  QCardActions
} from 'quasar'
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import GenericCardController from '@/components/controllers/GenericCardController.vue'
import i18n from '@/i18n'
import { getASNamesCountryMappings } from '../plugins/AsNames'
import BGPPathsChart from '@/components/charts/BGPPathsChart.vue'
import BGPLineChart from '@/components/charts/BGPLineChart.vue'
import BGPMessagesTable from '@/components/tables/BGPMessagesTable.vue'
import '@/styles/chart.css'

const { t } = i18n.global

const maxHops = ref(9)
const isPlaying = ref(false)
const rrcList = ref([])
const disableButton = ref(false)
const socket = ref(null)
const rawMessages = ref([]) //Used to store all the messages from the websocket
const filteredMessages = ref([]) //Used to store unique peer messages uses "uniquePeerMessages = new Map()""
const uniquePeerMessages = new Map() //Used to store unique peer messages (For simplification)
const communities = ref([]) //Community data from the GitHub repository
const selectedPeers = ref([])
const defaultSelectedPeerCount = ref(5) //Default number of peers to display in the sankey chart
const isLiveMode = ref(true)
const selectedMaxTimestamp = ref(0)
const usedMessagesCount = ref(0) //Just for displaying how many messages are being used
const asNames = ref({}) // AS Info from asnames.txt file
const inputDisable = ref(false)
const isWsDisconnected = ref(false)

const params = ref({
  peer: '',
  path: '',
  prefix: '169.145.140.0/23', //2600:40fc:1004::/48 , 196.249.102.0/24 , 170.238.225.0/24, 202.164.222.0/24
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
  inputDisable.value = true
  isPlaying.value = !isPlaying.value
}

// Reset all the data
const resetData = () => {
  isPlaying.value = false
  rawMessages.value = []
  filteredMessages.value = []
  uniquePeerMessages.clear()
  selectedPeers.value = []
  defaultSelectedPeerCount.value = 5
  isLiveMode.value = true
  selectedMaxTimestamp.value = 0
  usedMessagesCount.value = 0
  inputDisable.value = false
}

// Initialize the route
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

// Connect to the WebSocket
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
    isWsDisconnected.value = true
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
    // If websocket is not connected
    connectWebSocket()
  } else if (rrcList.value.length === 0) {
    sendSocketType('request_rrc_list', null) // Request the RRC list called only once
  } else if (isPlaying.value) {
    sendSocketType('ris_subscribe', params.value)
  } else {
    socket.value.close()
  }
}

// Handle the RRC list (host)
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

//Stringify and send the socket type
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
    const uniqueASpath = [...new Set(data.path)]
    // Creating new property and adding AS, AS names and country codes to the "as_info"
    data.as_info = uniqueASpath.map((asn) => getASInfo(asn))
  }
  // Creating new property to store the floor timestamp
  data.floor_timestamp = Math.floor(data.timestamp)

  //Automatically select the first 5 peers for displaying the sankey chart
  if (
    defaultSelectedPeerCount.value > 0 &&
    !selectedPeers.value.some((peer) => peer.peer === data.peer)
  ) {
    selectedPeers.value.push({ peer: data.peer })
    defaultSelectedPeerCount.value--
  }

  rawMessages.value.push(data)
  //When in live mode
  if (isLiveMode.value) {
    handleFilterMessages(data)
  }
}

// Find the community description
const findCommunityDescription = (communityToFind) => {
  const community = communities.value.find((c) => matchPattern(c.community, communityToFind))
  return community ? community.description : 'Null'
}

// Get the AS (AS Number, AS Name and Country Code) from the asnames.txt file
const getASInfo = (asn) => {
  if (asNames.value[asn]) {
    return { asn: asn, ...asNames.value[asn] }
  } else {
    return { asn: asn, asn_name: 'Unknown', country_iso_code2: 'ZZ' }
  }
}

// Filter bgp messages (stores only unique peer messages)
const handleFilterMessages = (data) => {
  if (data) {
    //When new message is received by the websocket
    uniquePeerMessages.set(data.peer, data)
    usedMessagesCount.value = rawMessages.value.length
  } else {
    //When using the time slider
    filteredMessages.value = []
    uniquePeerMessages.clear()
    const filteredRawMessages = rawMessages.value.filter(
      (message) => message.floor_timestamp <= selectedMaxTimestamp.value
    )
    usedMessagesCount.value = filteredRawMessages.length

    filteredRawMessages.forEach((message) => {
      uniquePeerMessages.set(message.peer, message)
    })
  }
  filteredMessages.value = Array.from(uniquePeerMessages.values())
}

// Determine the BGP message type
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
  if (val) {
    selectedMaxTimestamp.value = val
  } else {
    selectedMaxTimestamp.value = Infinity
  }
  handleFilterMessages()
}

const disableLiveMode = () => {
  isLiveMode.value = false
}

const enableLiveMode = () => {
  isLiveMode.value = true
  setSelectedMaxTimestamp()
}

// Fetching the AS Info from the asnames.txt file
const fetchAllASInfo = async () => {
  try {
    const data = await getASNamesCountryMappings()
    asNames.value = data
  } catch (error) {
    console.error('Error fetching AS Info:', error)
  }
}

// Fetching the communities from the GitHub repository
const fetchGithubFiles = async () => {
  const repoUrl = 'https://api.github.com/repos/NLNOG/lg.ring.nlnog.net/contents/communities'
  try {
    const response = await axios.get(repoUrl)
    const files = response.data
    const txtFiles = files.filter(
      (file) => file.name.startsWith('as') && file.name.endsWith('.txt')
    )
    const fetchFilePromises = txtFiles.map((file) => axios.get(file.download_url))
    const fileContents = await Promise.all(fetchFilePromises)
    const processedCommunities = fileContents.flatMap((content) => {
      const lines = content.data.trim().split('\n')
      return lines
        .filter((line) => line.trim() !== '' && !line.startsWith('#'))
        .map((line) => {
          const [community, description] = line.split(',')
          if (community && description) {
            return { community: community.trim(), description: description.trim() }
          }
          return null // Return null for improperly formatted lines
        })
        .filter((entry) => entry !== null) // Filter out null entries
    })
    communities.value = processedCommunities
  } catch (error) {
    console.error('Error fetching the GitHUb files: ', error)
  }
}

//Marching the community pattern
const matchPattern = (community, communityToFind) => {
  //This doesnot work with large communities, for example 65535:0:12345, 65535:nnn:0, 65535:123:100x.
  if (community.split(':').length !== 2 || communityToFind.split(':').length !== 2) return false
  // Exact match, for example: 65535:666, only matching this exact community
  if (community === communityToFind) return true

  const [pattern_1, pattern_2] = community.split(':')
  const [comm_1, comm_2] = communityToFind.split(':')
  // Range match, for example: 65535:0-100, matching anything from 65535:0 upto 65535:100
  if (pattern_2.includes('-')) {
    const [start, end] = pattern_2.split('-').map(Number)
    const commNumber = Number(comm_2)
    if (pattern_1 === comm_1 && commNumber >= start && commNumber <= end) {
      //console.log('Range', community, communityToFind)
      return true
    }
  }
  // Single digit wildcard match, for example: 65535:x0, matching for 65535:00, 65535:10, 65535:20, etc
  if (pattern_2.includes('x')) {
    const regex = new RegExp(`^${pattern_2.replace('x', '\\d')}$`)
    if (pattern_1 === comm_1 && regex.test(comm_2)) {
      //console.log('Wildcard', community, communityToFind)
      return true
    }
  }
  // Any Number Match, for example: 65535:nnn, which matches any community staring with 65535: followed by any number.
  if (pattern_2.includes('nnn')) {
    const regex = new RegExp(`^${pattern_2.replace('nnn', '\\d+')}$`)
    if (pattern_1 === comm_1 && regex.test(comm_2)) {
      //console.log('Any', community, communityToFind)
      return true
    }
  }
  return false
}

const updateSelectedPeers = (obj) => {
  selectedPeers.value = obj
}

watch(
  [params, maxHops],
  () => {
    const query = {
      ...route.query,
      prefix: params.value.prefix,
      maxHops: maxHops.value,
      rrc: params.value.host
    }
    router.replace({ query })
  },
  { deep: true }
)

watch(isPlaying, () => {
  toggleRisProtocol()
})

onMounted(() => {
  initRoute()
  connectWebSocket()
  fetchAllASInfo()
  fetchGithubFiles()
})
</script>

<template>
  <div class="IHR_char-container">
    <h1 class="text-center q-pa-xl">Real-Time BGP Monitor</h1>
    <div class="controls justify-center q-pa-md flex">
      <QInput
        outlined
        placeholder="Prefix"
        :dense="true"
        color="accent"
        v-model="params.prefix"
        :disable="isPlaying || inputDisable"
      />
      <QSelect
        style="min-width: 100px"
        filled
        v-model="params.host"
        :options="rrcList"
        label="RRC"
        :dense="true"
        color="accent"
        :disable="isPlaying || inputDisable"
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
      :title="$t('bgpAsPaths.title')"
      :sub-title="$t('bgpAsPaths.subTitle')"
      :info-title="$t('bgpAsPaths.info.title')"
      :info-description="$t('bgpAsPaths.info.description')"
      class="cardBGP"
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
      :title="$t('bgpMessagesCount.title')"
      :sub-title="$t('bgpMessagesCount.subTitle')"
      :info-title="$t('bgpMessagesCount.info.title')"
      :info-description="$t('bgpMessagesCount.info.description')"
      class="cardBGP"
    >
      <BGPLineChart
        :rawMessages="rawMessages"
        :maxHops="maxHops"
        :bgpMessageType="bgpMessageType"
        :usedMessagesCount="usedMessagesCount"
        :isLiveMode="isLiveMode"
        :isPlaying="isPlaying"
        @setSelectedMaxTimestamp="setSelectedMaxTimestamp"
        @disable-live-mode="disableLiveMode"
        @enable-live-mode="enableLiveMode"
      />
    </GenericCardController>
    <GenericCardController
      :title="$t('bgpMessagesTable.title')"
      :sub-title="$t('bgpMessagesTable.subTitle')"
      :info-title="$t('bgpMessagesTable.info.title')"
      :info-description="$t('bgpMessagesTable.info.description')"
      class="lastCardBGP"
    >
      <BGPMessagesTable
        :filteredMessages="filteredMessages"
        :selectedPeers="selectedPeers"
        :isLiveMode="isLiveMode"
        :isPlaying="isPlaying"
        :bgpMessageType="bgpMessageType"
        @enable-live-mode="enableLiveMode"
        @update-selected-peers="updateSelectedPeers"
      />
    </GenericCardController>
    <QDialog v-model="isWsDisconnected">
      <QCard style="width: 1000px; height: auto">
        <QCardSection>
          <div class="text-h6">Failed to connect to the server.</div>
        </QCardSection>
        <QCardSection class="q-pt-none">
          <p>
            This may happen if the RIS Live server does not respond, or if the connection is lost
            due to network issues. If the connection remains idle for too long, the server will also
            close the WebSocket connection.
          </p>
        </QCardSection>
        <QCardActions align="right">
          <QBtn flat label="Close" color="primary" v-close-popup />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
</template>

<style>
.controls {
  gap: 30px;
}
.controlsContainer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
}
.stats {
  display: flex;
  flex-direction: column;
}
.cardBGP {
  margin-top: 20px;
}
.lastCardBGP {
  margin-top: 20px;
  margin-bottom: 20px;
}
</style>
