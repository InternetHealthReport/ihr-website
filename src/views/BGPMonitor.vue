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
  QPopupProxy,
  QMarkupTable,
  QBadge
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
import { Address6, Address4 } from 'ip-address'
import report from '@/plugins/report'

const { t } = i18n.global
const { utcString } = report()

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
const normalizedPrefix = ref('') // Used to store the normalized prefix to determine the BGP message type

const dataSource = ref('ris-live') //'ris-live' or 'bgplay'
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
const datesTrace = ref([])
const announcementsTrace = ref([])
const withdrawalsTrace = ref([])
const announcementsPeersTraces = ref([])
let announcementsCount = {}
let withdrawalsCount = {}
let lastTypeByTimestamp = {}
let announcementsPeersCount = {}
const announcementsPeers = new Set()
const uniqueEventTimestamps = new Set()
const currentIndex = ref(-1)
const usingIndex = ref(false)

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
  datesTrace.value = []
  announcementsTrace.value = []
  withdrawalsTrace.value = []
  announcementsPeersTraces.value = []
  announcementsCount = {}
  withdrawalsCount = {}
  announcementsPeersCount = {}
  lastTypeByTimestamp = {}
  announcementsPeers.clear()
  uniqueEventTimestamps.clear()
  currentIndex.value = -1
  usingIndex.value = false
}

// Initialize the route
const initRoute = () => {
  const query = { ...route.query }

  if (route.query.prefix) {
    params.value.prefix = route.query.prefix
    normalizedPrefix.value = normalizePrefix(route.query.prefix)
  } else {
    query.prefix = params.value.prefix
  }
  if (route.query['max-hops']) {
    maxHops.value = parseInt(route.query['max-hops'])
  } else {
    query['max-hops'] = maxHops.value
  }
  if (route.query['data-source']) {
    dataSource.value = route.query['data-source']
  } else {
    query['data-source'] = dataSource.value
  }

  if (dataSource.value === 'ris-live') {
    if (route.query.rrc) {
      params.value.host = Number(route.query.rrc)
    } else {
      query.rrc = params.value.host
    }
  } else {
    if (route.query.rrcs) {
      rrcs.value = route.query.rrcs.split(',').map(Number)
    } else {
      query.rrcs = rrcs.value.join(',')
    }
    if (route.query['start-time']) {
      startTime.value = route.query['start-time']
    } else {
      query['start-time'] = startTime.value
    }
    if (route.query['end-time']) {
      endTime.value = route.query['end-time']
    } else {
      query['end-time'] = endTime.value
    }
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
    const subscribeParams = {
      ...params.value,
      host: rrcList.value.find((rrc) => rrc.value === params.value.host).inputValue
    }
    sendSocketType('ris_subscribe', subscribeParams)
  } else {
    socket.value.close()
  }
}

// Handle the RRC list (host)
const handleRRC = (data) => {
  if (!Array.isArray(data) || data.length === 0) return
  const rrcListLocations = data.sort().map((rrc) => {
    const value = parseInt(rrc.match(/\d+/)[0], 10)
    return {
      value,
      label: rrcLocations.value.find((rrc) => rrc.value === value).label,
      inputValue: rrc
    }
  })
  rrcList.value = rrcListLocations
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
  if (dataSource.value === 'ris-live') {
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

    if (data.timestamp < minTimestamp.value) {
      minTimestamp.value = data.timestamp
    }
    if (data.timestamp > maxTimestamp.value) {
      maxTimestamp.value = data.timestamp
    }

    generateLineChartData({
      timestamp: data.timestamp,
      type: data.type,
      peer: data.peer
    })
    generateLineChartTrace()
  } else {
    //Temp variables to reduce the vue reactivity
    const sources = {}
    const nodes = {}
    const events = []

    const query_unix_starttime = timestampToUnix(data.data.query_starttime)
    const query_unix_endtime = timestampToUnix(data.data.query_endtime)

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
      const type = addBGPMessageType('I') // Manually Assigning 'I' for Initial State

      if (!rrcs.value.includes(Number(peerInfo.rrc))) return // Filter out peers not in the selected RRCs

      generateLineChartData({
        timestamp: query_unix_starttime,
        type: type,
        peer: peer
      })

      applyDefaultSelectedPeers(peer)
      initialStateDataCount.value++

      events.push({
        peer_asn: peerInfo.as_number,
        rrc: peerInfo.rrc,
        peer: peer,
        path: event.path || [],
        community: addCommunityAndDescriptions(event.community),
        as_info: addASInfo(event.path),
        type: type,
        timestamp: query_unix_starttime
      })
    })

    data.data.events.forEach((event) => {
      const peer = event.attrs.source_id.split('-')[1]
      const peerInfo = sources[peer]
      const timestamp = timestampToUnix(event.timestamp)
      const type = addBGPMessageType(event.type)

      generateLineChartData({
        timestamp: timestamp,
        type: type,
        peer: peer
      })

      applyDefaultSelectedPeers(peer)

      events.push({
        peer_asn: peerInfo.as_number,
        rrc: peerInfo.rrc,
        peer: peer,
        path: event.attrs.path || [],
        community: addCommunityAndDescriptions(event.attrs.community),
        as_info: addASInfo(event.attrs.path),
        type: type,
        timestamp: timestamp
      })
    })

    if (data.data.events.length === 0) {
      maxTimestamp.value = query_unix_endtime // If no events, use the query end time
    } else {
      maxTimestamp.value = events.at(-1).timestamp
    }
    minTimestamp.value = query_unix_starttime
    rawMessages.value = events
    generateLineChartTrace()
  }
}

