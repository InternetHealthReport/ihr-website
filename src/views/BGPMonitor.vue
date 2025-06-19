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
const communityInfo = ref({})
const selectedPeers = ref([])
const defaultSelectedPeerCount = ref(5) //Default number of peers to display in the sankey chart
const isLiveMode = ref(true)
const selectedMaxTimestamp = ref(0)
const usedMessagesCount = ref(0) //Just for displaying how many messages are being used
const asNames = ref({}) // AS Info from asnames.txt file
const inputDisable = ref(false)
const isWsDisconnected = ref(false)

const dataSource = ref('risLive') //'risLive' or 'bgplay'
const minTimestamp = ref(Infinity)
const maxTimestamp = ref(-Infinity)

const startTime = ref(new Date().toISOString().slice(0, 16))
const endTime = ref(new Date().toISOString().slice(0, 16))
const rrcs = ref([])
const rrcLocations = ref([])
const isLoadingBgplayData = ref(false)
const bgPlaySources = ref({}) // Used to store the "sources" for BGPlay
const bgPlayASNames = ref({}) // Used to store the AS names we get from the BGPlay nodes Array
const bgPlayInitialState = ref([]) // Used to store the initial state for BGPlay
const initialStateDataCount = ref(0)

const params = ref({
  peer: '',
  path: '',
  prefix: '', //2600:40fc:1004::/48 , 196.249.102.0/24 , 170.238.225.0/24, 202.164.222.0/24
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

  bgPlaySources.value = {}
  bgPlayInitialState.value = []
  bgPlayASNames.value = {}
  minTimestamp.value = Infinity
  maxTimestamp.value = -Infinity
  initialStateDataCount.value = 0
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
    data.type = addBGPMessageType(data)
    // Modify the timestamp to be in seconds
    data.timestamp = Math.floor(data.timestamp)

    applyDefaultSelectedPeers(data.peer)

    rawMessages.value.push(data)
    //When in live mode
    if (isLiveMode.value) {
      handleFilterMessages(data)
    }
  } else {
    //Temp variables to reduce the vue reactivity
    const sources = {}
    const nodes = {}
    const events = []
    const query_starttime = timestampToUnix(data.data.query_starttime)

    data.data.sources.forEach((source) => {
      const peer = source.id.split('-')[1] //removes the 'rrc-' prefix
      sources[peer] = {
        as_number: source.as_number,
        rrc: source.rrc
      }
    })
    bgPlaySources.value = sources

    data.data.nodes.forEach((node) => {
      const [asn_name, country_iso_code2] = node.owner.split(', ')
      nodes[node.as_number] = {
        asn_name,
        country_iso_code2
      }
    })
    bgPlayASNames.value = nodes

    data.data.initial_state.forEach((event) => {
      const peer = event.source_id.split('-')[1]
      const peerInfo = sources[peer]

      if (!rrcs.value.includes(Number(peerInfo.rrc))) return // Filter out peers not in the selected RRCs

      applyDefaultSelectedPeers(peer)
      initialStateDataCount.value++

      events.push({
        peer_asn: peerInfo.as_number,
        rrc: peerInfo.rrc,
        peer: peer,
        path: event.path || [],
        community: addCommunityAndDescriptions(event.community),
        as_info: addASInfo(event.path),
        type: addBGPMessageType('I'), // Manually Assigning 'I' for Initial State
        timestamp: query_starttime
      })
    })

    if (data.data.events.length != 0) {
      data.data.events.forEach((event) => {
        const peer = event.attrs.source_id.split('-')[1]
        const peerInfo = sources[peer]
        const timestamp = timestampToUnix(event.timestamp)

        applyDefaultSelectedPeers(peer)

        events.push({
          peer_asn: peerInfo.as_number,
          rrc: peerInfo.rrc,
          peer: peer,
          path: event.attrs.path || [],
          community: addCommunityAndDescriptions(event.attrs.community),
          as_info: addASInfo(event.attrs.path),
          type: addBGPMessageType(event.type),
          timestamp: timestamp
        })
      })
      rawMessages.value = events
      maxTimestamp.value = events.at(-1).timestamp
    }
    minTimestamp.value = query_starttime
  }
}

//Automatically select the first 5 peers for displaying the sankey chart
const applyDefaultSelectedPeers = (peer) => {
  if (
    defaultSelectedPeerCount.value > 0 &&
    !selectedPeers.value.some((data) => data.peer === peer)
  ) {
    selectedPeers.value.push({ peer: peer })
    defaultSelectedPeerCount.value--
  }
}

