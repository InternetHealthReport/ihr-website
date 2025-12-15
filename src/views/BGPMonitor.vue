<script setup>
import {
  QBtn,
  QSelect,
  QInput,
  uid,
  QDialog,
  QCard,
  QCardSection,
  QCardActions,
  QIcon,
  QDate,
  QTime,
  QPopupProxy,
  QExpansionItem,
  QItemSection
} from 'quasar'
import { onMounted, onUnmounted, ref, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const RIS_LIVE_UNSUPPORTED_RRCS = [2, 8, 9, 17]

const ripe_api = inject('ripe_api')
const rpki_api = inject('rpki_api')
const github_api = inject('github_api')

const { t } = i18n.global
const { utcString } = report()

const isPlaying = ref(false)
const disableButton = ref(false)
const socket = ref(null)
const rawMessages = ref([]) //Used to store all the messages from the websocket
const filteredMessages = ref([]) //Used to store unique peer messages uses "uniquePeerMessages = new Map()""
const uniquePeerMessages = new Map() //Used to store unique peer messages (For simplification)
const communityInfo = ref({})
const defaultSelectedPeerCount = ref(5) //Default number of peers to display in the sankey chart
const isLiveMode = ref(true)
const selectedMaxTimestamp = ref(0)
const usedMessagesCount = ref(0) //Just for displaying how many messages are being used
const asNames = ref({}) // AS Info from asnames.txt file
const inputDisable = ref(false)
const isWsDisconnected = ref(false)
const normalizedPrefix = ref('') // Used to store the normalized prefix to determine the BGP message type
let normalizedPrefixLength = null

const dataSourceOptions = ref([
  { label: 'BGPlay', value: 'bgplay' },
  { label: 'RisLive', value: 'ris-live' }
])
const dataSource = ref(dataSourceOptions.value[0])
const minTimestamp = ref(Infinity)
const maxTimestamp = ref(-Infinity)

const startTime = ref(
  new Date(new Date().getTime() - 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
)
const endTime = ref(new Date(new Date().getTime() - 12 * 60 * 60 * 1000).toISOString().slice(0, 16))
const tempStartTime = ref(startTime.value)
const tempEndTime = ref(endTime.value)

const rrcs = ref([0])
const rrcLocations = ref([])
const isLoadingBgplayData = ref(false)
const bgPlaySources = ref({}) // Used to store the "sources" for BGPlay
const bgPlayASNames = ref({}) // Used to store the AS names we get from the BGPlay nodes Array
const bgPlayAdditionalMessagesReceived = ref(false)
const bgPlayAdditionalMessages = ref([]) // Used to store any additional messages from BGPlay (res.data.messages[]) e.g warnings, errors etc
const initialStateDataCount = ref(0)
const datesTrace = ref([])
const announcementsTrace = ref([])
const withdrawalsTrace = ref([])
const announcementsPeersTraces = ref([])
const rpkiStatusTraces = ref([])
let announcementsCount = {}
let withdrawalsCount = {}
let eventsByTimestamp = {}
let announcementsPeersCountByOrigin = {}
let announcementsPeersByOrigin = {}
let peerToOrigin = {}
let rpkiPeerToOrigin = {}
const allOriginAsns = new Set()
const uniqueEventTimestamps = new Set()
const currentIndex = ref(-1)
const usingIndex = ref(false)
let hasValidPrefix = false

let vrps = []
let vrp_timestamps = []
const isNoVrpData = ref(false)
const vrpTableData = ref([])

const params = ref({
  peer: '',
  path: '',
  prefix: '84.205.65.0/24', //2600:40fc:1004::/48 , 196.249.102.0/24 , 170.238.225.0/24, 202.164.222.0/24
  type: 'UPDATE',
  require: '',
  moreSpecific: false,
  lessSpecific: false,
  host: 0,
  socketOptions: {
    includeRaw: false,
    acknowledge: false
  }
})

const route = useRoute()
const router = useRouter()

const toggleConnection = () => {
  if (!onLoad()) {
    return
  }
  inputDisable.value = true
  isPlaying.value = !isPlaying.value
}

// Reset all the data
const resetData = () => {
  isPlaying.value = false
  rawMessages.value = []
  filteredMessages.value = []
  uniquePeerMessages.clear()
  defaultSelectedPeerCount.value = 5
  isLiveMode.value = true
  selectedMaxTimestamp.value = 0
  usedMessagesCount.value = 0
  inputDisable.value = false

  bgPlaySources.value = {}
  bgPlayAdditionalMessagesReceived.value = false
  bgPlayAdditionalMessages.value = []
  bgPlayASNames.value = {}
  minTimestamp.value = Infinity
  maxTimestamp.value = -Infinity
  initialStateDataCount.value = 0
  datesTrace.value = []
  announcementsTrace.value = []
  withdrawalsTrace.value = []
  announcementsPeersTraces.value = []
  rpkiStatusTraces.value = []
  announcementsCount = {}
  withdrawalsCount = {}
  announcementsPeersCountByOrigin = {}
  announcementsPeersByOrigin = {}
  peerToOrigin = {}
  rpkiPeerToOrigin = {}
  allOriginAsns.clear()
  eventsByTimestamp = {}
  uniqueEventTimestamps.clear()
  currentIndex.value = -1
  usingIndex.value = false
  vrps = []
  vrp_timestamps = []
  isNoVrpData.value = false
  vrpTableData.value = []
}

// Connect to the WebSocket
const connectWebSocket = () => {
  if (!socket.value) {
    socket.value = new WebSocket(`wss://ris-live.ripe.net/v1/ws/?client=ihr_${uid()}`)
  }
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
    socket.value.close()
    socket.value = null
  }
  socket.value.onmessage = (event) => {
    const res = JSON.parse(event.data)
    if (res.type === 'ris_message') {
      processResData(res.data)
    } else if (res.type === 'ris_error') {
      console.log('Ris Live Error:', res.data.message)
    }
  }
}

const toggleRisProtocol = () => {
  if (!socket.value) {
    // If websocket is not connected
    connectWebSocket()
  } else if (isPlaying.value) {
    const subscribeParams = {
      ...params.value,
      host: rrcLocations.value.find((rrc) => rrc.value === params.value.host).host
    }
    sendSocketType('ris_subscribe', subscribeParams)
  } else {
    socket.value.close()
    socket.value = null
  }
}

//Stringify and send the socket type
const sendSocketType = (protocol, paramData) => {
  console.log(paramData)
  socket.value.send(
    JSON.stringify({
      type: protocol,
      data: paramData
    })
  )
}

const processResData = (data) => {
  if (dataSource.value.value === 'ris-live') {
    data.community = addCommunityAndDescriptions(data.community)
    data.as_info = addASInfo(data.path)
    data.type = addBGPMessageType(data)
    // Modify the timestamp to be in seconds
    data.timestamp = Math.floor(data.timestamp)

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
      peer: data.peer,
      peer_asn: data.peer_asn,
      origin_asn: data.path.length ? data.path[data.path.length - 1] : null
    })
    generateLineChartTrace()
  } else {
    if (data.messages.length > 0) {
      bgPlayAdditionalMessages.value = data.messages
      bgPlayAdditionalMessagesReceived.value = true
      return
    }

    //Temp variables to reduce the vue reactivity
    const sources = {}
    const nodes = {}
    const events = []

    minTimestamp.value = timestampToUnix(data.data.query_starttime)
    maxTimestamp.value = timestampToUnix(data.data.query_endtime)

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
      const path = event.path || []
      const originASN = path.length ? path[path.length - 1] : null
      const peer_asn = peerInfo.as_number
      const { status } = getRPKIStatus(originASN, minTimestamp.value)

      if (!rrcs.value.includes(Number(peerInfo.rrc))) return // Filter out peers not in the selected RRCs

      generateLineChartData({
        timestamp: minTimestamp.value,
        type: type,
        peer: peer,
        peer_asn: peer_asn,
        origin_asn: originASN
      })

      // initialStateDataCount.value++ // Uncomment for including initial state

      events.push({
        peer_asn: peerInfo.as_number,
        rrc: peerInfo.rrc,
        peer: peer,
        path: path,
        community: addCommunityAndDescriptions(event.community),
        as_info: addASInfo(path),
        type: type,
        rpki_status: status,
        timestamp: minTimestamp.value
      })
    })

    data.data.events.forEach((event) => {
      const peer = event.attrs.source_id.split('-')[1]
      const peerInfo = sources[peer]
      const timestamp = timestampToUnix(event.timestamp)
      const type = addBGPMessageType(event.type)
      const path = event.attrs.path || []
      const originASN = path.length ? path[path.length - 1] : null
      const peer_asn = peerInfo.as_number
      const { status } = getRPKIStatus(originASN, timestamp)

      generateLineChartData({
        timestamp: timestamp,
        type: type,
        peer: peer,
        peer_asn: peer_asn,
        origin_asn: originASN
      })

      events.push({
        peer_asn: peerInfo.as_number,
        rrc: peerInfo.rrc,
        peer: peer,
        path: path,
        community: addCommunityAndDescriptions(event.attrs.community),
        as_info: addASInfo(path),
        type: type,
        rpki_status: status,
        timestamp: timestamp
      })
    })
    rawMessages.value = events
    generateLineChartTrace()
  }
}