const generateLineChartData = (data) => {
  const timestamp = data.timestamp
  const peer = data.peer
  if (dataSource.value === 'bgplay') {
    uniqueEventTimestamps.add(timestamp)
  }

  if (data.type === 'Announce') {
    announcementsCount[timestamp] = (announcementsCount[timestamp] || 0) + 1
    updateByTimestamp(data.type)
  } else if (data.type === 'Withdraw') {
    withdrawalsCount[timestamp] = (withdrawalsCount[timestamp] || 0) + 1
    updateByTimestamp(data.type)
  } else if (data.type === 'Initial State') {
    updateByTimestamp(data.type)
  }

  function updateByTimestamp(type) {
    if (dataSource.value === 'ris-live') {
      if (!lastTypeByTimestamp[timestamp]) {
        lastTypeByTimestamp[timestamp] = new Map()
      }
      lastTypeByTimestamp[timestamp].set(peer, type)
    } else {
      if (type === 'Announce' || type === 'Initial State') {
        announcementsPeers.add(peer)
      } else {
        announcementsPeers.delete(peer)
      }
      announcementsPeersCount[timestamp] = announcementsPeers.size
    }
  }
}

const generateLineChartTrace = () => {
  const dTrace = []
  const aTrace = []
  const wTrace = []
  const apTrace = []
  const announcementsPeers = new Set()
  let lastAnnouncementsPeersCount = 0

  if (dataSource.value === 'ris-live') {
    for (let t = minTimestamp.value; t <= maxTimestamp.value; t++) {
      createTimestampTrace(t)
    }
  } else {
    for (let t = minTimestamp.value; t <= maxTimestamp.value; t += 60) {
      uniqueEventTimestamps.add(t)
    }
    const timestamps = [...uniqueEventTimestamps].sort((a, b) => a - b)
    for (const t of timestamps) {
      createTimestampTrace(t)
    }
  }

  function createTimestampTrace(t) {
    dTrace.push(timestampToUTC(t))
    aTrace.push(announcementsCount[t] || 0)
    wTrace.push(withdrawalsCount[t] || 0)

    if (dataSource.value === 'ris-live') {
      const lastTypeMap = lastTypeByTimestamp[t]
      if (lastTypeMap) {
        for (const [peer, type] of lastTypeMap) {
          if (type === 'Announce') announcementsPeers.add(peer)
          else announcementsPeers.delete(peer)
        }
      }
      apTrace.push(announcementsPeers.size)
    } else {
      if (announcementsPeersCount[t] !== undefined) {
        lastAnnouncementsPeersCount = announcementsPeersCount[t]
      }
      apTrace.push(announcementsPeersCount[t] || lastAnnouncementsPeersCount)
    }
  }

  datesTrace.value = dTrace
  announcementsTrace.value = aTrace
  withdrawalsTrace.value = wTrace
  announcementsPeersTraces.value = apTrace
}

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
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

  const source = dataSource.value === 'ris-live' ? asNames.value : bgPlayASNames.value
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