// Apply community descriptions to the community data array
const addCommunityAndDescriptions = (communityDataArray) => {
  if (!Array.isArray(communityDataArray)) return []
  return communityDataArray.map((entry) => {
    const [comm_1, comm_2] = typeof entry === 'string' ? entry.split(':') : entry
    const community_str = `${comm_1}:${comm_2}`
    const comm_1_str = `${comm_1}`
    const description =
      communityInfo.value[community_str]?.description ||
      communityInfo.value[comm_1_str]?.description ||
      'Null'
    return {
      community: community_str,
      comm_1: comm_1_str,
      description: description
    }
  })
}

// Add AS Info to the AS path
const addASInfo = (asPathArray) => {
  if (!Array.isArray(asPathArray) || asPathArray.length === 0) return []

  const source = dataSource.value === 'risLive' ? asNames.value : bgPlayASNames.value
  const seen = new Set()

  const result = []
  for (const asn of asPathArray) {
    if (seen.has(asn)) continue
    seen.add(asn)
    const info = source[asn] || {}
    result.push({
      asn,
      asn_name: info.asn_name || 'Unknown',
      country_iso_code2: info.country_iso_code2 || 'ZZ'
    })
  }
  return result
}

// Determine the BGP message type
const addBGPMessageType = (data) => {
  if (dataSource.value === 'risLive') {
    if (data.announcements[0]?.prefixes.includes(params.value.prefix)) {
      return 'Announce'
    } else if (data.withdrawals.includes(params.value.prefix)) {
      return 'Withdraw'
    } else {
      return 'Unknown'
    }
  } else {
    // For BGPlay, we can directly use the type from the event
    if (data === 'I') {
      return 'Initial State'
    } else if (data === 'A') {
      return 'Announce'
    } else if (data === 'W') {
      return 'Withdraw'
    } else {
      return 'Unknown'
    }
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
    uniquePeerMessages.clear()
    let count = 0
    for (const msg of rawMessages.value) {
      if (msg.timestamp <= selectedMaxTimestamp.value) {
        uniquePeerMessages.set(msg.peer, msg)
        count++
      }
    }
    usedMessagesCount.value = count
  }
  filteredMessages.value = Array.from(uniquePeerMessages.values())
}

const setSelectedMaxTimestamp = (val) => {
  selectedMaxTimestamp.value = val
  handleFilterMessages()
}

const disableLiveMode = () => {
  isLiveMode.value = false
}

const enableLiveMode = () => {
  isLiveMode.value = true
  setSelectedMaxTimestamp(Infinity)
}

const timestampToUnix = (timestamp) => {
  return Math.floor(new Date(timestamp + 'Z').getTime() / 1000)
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
    isLoadingBgplayData.value = true
    console.log('Fetching data...')
    const res = await axios.get('https://stat-ui.stat.ripe.net/data/bgplay/data.json', {
      params: {
        resource: params.value.prefix,
        starttime: startTime.value,
        endtime: endTime.value,
        rrcs: rrcs.value.join(',')
      }
    })
    console.log('Data fetched successfully, Processing Data...')
    processResData(res.data)
  } catch (error) {
    console.error('Error fetching BGPlay data:', error)
  } finally {
    isLoadingBgplayData.value = false
  }
}

// Fetching the communities from the GitHub repository
const fetchGithubFiles = async () => {
  const repoUrl = 'https://api.github.com/repos/NLNOG/lg.ring.nlnog.net/contents/communities'
  try {
    const response = await axios.get(repoUrl)
    const files = response.data
    const txtFiles = files.filter(
      (file) =>
        (file.name.startsWith('as') && file.name.endsWith('.txt')) || file.name === 'well-known.txt'
    )
    const fetchFilePromises = txtFiles.map((file) => axios.get(file.download_url))
    const fileContents = await Promise.all(fetchFilePromises)
    const processedCommunities = fileContents.flatMap((content) => {
      const lines = content.data.trim().split('\n')
      return lines
        .filter(
          (line) =>
            line.trim() !== '' && // Exclude empty lines
            !line.startsWith('#') && // Exclude comments
            !line.startsWith('rt') && // Exclude Extended communities
            !line.startsWith('soo') // Exclude Extended communities
        )
        .map((line) => {
          const [community, description] = line.split(',')
          if (community && description) {
            return { value: community.trim(), description: description.trim() }
          }
          return null // Return null for improperly formatted lines
        })
        .filter((entry) => entry !== null) // Filter out null entries
    })
    communityInfo.value = generateCommunityMap(processedCommunities)
  } catch (error) {
    console.error('Error fetching the GitHUb files: ', error)
  }
}