const generateLineChartData = (data) => {
  const { timestamp, peer, type, origin_asn, peer_asn } = data

  if (dataSource.value.value === 'bgplay') {
    uniqueEventTimestamps.add(timestamp)
  }

  updateTypeByTimestamp()
  updateOriginByTimestamp()
  updateRpkiByTimestamp()

  function updateTypeByTimestamp() {
    if (type === 'Announce') {
      announcementsCount[timestamp] = (announcementsCount[timestamp] || 0) + 1
    } else if (type === 'Withdraw') {
      withdrawalsCount[timestamp] = (withdrawalsCount[timestamp] || 0) + 1
    }
  }

  function updateRpkiByTimestamp() {
    if (dataSource.value.value === 'bgplay') {
      const key = `${peer_asn}-${peer}`
      rpkiPeerToOrigin[key] ??= []
      const oldData = rpkiPeerToOrigin[key][rpkiPeerToOrigin[key].length - 1]
      if (type === 'Withdraw') {
        if (oldData && oldData.timestamp === timestamp) {
          rpkiPeerToOrigin[key].pop()
        }
        rpkiPeerToOrigin[key].push({
          origin_asn: 0,
          timestamp: timestamp
        })
      } else {
        if (!oldData || oldData.origin_asn !== origin_asn) {
          if (oldData && oldData.timestamp === timestamp) {
            rpkiPeerToOrigin[key].pop()
          }
          rpkiPeerToOrigin[key].push({
            origin_asn: origin_asn,
            timestamp: timestamp
          })
        }
      }
    }
  }

  function updateOriginByTimestamp() {
    if (type === 'Unknown') return

    if (dataSource.value.value === 'ris-live') {
      eventsByTimestamp[timestamp] ??= []
      eventsByTimestamp[timestamp].push({ peer, type, origin_asn })
    } else {
      helperUpdateOriginByTimestamp(announcementsPeersByOrigin, type, peer, origin_asn)
      announcementsPeersCountByOrigin[timestamp] ??= {}
      for (const [asn, peers] of Object.entries(announcementsPeersByOrigin)) {
        announcementsPeersCountByOrigin[timestamp][asn] = peers.size
      }
    }
  }
}

