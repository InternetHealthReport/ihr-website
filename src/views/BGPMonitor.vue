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
  QCardActions,
  QRadio,
  QIcon,
  QTooltip,
  QDate,
  QTime,
  QPopupProxy
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
import Feedback from '@/components/Feedback.vue'

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

const dataSource = ref('risLive') //'risLive' or 'bgplay'

const startTime = ref(new Date().toISOString().slice(0, 16))
const endTime = ref(new Date().toISOString().slice(0, 16))
const rrcs = ref([])
const rrcLocations = ref([])
const isLoadingBGPlayData = ref(false)
const bgPlayEvents = ref([]) // Used to store the "events" for BGPlay
const bgPlayASNames = ref({}) // Used to store the AS names we get from the BGPlay nodes Array

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
  if (route.query.dataSource) {
    dataSource.value = route.query.dataSource
  } else {
    query.dataSource = dataSource.value
  }
  if (route.query.startTime) {
    startTime.value = route.query.startTime
  } else {
    query.startTime = startTime.value
  }
  if (route.query.endTime) {
    endTime.value = route.query.endTime
  } else {
    query.endTime = endTime.value
  }
  if (route.query.rrcs) {
    rrcs.value = route.query.rrcs.split(',').map(Number)
  } else {
    query.rrcs = rrcs.value.join(',')
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
      processResData(res.data)
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

const processResData = (data) => {
  if (dataSource.value === 'risLive') {
    data.community = addCommunityAndDescriptions(data.community)
    data.as_info = addASInfo(data.path)
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
  } else {
    data.data.nodes.map((node) => {
      bgPlayASNames.value[node.as_number] = {
        asn_name: node.owner.split(', ')[0],
        country_iso_code2: node.owner.split(', ')[1]
      }
    })
    data.data.events.map((data) => {
      bgPlayEvents.value.push({
        source_id: data.attrs.source_id,
        currentPath: data.attrs.path || [],
        community: addCommunityAndDescriptions(data.attrs.community),
        as_info: addASInfo(data.attrs.path),
        type: data.type,
        timestamp: data.timestamp
      })
    })
    console.log('BGPlay Events:', bgPlayEvents.value)
  }
}

// Apply community descriptions to the community data array
const addCommunityAndDescriptions = (communityDataArray) => {
  if (!Array.isArray(communityDataArray)) return []
  return communityDataArray.map((entry) => {
    const [comm_1, comm_2] = typeof entry === 'string' ? entry.split(':').map(Number) : entry
    const community = `${comm_1}:${comm_2}`
    const description = findCommunityDescription(community)
    return {
      community,
      comm_1,
      description
    }
  })
}

// Find the community description
const findCommunityDescription = (communityToFind) => {
  const community = communities.value.find((c) => matchPattern(c.community, communityToFind))
  return community ? community.description : 'Null'
}

// Add AS Info to the AS path
const addASInfo = (asPathArray) => {
  if (!Array.isArray(asPathArray)) return []
  const uniqueASpath = [...new Set(asPathArray)]
  return uniqueASpath.map((asn) => {
    const asInfo = dataSource.value === 'risLive' ? asNames.value[asn] : bgPlayASNames.value[asn]
    return {
      asn,
      asn_name: asInfo?.asn_name || 'Unknown',
      country_iso_code2: asInfo?.country_iso_code2 || 'ZZ'
    }
  })
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

const fetchRCCs = async () => {
  try {
    const res = await axios.get('https://stat.ripe.net/data/rrc-info/data.json')
    const data = res.data.data.rrcs
    if (!Array.isArray(data) || data.length === 0) {
      console.error('No RRC data found')
      return
    }
    data.forEach((rcc) => {
      rrcLocations.value.push({
        label:
          rcc.multihop === true
            ? `${rcc.id} - Multihop (${rcc.geographical_location})`
            : `${rcc.id} - ${rcc.geographical_location}`,
        value: rcc.id
      })
    })
  } catch (error) {
    console.error('Error fetching RRC list:', error)
  }
}

const haveRequiredBGPlayParams = () => {
  return (
    params.value.prefix && startTime.value && endTime.value && rrcs.value && rrcs.value.length > 0
  )
}

const fetchBGPlayData = async () => {
  if (!haveRequiredBGPlayParams()) {
    console.error('Missing required parameters')
    return
  }
  try {
    isLoadingBGPlayData.value = true
    const res = await axios.get('https://stat-ui.stat.ripe.net/data/bgplay/data.json', {
      params: {
        resource: params.value.prefix,
        starttime: startTime.value,
        endtime: endTime.value,
        rrcs: rrcs.value.join(',')
      }
    })
    processResData(res.data)
  } catch (error) {
    console.error('Error fetching BGPlay data:', error)
  } finally {
    isLoadingBGPlayData.value = false
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
  [params, maxHops, dataSource, startTime, endTime, rrcs],
  () => {
    const query = {
      ...route.query,
      prefix: params.value.prefix,
      maxHops: maxHops.value,
      rrc: params.value.host,
      dataSource: dataSource.value,
      startTime: startTime.value,
      endTime: endTime.value,
      rrcs: rrcs.value ? rrcs.value.join(',') : ''
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
  fetchRCCs()
})
</script>

<template>
  <div class="IHR_char-container">
    <h1 class="text-center q-pa-xl">BGP Monitor</h1>
    <div class="row items-center justify-center gap-30 full-width">
      <QCard class="q-pa-md q-pr-lg">
        <p>Data Source</p>
        <div>
          <QRadio v-model="dataSource" val="risLive" label="RisLive" />
          <QIcon name="fas fa-circle-info" class="q-ml-md">
            <QTooltip>Monitor Real-Time BGP events</QTooltip>
          </QIcon>
        </div>
        <div>
          <QRadio v-model="dataSource" val="bgplay" label="BGPlay" />
          <QIcon name="fas fa-circle-info" class="q-ml-md">
            <QTooltip>Monitor BGP events from a specific time range</QTooltip>
          </QIcon>
        </div>
      </QCard>
      <div class="column gap-30 items-center justify-center">
        <div class="gap-30 row justify-center items-center full-width">
          <div class="row gap-30 justify-center items-center">
            <QInput
              class="input"
              v-model="params.prefix"
              outlined
              placeholder="Prefix"
              :dense="true"
              color="accent"
              :disable="isPlaying || inputDisable"
            />
            <QSelect
              v-if="dataSource === 'risLive'"
              v-model="params.host"
              filled
              :options="rrcList"
              label="RRC"
              :dense="true"
              color="accent"
              :disable="isPlaying || inputDisable"
            />
            <QSelect
              filled
              :dense="true"
              v-else
              v-model="rrcs"
              multiple
              :options="rrcLocations"
              label="RRCs"
              emit-value
              class="input"
              clearable
            />
          </div>
          <div class="row items-center justify-center gap-30">
            <QInput
              v-if="dataSource === 'bgplay'"
              label="Start Date Time in (UTC)"
              v-model="startTime"
              class="input"
            >
              <template v-slot:append>
                <QIcon name="event" class="cursor-pointer">
                  <QPopupProxy no-route-dismiss cover>
                    <div class="q-pa-md q-gutter-md row items-start">
                      <QDate flat v-model="startTime" mask="YYYY-MM-DDTHH:mm" />
                      <QTime flat v-model="startTime" mask="YYYY-MM-DDTHH:mm" />
                    </div>
                  </QPopupProxy>
                </QIcon>
              </template>
            </QInput>
            <QInput
              v-if="dataSource === 'bgplay'"
              label="End Date Time in (UTC)"
              v-model="endTime"
              class="input"
            >
              <template v-slot:append>
                <QIcon name="event" class="cursor-pointer">
                  <QPopupProxy no-route-dismiss cover>
                    <div class="q-pa-md q-gutter-md row items-start">
                      <QDate flat v-model="endTime" mask="YYYY-MM-DDTHH:mm" />
                      <QTime flat v-model="endTime" mask="YYYY-MM-DDTHH:mm" />
                    </div>
                  </QPopupProxy>
                </QIcon>
              </template>
            </QInput>
            <QSlider
              v-model="maxHops"
              class="input"
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
        </div>
        <div class="row items-center justify-center gap-30">
          <QBtn
            v-if="dataSource === 'risLive'"
            :color="disableButton ? 'grey-9' : isPlaying ? 'secondary' : 'positive'"
            :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
            :disable="disableButton || params.prefix === ''"
            @click="toggleConnection"
          />
          <QBtn
            v-else
            color="secondary"
            :label="'Submit'"
            @click="fetchBGPlayData"
            :disable="isLoadingBGPlayData || !haveRequiredBGPlayParams()"
          />
          <QBtn color="negative" :label="'Reset'" :disable="isPlaying" @click="resetData" />
          <div class="column">
            <span>Displaying Unique Peer messages: {{ filteredMessages.length }}</span>
            <span>Total messages received: {{ rawMessages.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <GenericCardController
      :title="$t('bgpAsPaths.title')"
      :sub-title="$t('bgpAsPaths.subTitle')"
      :info-title="$t('bgpAsPaths.info.title')"
      :info-description="$t('bgpAsPaths.info.description')"
      class="q-mt-lg"
    >
      <BGPPathsChart
        :filtered-messages="filteredMessages"
        :max-hops="maxHops"
        :selected-peers="selectedPeers"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        :bgp-message-type="bgpMessageType"
        @enable-live-mode="enableLiveMode"
      />
    </GenericCardController>
    <GenericCardController
      :title="$t('bgpMessagesCount.title')"
      :sub-title="$t('bgpMessagesCount.subTitle')"
      :info-title="$t('bgpMessagesCount.info.title')"
      :info-description="$t('bgpMessagesCount.info.description')"
      class="q-mt-lg"
    >
      <BGPLineChart
        :raw-messages="rawMessages"
        :max-hops="maxHops"
        :bgp-message-type="bgpMessageType"
        :used-messages-count="usedMessagesCount"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        @set-selected-max-timestamp="setSelectedMaxTimestamp"
        @disable-live-mode="disableLiveMode"
        @enable-live-mode="enableLiveMode"
      />
    </GenericCardController>
    <GenericCardController
      :title="$t('bgpMessagesTable.title')"
      :sub-title="$t('bgpMessagesTable.subTitle')"
      :info-title="$t('bgpMessagesTable.info.title')"
      :info-description="$t('bgpMessagesTable.info.description')"
      class="q-my-lg"
    >
      <BGPMessagesTable
        :filtered-messages="filteredMessages"
        :selected-peers="selectedPeers"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        :bgp-message-type="bgpMessageType"
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
          <QBtn v-close-popup flat label="Close" color="primary" />
        </QCardActions>
      </QCard>
    </QDialog>
  </div>
  <Feedback />
</template>

<style scoped>
.input {
  width: 200px;
}
.gap-30 {
  gap: 30px;
}
</style>