const normalizePrefix = (prefix) => {
  const [ip, length] = prefix.split('/')
  let normalizedIp
  if (Address4.isValid(ip)) {
    normalizedIp = new Address4(ip).correctForm()
  } else if (Address6.isValid(ip)) {
    normalizedIp = new Address6(ip).correctForm()
  } else {
    console.warn(`Invalid prefix: ${prefix}`)
    normalizedIp = ip // use the original IP if invalid
  }
  return length ? `${normalizedIp}/${length}` : normalizedIp
}

// Determine the BGP message type
const addBGPMessageType = (data) => {
  if (dataSource.value === 'ris-live') {
    const withdrawalSet = new Set(data.withdrawals.map(normalizePrefix))
    const announcementSet = new Set((data.announcements[0]?.prefixes || []).map(normalizePrefix))

    if (withdrawalSet.has(normalizedPrefix.value)) {
      return 'Withdraw'
    } else if (announcementSet.has(normalizedPrefix.value)) {
      return 'Announce'
    } else {
      console.warn(`Unknown BGP message type:`, data)
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
    currentIndex.value = rawMessages.value.length - 1
  } else {
    //When using the time slider
    uniquePeerMessages.clear()
    let count = 0

    if (selectedMaxTimestamp.value < rawMessages.value[0].timestamp) {
      currentIndex.value = -1
    }

    for (let i = 0; i < rawMessages.value.length; i++) {
      const msg = rawMessages.value[i]

      const isIndexBased = usingIndex.value && i <= currentIndex.value
      const isTimestampBased = !usingIndex.value && msg.timestamp <= selectedMaxTimestamp.value

      if (isTimestampBased) currentIndex.value = i

      if (isIndexBased || isTimestampBased) {
        uniquePeerMessages.set(msg.peer, msg)
        count++
      } else {
        break
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
  if (isLiveMode.value && dataSource.value === 'ris-live') {
    rawMessages.value.sort((a, b) => a.timestamp - b.timestamp)
  }
  isLiveMode.value = false
}

const enableLiveMode = () => {
  disableUsingIndex()
  isLiveMode.value = true
  setSelectedMaxTimestamp(Infinity)
}

const timestampToUnix = (timestamp) => {
  return Math.floor(new Date(timestamp + 'Z').getTime() / 1000)
}

const disableUsingIndex = () => {
  usingIndex.value = false
}

const nextEvent = () => {
  disableLiveMode()
  if (currentIndex.value < rawMessages.value.length - 1) {
    currentIndex.value++
    usingIndex.value = true
  }
}

const prevEvent = () => {
  disableLiveMode()
  if (currentIndex.value > 0) {
    currentIndex.value--
    usingIndex.value = true
  } else {
    if (initialStateDataCount.value > 0) {
      currentIndex.value = 0
    } else {
      currentIndex.value = -1
    }
  }
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
            ? `${rcc.name} - Multihop (${rcc.geographical_location})`
            : `${rcc.name} - ${rcc.geographical_location}`,
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

  const start = new Date(startTime.value)
  const end = new Date(endTime.value)
  const diffInMs = end.getTime() - start.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  if (diffInDays > 7) {
    const proceed = confirm(
      'The selected time range may result in a large amount of data being loaded. This could affect performance or make the website unresponsive.\n\nDo you want to proceed?'
    )
    if (!proceed) return
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
      prefix: params.value.prefix,
      'max-hops': maxHops.value,
      'data-source': dataSource.value
    }
    if (dataSource.value === 'ris-live') {
      query.rrc = params.value.host
    } else {
      query['start-time'] = startTime.value
      query['end-time'] = endTime.value
      query.rrcs = rrcs.value ? rrcs.value.join(',') : ''
    }
    router.replace({ query })
    normalizedPrefix.value = normalizePrefix(params.value.prefix)
  },
  { deep: true }
)

watch(isPlaying, () => {
  toggleRisProtocol()
})

onMounted(() => {
  initRoute()
  fetchRCCs()
  connectWebSocket()
  fetchAllASInfo()
  fetchGithubFiles()
})
</script>

<template>
  <div class="IHR_char-container">
    <h1 class="text-center q-pa-xl">BGP Monitor</h1>
    <QCard>
      <QCardSection>
        <QMarkupTable flat bordered separator="cell">
          <thead>
            <tr>
              <th>Data Source</th>
              <th>Input</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div>
                  <QRadio
                    v-model="dataSource"
                    val="ris-live"
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
              </td>
              <td>
                <div class="row">
                  <div class="col q-mr-xl q-mt-lg">
                    <QInput
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
                  </div>
                  <div v-if="dataSource === 'ris-live'" class="col-2 q-mr-xl q-mt-lg">
                    <QSelect
                      v-model="params.host"
                      filled
                      :options="rrcList"
                      label="RRC"
                      emit-value
                      :dense="true"
                      color="accent"
                      :disable="isPlaying || inputDisable"
                    />
                  </div>
                  <div v-else class="col-2 q-mr-xl q-mt-lg">
                    <QSelect
                      filled
                      :dense="true"
                      v-model="rrcs"
                      multiple
                      :options="rrcLocations"
                      label="RRCs"
                      emit-value
                      clearable
                      :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
                    />
                  </div>
                  <div class="col-2 q-mr-xl q-mt-lg">
                    <QSlider
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
                </div>
                <div v-if="dataSource === 'bgplay'" class="row">
                  <div class="col-2 q-mr-xl">
                    <QInput
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
                              <QTime flat v-model="startTime" mask="YYYY-MM-DDTHH:mm" format24h />
                            </div>
                          </QPopupProxy>
                        </QIcon>
                      </template>
                    </QInput>
                  </div>
                  <div class="col-2">
                    <QInput
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
                              <QTime flat v-model="endTime" mask="YYYY-MM-DDTHH:mm" format24h />
                            </div>
                          </QPopupProxy>
                        </QIcon>
                      </template>
                    </QInput>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </QMarkupTable>
      </QCardSection>
      <QCardActions align="center">
        <QBtn
          v-if="dataSource === 'ris-live'"
          :color="disableButton ? 'grey-9' : isPlaying ? 'secondary' : 'positive'"
          :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
          :disable="disableButton || params.prefix === '' || params.host === ''"
          @click="toggleConnection"
          class="q-mr-lg"
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
          class="q-mr-lg"
        />
        <QBtn
          color="indigo"
          :label="'Previous'"
          @click="prevEvent"
          :disable="
            rawMessages.length === 0 ||
            (dataSource === 'bgplay'
              ? initialStateDataCount !== 0
                ? currentIndex === 0
                : currentIndex === -1
              : currentIndex === 0)
          "
        />
        <QBtn
          color="indigo"
          :label="'Next'"
          @click="nextEvent"
          :disable="rawMessages.length === 0 || currentIndex === rawMessages.length - 1"
          class="q-mr-lg"
        />
        <QBtn color="negative" :label="'Reset'" @click="resetData" />
      </QCardActions>
    </QCard>
    <div class="row inline q-mt-lg">
      <QBadge class="q-mr-md">
        <div class="text-body2">Displaying Unique Peer messages: {{ filteredMessages.length }}</div>
      </QBadge>
      <QBadge class="q-mr-md">
        <div class="text-body2">Total messages received: {{ rawMessages.length }}</div>
      </QBadge>
      <QBadge v-if="dataSource === 'bgplay'" class="q-mr-md">
        <div class="text-body2">No of Initial State Messages: {{ initialStateDataCount }}</div>
      </QBadge>
      <QBadge v-if="dataSource === 'bgplay'" class="q-mr-md">
        <div class="text-body2">No of Events: {{ rawMessages.length - initialStateDataCount }}</div>
      </QBadge>
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
        :is-no-data="rawMessages.length === 0"
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
        :used-messages-count="usedMessagesCount"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        :is-loading-bgplay-data="isLoadingBgplayData"
        :data-source="dataSource"
        :min-timestamp="minTimestamp"
        :max-timestamp="maxTimestamp"
        :dates-trace="datesTrace"
        :announcements-trace="announcementsTrace"
        :withdrawals-trace="withdrawalsTrace"
        :announcements-peers-traces="announcementsPeersTraces"
        :current-index="currentIndex"
        :using-index="usingIndex"
        @set-selected-max-timestamp="setSelectedMaxTimestamp"
        @disable-live-mode="disableLiveMode"
        @disable-using-index="disableUsingIndex"
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
        :is-loading-bgplay-data="isLoadingBgplayData"
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

<style scoped></style>