const helperUpdateOriginByTimestamp = (collection, type, peer, origin_asn) => {
  const old_origin_asn = peerToOrigin[peer]

  if (type === 'Announce' || type === 'Initial State') {
    allOriginAsns.add(origin_asn)
    collection[origin_asn] ??= new Set()

    if (old_origin_asn && old_origin_asn !== origin_asn) {
      // Peer changed origin ASN so we need to remove it from the old ASN set
      collection[old_origin_asn]?.delete(peer)
    }

    collection[origin_asn].add(peer)
    peerToOrigin[peer] = origin_asn
  } else if (type === 'Withdraw') {
    collection[old_origin_asn]?.delete(peer)
    delete peerToOrigin[peer]
  }
}

const generateLineChartTrace = () => {
  const dTrace = []
  const aTrace = []
  const wTrace = []
  let rsTrace = {}

  const apTracesByOrigin = {}
  const activePeersByAsn = {}
  let lastCountsByOrigin = {}

  if (dataSource.value.value === 'ris-live') {
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
    if (isNoVrpData.value === false) {
      generateRpkiChartData()
    }
  }

  function createTimestampTrace(t) {
    dTrace.push(timestampToUTC(t))
    aTrace.push(announcementsCount[t] || 0)
    wTrace.push(withdrawalsCount[t] || 0)

    if (dataSource.value.value === 'ris-live') {
      const events = eventsByTimestamp[t] || []
      for (const { peer, type, origin_asn } of events) {
        helperUpdateOriginByTimestamp(activePeersByAsn, type, peer, origin_asn)
      }
    } else {
      const countsByOrigin = announcementsPeersCountByOrigin[t]
      if (countsByOrigin) {
        lastCountsByOrigin = countsByOrigin
      }
    }

    for (const asn of allOriginAsns) {
      if (!apTracesByOrigin[asn]) {
        apTracesByOrigin[asn] = []
      }
      apTracesByOrigin[asn].push(
        dataSource.value.value === 'ris-live'
          ? activePeersByAsn[asn]?.size || 0
          : lastCountsByOrigin[asn] || 0
      )
    }
  }

  function generateRpkiChartData() {
    for (const [key, origins] of Object.entries(rpkiPeerToOrigin)) {
      const [peer_asn, peer] = key.split('-')
      const check_timestamps = vrp_timestamps
        .concat(origins)
        .sort((a, b) => a.timestamp - b.timestamp)

      let current_status = 'Withdrawn'
      let current_origin = null
      let current_range_start = null

      for (const { origin_asn, timestamp } of check_timestamps) {
        if (origin_asn === 0) {
          if (current_status !== 'Withdrawn') {
            addData(timestamp)
          }
          current_status = 'Withdrawn'
          current_origin = null
          current_range_start = null
        } else if (origin_asn === -1) {
          if (current_status === 'Withdrawn') continue

          const new_status = getRPKIStatus(current_origin, timestamp).status
          if (current_status != new_status) {
            addData(timestamp)
            current_status = new_status
            current_range_start = timestamp
          }
        } else {
          if (current_status !== 'Withdrawn') {
            addData(timestamp)
          }
          current_origin = origin_asn
          current_status = getRPKIStatus(current_origin, timestamp).status
          current_range_start = timestamp
        }
      }

      const endTimeUnix = timestampToUnix(endTime.value)
      if (current_range_start && current_range_start < endTimeUnix) {
        addData(endTimeUnix)
      }

      function addData(timestamp) {
        const duration = timestamp - current_range_start - 1
        rsTrace[current_status] ??= { y: [], x: [], base: [], peer_asn: [], origin_asn: [] }
        rsTrace[current_status].y.push(peer)
        rsTrace[current_status].x.push(timestampToUTC(duration))
        rsTrace[current_status].base.push(timestampToUTC(current_range_start))
        rsTrace[current_status].peer_asn.push(peer_asn)
        rsTrace[current_status].origin_asn.push(current_origin)
      }
    }
  }

  datesTrace.value = dTrace
  announcementsTrace.value = aTrace
  withdrawalsTrace.value = wTrace
  announcementsPeersTraces.value = apTracesByOrigin
  rpkiStatusTraces.value = rsTrace
}