function generateCommunityMap(communities) {
  const communityInfo = {}

  const isWildcardX = (s) => s.includes('x')
  const isWildcardN = (s) => s.includes('n')
  const isRange = (s) => s.includes('-') && !isWildcardX(s) && !isWildcardN(s)
  const isExact = (s) => !isRange(s) && !isWildcardX(s) && !isWildcardN(s)

  // Expand range like '100-102' to ['100', '101', '102']
  function expandRange(str) {
    const [start, end] = str.split('-').map(Number)
    const result = []
    for (let i = start; i <= end; i++) {
      result.push(i.toString())
    }
    return result
  }

  // Expand wildcard patterns like '100xxx','100xx4' to all possible values
  function expandWildcard(pattern) {
    const firstWildcard = pattern.indexOf('x')
    if (firstWildcard === -1) return [pattern]

    const fixedPart = pattern.slice(0, firstWildcard)
    const wildcardPart = pattern.slice(firstWildcard)
    const wildcardCount = (wildcardPart.match(/x/g) || []).length
    const max = Math.pow(10, wildcardCount)

    const expanded = []
    for (let i = 0; i < max; i++) {
      const digits = i.toString().padStart(wildcardCount, '0')
      let wildcardExpanded = ''
      let digitIndex = 0
      for (const ch of wildcardPart) {
        wildcardExpanded += ch === 'x' ? digits[digitIndex++] : ch
      }
      expanded.push(fixedPart + wildcardExpanded)
    }
    return expanded
  }

  // Expand any pattern to all matching strings
  function expandPattern(pattern) {
    if (isExact(pattern) || isWildcardN(pattern)) return [pattern]
    if (isRange(pattern)) return expandRange(pattern)
    if (isWildcardX(pattern)) return expandWildcard(pattern)
    return []
  }

  for (const { value, description } of communities) {
    const parts = value.split(':')
    if (parts.length !== 2) continue

    const [prefixPattern, suffixPattern] = parts

    const prefixes = expandPattern(prefixPattern)
    const suffixes = expandPattern(suffixPattern)

    for (const prefix of prefixes) {
      for (const suffix of suffixes) {
        if (isWildcardN(suffix)) {
          communityInfo[`${prefix}`] = { description } // For wildcard N '65535:nnn', store only the prefix
        } else {
          communityInfo[`${prefix}:${suffix}`] = { description }
        }
      }
    }
  }
  console.log('Community Object Generated')
  return communityInfo
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
          <QRadio
            v-model="dataSource"
            val="risLive"
            label="RisLive"
            :disable="
              isPlaying ||
              inputDisable ||
              Object.keys(bgPlaySources).length > 0 ||
              isLoadingBgplayData
            "
          />
          <QIcon name="fas fa-circle-info" class="q-ml-md">
            <QTooltip>Monitor Real-Time BGP events</QTooltip>
          </QIcon>
        </div>
        <div>
          <QRadio
            v-model="dataSource"
            val="bgplay"
            label="BGPlay"
            :disable="
              isPlaying ||
              inputDisable ||
              Object.keys(bgPlaySources).length > 0 ||
              isLoadingBgplayData
            "
          />
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
              :disable="
                isPlaying ||
                inputDisable ||
                Object.keys(bgPlaySources).length > 0 ||
                isLoadingBgplayData
              "
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
              :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
            />
          </div>
          <div class="row items-center justify-center gap-30">
            <QInput
              v-if="dataSource === 'bgplay'"
              label="Start Date Time in (UTC)"
              v-model="startTime"
              class="input"
              :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
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
              :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
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
            :disable="
              Object.keys(bgPlaySources).length > 0 ||
              isLoadingBgplayData ||
              !haveRequiredBGPlayParams()
            "
          />
          <QBtn color="negative" :label="'Reset'" :disable="isPlaying" @click="resetData" />
          <div class="column">
            <span>Displaying Unique Peer messages: {{ filteredMessages.length }}</span>
            <span>Total messages received: {{ rawMessages.length }}</span>
            <span v-if="dataSource === 'bgplay'"
              >No of Initial State Messages: {{ initialStateDataCount }}</span
            >
            <span v-if="dataSource === 'bgplay'"
              >No of Events: {{ rawMessages.length - initialStateDataCount }}</span
            >
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
        :is-loading-bgplay-data="isLoadingBgplayData"
        :data-source="dataSource"
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
        :used-messages-count="usedMessagesCount"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        :is-loading-bgplay-data="isLoadingBgplayData"
        :data-source="dataSource"
        :min-timestamp="minTimestamp"
        :max-timestamp="maxTimestamp"
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
        :data-source="dataSource"
        :filtered-messages="filteredMessages"
        :selected-peers="selectedPeers"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
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