const timestampToUTC = (timestamp) => {
  return utcString(new Date(timestamp * 1000))
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

  const source = dataSource.value.value === 'ris-live' ? asNames.value : bgPlayASNames.value
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

const normalizePrefix = (prefix, isUserInputPrefix) => {
  const [ip, length] = prefix.split('/')
  let normalizedIp
  if (Address4.isValid(ip)) {
    normalizedIp = new Address4(ip).correctForm()
  } else if (Address6.isValid(ip)) {
    normalizedIp = new Address6(ip).correctForm()
  } else {
    console.warn(`Invalid Ip, prefix: ${prefix}`)
    normalizedIp = ip // use the original IP if invalid (should never happen)
  }
  if (length) {
    if (isUserInputPrefix === true) {
      normalizedPrefixLength = Number(length)
    }
    hasValidPrefix = true
    return `${normalizedIp}/${length}`
  } else {
    console.warn(`Prefix length missing, prefix: ${prefix}`) // should never happen
    hasValidPrefix = false
    return normalizedIp
  }
}

// Determine the BGP message type
const addBGPMessageType = (data) => {
  if (dataSource.value.value === 'ris-live') {
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

const handleVrpTableData = () => {
  if (dataSource.value.value === 'ris-live') return
  let tableData = []
  for (const vrp of vrps) {
    if (
      selectedMaxTimestamp.value < vrp.unixVisibleFrom ||
      selectedMaxTimestamp.value > vrp.unixVisibleTo
    ) {
      continue
    }
    tableData.push(vrp)
  }
  vrpTableData.value = tableData
}

const setSelectedMaxTimestamp = (val) => {
  selectedMaxTimestamp.value = val
  handleFilterMessages()
  handleVrpTableData()
}

const disableLiveMode = () => {
  if (isLiveMode.value && dataSource.value.value === 'ris-live') {
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
    const res = await ripe_api.rccInfo()
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
        value: rcc.id,
        host: `${rcc.name.toLowerCase()}.ripe.net`
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
  if (!onLoad()) {
    return
  }

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
    const res = await ripe_api.getBgpData(
      params.value.prefix,
      startTime.value,
      endTime.value,
      rrcs.value
    )
    console.log('Data fetched successfully, Processing Data...')
    await getCoveringVrpsForPrefix()
    processResData(res.data)
  } catch (error) {
    console.error('Error fetching BGPlay data:', error)
  } finally {
    isLoadingBgplayData.value = false
  }
}

// Fetching the communities from the GitHub repository
const fetchGithubFiles = async () => {
  try {
    const response = await github_api.get_repo(
      'https://api.github.com/repos/NLNOG/lg.ring.nlnog.net/contents/communities'
    )
    const files = response.data
    const txtFiles = files.filter(
      (file) =>
        (file.name.startsWith('as') && file.name.endsWith('.txt')) || file.name === 'well-known.txt'
    )
    const fetchFilePromises = txtFiles.map((file) => github_api.get_file(file.download_url))
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

const getCoveringVrpsForPrefix = async () => {
  try {
    const startTimeUnix = timestampToUnix(startTime.value)
    const endTimeUnix = timestampToUnix(endTime.value)

    const res = await rpki_api.vrp(params.value.prefix, startTimeUnix, endTimeUnix)

    res.data.map((vrp, i) => {
      const [ip, prefixLength] = vrp.prefix.split('/')
      const data = {
        ...vrp,
        id: i,
        ip,
        prefixLength: Number(prefixLength),
        unixVisibleFrom: timestampToUnix(vrp.visible.from.split('+')[0]),
        unixVisibleTo: timestampToUnix(vrp.visible.to.split('+')[0])
      }
      vrps.push(data)
    })

    vrp_timestamps = calculateVrpChangeTimestamps(vrps)

    function calculateVrpChangeTimestamps(vrpData) {
      const vrpTimestamps = new Set()

      for (const vrp of vrpData) {
        const visibleFrom = vrp.unixVisibleFrom
        const visibleTo = vrp.unixVisibleTo + 1 // add +1 second

        if (visibleFrom >= startTimeUnix && visibleFrom <= endTimeUnix) {
          vrpTimestamps.add(visibleFrom)
        }

        if (visibleTo >= startTimeUnix && visibleTo <= endTimeUnix) {
          vrpTimestamps.add(visibleTo)
        }
      }
      return Array.from(vrpTimestamps)
        .sort((a, b) => a - b)
        .map((t) => ({ origin_asn: -1, timestamp: t }))
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      isNoVrpData.value = true
      console.warn(error.response.data)
      return
    }
    console.error('Error fetching VRPs:', error)
  }
}

const getRPKIStatus = (asn, timestamp) => {
  if (!asn || !timestamp) return { status: 'Null' }
  if (isNoVrpData.value) return { status: 'No Data' }
  if (!vrps || vrps.length === 0) return { status: 'Not Found' }

  let covering_vrp_exists = false
  let same_origin_asn_found = false

  for (const vrp of vrps) {
    if (timestamp < vrp.unixVisibleFrom || timestamp > vrp.unixVisibleTo) {
      continue
    }
    covering_vrp_exists = true

    if (vrp.asn !== asn || vrp.asn === 0) {
      continue
    }
    same_origin_asn_found = true

    if (normalizedPrefixLength <= vrp.max_length) {
      return { status: 'Valid' }
    }
  }

  if (same_origin_asn_found) {
    return {
      status: 'Invalid (More Specific)',
      reason: {
        code: 'prefixTooLong',
        description:
          'Covering VRP with matching origin ASN found, but prefix length exceeds allowed maxLength.'
      }
    }
  }

  if (covering_vrp_exists) {
    return {
      status: 'Invalid (No Matching Origin)',
      reason: {
        code: 'noMatchingOrigin',
        description: 'Covering VRP found, but no matching origin ASN.'
      }
    }
  }
  return { status: 'Not Found' }
}

const updateSelectedPeers = (val) => {
  defaultSelectedPeerCount.value = val
}

const applyStartTime = () => {
  startTime.value = tempStartTime.value
}

const applyEndTime = () => {
  endTime.value = tempEndTime.value
}

const resetTempValues = () => {
  tempStartTime.value = startTime.value
  tempEndTime.value = endTime.value
}

const onLoad = () => {
  params.value.prefix = params.value.prefix.trim()
  startTime.value = startTime.value.trim()
  endTime.value = endTime.value.trim()

  normalizedPrefix.value = normalizePrefix(params.value.prefix, true)
  if (!hasValidPrefix) {
    return false
  }

  const query = {
    prefix: params.value.prefix,
    'data-source': dataSource.value.value
  }
  if (dataSource.value.value === 'ris-live') {
    query.rrc = params.value.host
  } else {
    query['start-time'] = startTime.value
    query['end-time'] = endTime.value
    query.rrcs = rrcs.value ? rrcs.value.join(',') : ''
  }
  router.replace({ query })
  return true
}

const loadOnMount = () => {
  if (Object.keys(route.query).length !== 0) {
    const dataSourceQuery = route.query['data-source']
    const prefixQuery = route.query['prefix']
    const startTimeQuery = route.query['start-time']
    const endTimeQuery = route.query['end-time']
    const rrcsQuery = route.query['rrcs']
    const rrcQuery = route.query['rrc']
    dataSource.value = dataSourceOptions.value.find((obj) => obj.value === dataSourceQuery)
    if (dataSource.value.value === 'ris-live') {
      if (prefixQuery && rrcQuery) {
        params.value.prefix = prefixQuery
        params.value.host = Number(rrcQuery)
        toggleConnection()
      }
    } else if (dataSource.value.value === 'bgplay') {
      if (prefixQuery && startTimeQuery && endTimeQuery && rrcsQuery) {
        params.value.prefix = prefixQuery
        startTime.value = startTimeQuery
        endTime.value = endTimeQuery
        rrcs.value = rrcsQuery.split(',').map((val) => Number(val))
        fetchBGPlayData()
      }
    }
  }
}

watch(isPlaying, () => {
  toggleRisProtocol()
})

onMounted(async () => {
  await fetchRCCs()
  await fetchAllASInfo()
  await fetchGithubFiles()
  loadOnMount()
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.close()
    socket.value = null
  }
})
</script>

<template>
  <div class="IHR_char-container relative-position">
    <h1 class="text-center q-pa-xl">BGP Monitor</h1>
    <QCard>
      <QCardSection>
        <div class="row">
          <div class="col-2 q-mr-xl">
            <QSelect
              outlined
              label="Data Source"
              :options="dataSourceOptions"
              v-model="dataSource"
              :disable="
                isPlaying ||
                inputDisable ||
                Object.keys(bgPlaySources).length > 0 ||
                isLoadingBgplayData
              "
            />
          </div>
          <div class="col">
            <div class="row items-center">
              <div class="col q-mr-xl">
                <QInput
                  v-model="params.prefix"
                  outlined
                  label="Prefix"
                  color="accent"
                  :disable="
                    isPlaying ||
                    inputDisable ||
                    Object.keys(bgPlaySources).length > 0 ||
                    isLoadingBgplayData
                  "
                />
              </div>
              <div v-if="dataSource.value === 'bgplay'" class="row">
                <QInput
                  label="Start Date Time in (UTC)"
                  v-model="tempStartTime"
                  class="q-mr-xl"
                  :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
                  outlined
                >
                  <template v-slot:append>
                    <QIcon name="event" class="cursor-pointer">
                      <QPopupProxy no-route-dismiss cover @hide="resetTempValues">
                        <div class="q-pa-md q-gutter-md row items-start">
                          <QDate flat v-model="tempStartTime" mask="YYYY-MM-DDTHH:mm" />
                          <QTime flat v-model="tempStartTime" mask="YYYY-MM-DDTHH:mm" format24h />
                        </div>
                        <div class="row items-center justify-end q-ma-md">
                          <QBtn v-close-popup class="primary q-mr-sm" label="Close" outline />
                          <QBtn
                            v-close-popup
                            @click="applyStartTime"
                            class="bg-primary applyBtnStyle"
                            label="Apply"
                            outline
                          />
                        </div>
                      </QPopupProxy>
                    </QIcon>
                  </template>
                </QInput>
                <QInput
                  label="End Date Time in (UTC)"
                  v-model="tempEndTime"
                  class="q-mr-xl"
                  :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
                  outlined
                >
                  <template v-slot:append>
                    <QIcon name="event" class="cursor-pointer">
                      <QPopupProxy no-route-dismiss cover @hide="resetTempValues">
                        <div class="q-pa-md q-gutter-md row items-start">
                          <QDate flat v-model="tempEndTime" mask="YYYY-MM-DDTHH:mm" />
                          <QTime flat v-model="tempEndTime" mask="YYYY-MM-DDTHH:mm" format24h />
                        </div>
                        <div class="row items-center justify-end q-ma-md">
                          <QBtn v-close-popup class="primary q-mr-sm" label="Close" outline />
                          <QBtn
                            v-close-popup
                            @click="applyEndTime"
                            class="bg-primary applyBtnStyle"
                            label="Apply"
                            outline
                          />
                        </div>
                      </QPopupProxy>
                    </QIcon>
                  </template>
                </QInput>
              </div>
              <div v-if="dataSource.value === 'ris-live'" class="col-2">
                <QSelect
                  v-model="params.host"
                  outlined
                  :options="
                    rrcLocations.filter((val) => !RIS_LIVE_UNSUPPORTED_RRCS.includes(val.value))
                  "
                  label="RRC"
                  emit-value
                  color="accent"
                  :disable="isPlaying || inputDisable"
                />
              </div>
              <div v-else class="col-2">
                <QSelect
                  outlined
                  v-model="rrcs"
                  multiple
                  :options="rrcLocations"
                  label="RRCs"
                  emit-value
                  clearable
                  :disable="Object.keys(bgPlaySources).length > 0 || isLoadingBgplayData"
                />
              </div>
            </div>
          </div>
        </div>
      </QCardSection>
      <QCardActions align="center" class="q-pb-md q-pt-none">
        <QBtn
          v-if="dataSource.value === 'ris-live'"
          :color="disableButton ? 'grey-9' : isPlaying ? 'secondary' : 'positive'"
          :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
          :disable="disableButton || params.prefix === '' || params.host === ''"
          @click="toggleConnection"
          class="q-mr-lg"
        />
        <QBtn
          v-else
          color="secondary"
          :label="'Load'"
          @click="fetchBGPlayData"
          :disable="
            Object.keys(bgPlaySources).length > 0 ||
            isLoadingBgplayData ||
            !haveRequiredBGPlayParams()
          "
          class="q-mr-lg"
        />
        <QBtn color="negative" :label="'Reset'" @click="resetData" />
      </QCardActions>
    </QCard>
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
        :data-source="dataSource.value"
        :min-timestamp="minTimestamp"
        :max-timestamp="maxTimestamp"
        :dates-trace="datesTrace"
        :announcements-trace="announcementsTrace"
        :withdrawals-trace="withdrawalsTrace"
        :announcements-peers-traces="announcementsPeersTraces"
        :rpki-status-traces="rpkiStatusTraces"
        :is-no-vrp-data="isNoVrpData"
        :vrp-table-data="vrpTableData"
        :current-index="currentIndex"
        :using-index="usingIndex"
        :initial-state-data-count="initialStateDataCount"
        @set-selected-max-timestamp="setSelectedMaxTimestamp"
        @disable-live-mode="disableLiveMode"
        @disable-using-index="disableUsingIndex"
        @enable-live-mode="enableLiveMode"
        @prev-event="prevEvent"
        @next-event="nextEvent"
      />
    </GenericCardController>
    <GenericCardController
      :title="$t('bgpAsPaths.title')"
      :sub-title="$t('bgpAsPaths.subTitle')"
      :info-title="$t('bgpAsPaths.info.title')"
      :info-description="$t('bgpAsPaths.info.description')"
      class="q-my-lg"
    >
      <BGPPathsChart
        :filtered-messages="filteredMessages"
        :selected-peers-number="defaultSelectedPeerCount"
        :is-live-mode="isLiveMode"
        :is-playing="isPlaying"
        :is-loading-bgplay-data="isLoadingBgplayData"
        :data-source="dataSource.value"
        :is-no-data="rawMessages.length === 0"
        @enable-live-mode="enableLiveMode"
      />
      <QExpansionItem
        v-if="rawMessages.length"
        default-opened
        dense
        class="expansion-header"
        expand-icon-class="text-white"
      >
        <template v-slot:header>
          <QItemSection>
            <div>
              <div class="text-h6">
                {{ $t('bgpMessagesTable.title') }}
              </div>
              <div class="text-subtitle2">
                {{ $t('bgpMessagesTable.subTitle') }}
              </div>
            </div>
          </QItemSection>
        </template>
        <BGPMessagesTable
          :data-source="dataSource.value"
          :filtered-messages="filteredMessages"
          :selected-peers-number="defaultSelectedPeerCount"
          :is-live-mode="isLiveMode"
          :is-playing="isPlaying"
          :is-loading-bgplay-data="isLoadingBgplayData"
          @enable-live-mode="enableLiveMode"
          @update-selected-peers="updateSelectedPeers"
        />
      </QExpansionItem>
    </GenericCardController>
    <QDialog v-model="isWsDisconnected">
      <QCard>
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
    <QDialog v-model="bgPlayAdditionalMessagesReceived">
      <QCard>
        <QCardSection>
          <div class="text-h6">Important Information from BGPlay</div>
        </QCardSection>
        <QCardSection class="q-pt-none">
          <div v-for="(msg, index) in bgPlayAdditionalMessages" :key="index">
            <p v-for="(data, i) in msg" :key="i">
              {{ data }}
            </p>
          </div>
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
.applyBtnStyle {
  color: rgba(255, 255, 255);
}
.expansion-header {
  background-color: #263238;
  color: #fff;
}
</style>
