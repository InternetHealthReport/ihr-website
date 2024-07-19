<script setup>
import { QBtn, QSelect, QInput, QSlider, QTable, QIcon, QTd, QCheckbox, uid } from 'quasar'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Plotly from 'plotly.js-dist'
import axios from 'axios'

const maxHops = ref(3)
const isPlaying = ref(false)
const rrcList = ref([])
const disableButton = ref(false)
const socket = ref(null)
const rawMessages = ref([])
const filteredMessages = ref([])
const uniquePeerMessages = new Map()
const nodes = ref([])
const links = ref([])
const sankeyChart = ref(null)
const search = ref('')
const selectedPeers = ref([])
const defaultSelectedPeerCount = ref(5)
const communities = ref([])
const disableTimestampSlider = ref(false)
const timestampSlider = ref({
  min: Infinity,
  max: -Infinity
})
const selectedMaxTimestamp = ref(0)
const usedMessagesCount = ref(0)
const lineChart = ref(null)
const messageCounts = ref({})

const params = ref({
  peer: '',
  path: '',
  prefix: '2600:40fc:1004::/48', //2600:40fc:1004::/48 , 196.249.102.0/24 , 170.238.225.0/24
  type: 'UPDATE',
  require: '',
  moreSpecific: true,
  lessSpecific: false,
  host: '',
  socketOptions: {
    includeRaw: false,
    acknowledge: false
  }
})

const route = useRoute()
const router = useRouter()

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

watch(
  params,
  () => {
    resetData()
  },
  { deep: true }
)

const resetData = () => {
  isPlaying.value = false
  rawMessages.value = []
  filteredMessages.value = []
  uniquePeerMessages.clear()
  nodes.value = []
  links.value = []
  search.value = ''
  selectedPeers.value = []
  defaultSelectedPeerCount.value = 5
  disableTimestampSlider.value = false
  timestampSlider.value = {
    min: Infinity,
    max: -Infinity
  }
  selectedMaxTimestamp.value = 0
  usedMessagesCount.value = 0
  messageCounts.value = {}
  chartData.value.x = []
  chartData.value.y = []
  removeVerticalLine()
}

const sendSocketType = (protocol, paramData) => {
  socket.value.send(
    JSON.stringify({
      type: protocol,
      data: paramData
    })
  )
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

const handleMessages = (data) => {
  if (data.community && Array.isArray(data.community)) {
    // Add descriptions to community data
    data.community = data.community.map(([comm_1, comm_2]) => {
      const community = `${comm_1}:${comm_2}`
      const description = findCommunityDescription(community)
      return { community: community, comm_1: comm_1, description: description }
    })
  }
  data.timestamp = Math.floor(data.timestamp)

  if (
    defaultSelectedPeerCount.value > 0 &&
    !selectedPeers.value.some((peer) => peer.peer === data.peer)
  ) {
    selectedPeers.value.push({ peer: data.peer })
    defaultSelectedPeerCount.value--
  }

  updateTimeRange(data.timestamp)
  rawMessages.value.push(data)
  if (!disableTimestampSlider.value) {
    handleFilterMessages(data)
  }
  generateLineChartData(data)
}

const handleFilterMessages = (data) => {
  if (data) {
    uniquePeerMessages.set(data.peer, data)
    usedMessagesCount.value = rawMessages.value.length
  } else {
    filteredMessages.value = []
    uniquePeerMessages.clear()
    const filteredRawMessages = rawMessages.value.filter(
      (message) => message.timestamp <= selectedMaxTimestamp.value
    )

    usedMessagesCount.value = filteredRawMessages.length

    filteredRawMessages.forEach((message) => {
      uniquePeerMessages.set(message.peer, message)
    })
  }
  filteredMessages.value = Array.from(uniquePeerMessages.values())
}

const isBgpMessageTypeAnnounce = (data) => {
  if (data.announcements[0]?.prefixes.includes(params.value.prefix)) {
    return true
  } else if (data.withdrawals.includes(params.value.prefix)) {
    return false
  }
}

const generateGraphData = () => {
  const nodeSet = new Set()
  const linkSet = new Set()
  const sourceArray = []
  const targetArray = []
  const valueArray = []

  const peers = selectedPeers.value.map((message) => message.peer)
  const filteredSelectedMessages = filteredMessages.value.filter((message) =>
    peers.includes(message.peer)
  )

  filteredSelectedMessages.forEach((message) => {
    if (!message.path || message.path.length === 0 || !isBgpMessageTypeAnnounce(message)) return
    const path = message.path.slice(-(maxHops.value + 1))
    path.forEach((n, i) => {
      nodeSet.add(n)
      if (i < path.length - 1) {
        const source = path[i]
        const target = path[i + 1]
        const link = [source, target].sort().join('-')
        if (!linkSet.has(link) && source !== target) {
          linkSet.add(link)
          sourceArray.push(source)
          targetArray.push(target)
          valueArray.push(1)
        }
      }
    })
  })

  nodes.value = Array.from(nodeSet)
  links.value = {
    source: sourceArray.map((node) => nodes.value.indexOf(node)),
    target: targetArray.map((node) => nodes.value.indexOf(node)),
    value: valueArray
  }
}

watch(
  [filteredMessages, maxHops, selectedPeers],
  () => {
    generateGraphData()
    //console.log("Message Paths",JSON.parse(JSON.stringify(filteredMessages.value)))
    //console.log("Nodes",JSON.parse(JSON.stringify(nodes.value)))
    //console.log("Links",JSON.parse(JSON.stringify(links.value)))
  },
  { deep: true }
)

const toggleConnection = () => {
  isPlaying.value = !isPlaying.value
}

watch(isPlaying, () => {
  toggleRisProtocol()
})

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

const layout = ref({
  title: 'AS Paths Sankey Diagram',
  font: {
    size: 12
  }
})

const config = ref({ responsive: true })

const plotSankey = () => {
  const data = {
    type: 'sankey',
    node: {
      pad: 15,
      thickness: 20,
      line: {
        color: 'black',
        width: 0.5
      },
      label: nodes.value
    },
    link: links.value
  }
  Plotly.newPlot(sankeyChart.value, [data], layout.value, config.value)
}

watch([nodes, links], () => {
  plotSankey()
})

const columns = [
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
]

const rows = computed(() =>
  filteredMessages.value.map((message) => ({
    peer_asn: message.peer_asn,
    peer: message.peer,
    path: message.path?.length > 0 ? JSON.stringify(message.path) : 'Null',
    type: isBgpMessageTypeAnnounce(message) ? 'Announce' : 'Withdraw',
    timestamp: timestampToUTC(message.timestamp),
    community:
      message.community?.length > 0
        ? message.community
            .map((c) => `${c.community}, ${'AS' + c.comm_1}-${c.description}`)
            .join('\n')
        : 'Null'
  }))
)

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

const matchPattern = (community, communityToFind) => {
  if (community.split(':').length !== 2 || communityToFind.split(':').length !== 2) return false
  // Exact Match
  if (community === communityToFind) return true

  const [pattern_1, pattern_2] = community.split(':')
  const [comm_1, comm_2] = communityToFind.split(':')

  // Range Match
  if (pattern_2.includes('-')) {
    const [start, end] = pattern_2.split('-').map(Number)
    const commNumber = Number(comm_2)
    if (pattern_1 === comm_1 && commNumber >= start && commNumber <= end) {
      //console.log('Range', community, communityToFind)
      return true
    }
  }

  // Single Digit Wildcard Match
  if (pattern_2.includes('x')) {
    const regex = new RegExp(`^${pattern_2.replace('x', '\\d')}$`)
    if (pattern_1 === comm_1 && regex.test(comm_2)) {
      //console.log('Wildcard', community, communityToFind)
      return true
    }
  }

  // Any Number Match
  if (pattern_2.includes('nnn')) {
    const regex = new RegExp(`^${pattern_2.replace('nnn', '\\d+')}$`)
    if (pattern_1 === comm_1 && regex.test(comm_2)) {
      //console.log('Any', community, communityToFind)
      return true
    }
  }

  return false
}

const findCommunityDescription = (communityToFind) => {
  const community = communities.value.find((c) => matchPattern(c.community, communityToFind))
  return community ? community.description : 'Null'
}

onMounted(() => {
  connectWebSocket()
  plotSankey()
  fetchGithubFiles()
  initRoute()
  initMessagesRecivedLineChart()
})

const timestampToUTC = (timestamp) => {
  return new Date(timestamp * 1000).toUTCString()
}

const updateTimeRange = (timestamp) => {
  if (timestamp) {
    if (timestamp > timestampSlider.value.max) timestampSlider.value.max = timestamp
    if (timestamp < timestampSlider.value.min) timestampSlider.value.min = timestamp
  }
  if (!disableTimestampSlider.value) {
    selectedMaxTimestamp.value = timestampSlider.value.max
  }
}

watch(selectedMaxTimestamp, () => {
  if (disableTimestampSlider.value) {
    handleFilterMessages()
    addVerticalLine(selectedMaxTimestamp.value)
  }
})

watch(disableTimestampSlider, () => {
  updateTimeRange()
  handleFilterMessages()
  if (disableTimestampSlider.value) {
    addVerticalLine(selectedMaxTimestamp.value)
  } else {
    removeVerticalLine()
  }
})

const chartData = ref({
  x: [],
  y: [],
  type: 'line',
  line: { shape: 'linear' },
  marker: { size: 8 }
})

const chartLayout = ref({
  title: 'Messages Received Over Time',
  xaxis: { title: 'Timestamp' },
  yaxis: { title: 'New Messages', rangemode: 'tozero' },
  shapes: []
})

const generateLineChartData = (data) => {
  // Round the new data's timestamp to the nearest second
  const timestamp = Math.floor(data.timestamp)
  // Incrementally update the message count for this timestamp
  if (!messageCounts.value[timestamp]) {
    messageCounts.value[timestamp] = 0
  }
  messageCounts.value[timestamp]++
  // Extract the keys (timestamps) and values (counts) from the map
  const timestamps = Object.keys(messageCounts.value)
    .map(Number)
    .sort((a, b) => a - b)
  // Generate a complete list of timestamps from the minimum to the maximum
  const minTimestamp = timestamps[0]
  const maxTimestamp = timestamps[timestamps.length - 1]
  const completeTimestamps = []
  for (let t = minTimestamp; t <= maxTimestamp; t++) {
    completeTimestamps.push(t)
  }
  const dates = completeTimestamps.map((timestamp) => new Date(timestamp * 1000).toISOString())
  const counts = completeTimestamps.map((timestamp) => messageCounts.value[timestamp] || 0)
  chartData.value.x = dates
  chartData.value.y = counts
}

const updateMessagesRecivedLineChart = () => {
  Plotly.update(lineChart.value, [chartData.value], chartLayout.value, config.value)
}

watch(
  chartData,
  () => {
    updateMessagesRecivedLineChart()
  },
  { deep: true }
)

const initMessagesRecivedLineChart = () => {
  Plotly.newPlot(lineChart.value, [chartData.value], chartLayout.value, config.value)
  lineChart.value.on('plotly_click', handlePlotlyClick)
}

const addVerticalLine = (timestamp) => {
  const x = new Date(timestamp * 1000).toISOString()
  const shape = {
    type: 'line',
    x0: x,
    x1: x,
    y0: 0,
    y1: 1,
    xref: 'x',
    yref: 'paper',
    line: {
      color: 'red',
      width: 2,
      dash: 'dashdot'
    }
  }
  chartLayout.value.shapes = [shape]
  updateMessagesRecivedLineChart()
}

const removeVerticalLine = () => {
  chartLayout.value.shapes = []
  updateMessagesRecivedLineChart()
}

const handlePlotlyClick = (event) => {
  const point = event.points[0]
  if (point) {
    const timestamp = Math.floor(new Date(point.x + 'Z').getTime() / 1000)
    disableTimestampSlider.value = true
    selectedMaxTimestamp.value = timestamp
    addVerticalLine(timestamp)
  }
}
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
          :disable="disableButton"
        />
        <QBtn @click="resetData" color="negative" :label="'Reset'" :disable="isPlaying" />
      </div>
      <div class="stats">
        <span>Displaying Unique Peer messages: {{ filteredMessages.length }}</span>
        <span>Total messages received: {{ rawMessages.length }}</span>
      </div>
    </div>
    <div class="q-mb-lg">
      <QTable
        flat
        bordered
        title="RIS Live Messages"
        :rows="rows"
        :columns="columns"
        :filter="search"
        row-key="peer"
        selection="multiple"
        v-model:selected="selectedPeers"
      >
        <template v-slot:top-right>
          <QInput dense outlined debounce="300" color="accent" label="Search" v-model="search">
            <template v-slot:append>
              <QIcon name="search" />
            </template>
          </QInput>
        </template>
        <template v-slot:body-cell-community="props">
          <QTd :props="props">
            <pre>{{ props.row.community }}</pre>
          </QTd>
        </template>
      </QTable>
    </div>
    <div class="chartContainer q-mb-lg">
      <div class="sankeyChart" ref="sankeyChart"></div>
      <div v-if="rawMessages.length === 0" class="noData">
        <h1>No data available</h1>
        <h3>Try Changing the Input Parameters or you can wait</h3>
        <h6>Note: Some prefixes become active after some time.</h6>
      </div>
    </div>
    <div class="timetampSlider">
      <div class="timeStampControls">
        <QCheckbox v-model="disableTimestampSlider" label="Select Timestamp" />
        <span>Using: {{ usedMessagesCount + '/' + rawMessages.length }} Messages</span>
      </div>
      <QSlider
        v-model="selectedMaxTimestamp"
        :min="timestampSlider.min === Infinity ? 0 : timestampSlider.min"
        :max="timestampSlider.max === -Infinity ? 0 : timestampSlider.max"
        :disable="!disableTimestampSlider"
        label-always
        :label-value="'Timestamp: ' + timestampToUTC(selectedMaxTimestamp)"
        color="accent"
      />
      <div class="timestampInfo">
        <span
          >Min Timestamp:
          {{
            timestampSlider.min === Infinity ? 'No Data' : timestampToUTC(timestampSlider.min)
          }}</span
        >
        <span
          >Max Timestamp:
          {{
            timestampSlider.max === -Infinity ? 'No Data' : timestampToUTC(timestampSlider.max)
          }}</span
        >
      </div>
    </div>
    <div class="chartContainer q-mb-lg">
      <div ref="lineChart"></div>
      <div v-if="rawMessages.length === 0" class="noData">
        <h1>No data available</h1>
        <h3>Try Changing the Input Parameters or you can wait</h3>
        <h6>Note: Some prefixes become active after some time.</h6>
      </div>
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.controls{
	gap: 30px;
}
.chartContainer{
  position: relative
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  width 100%
}
.sankeyChart{
  height 100vh
  width 100%
}
.timetampSlider {
  display: flex
  flex-direction: column
  gap: 20px
  justify-content: center
  align-items: center
  width: 100%
  overflow: hidden
  padding: 20px
}
.timestampInfo{
  width 100%
  display: flex
  align-items: center
  justify-content: space-between
}
.timeStampControls{
  display: flex
  align-items: center
  justify-content: center
  gap:50px
}
.controlsContainer{
  display: flex
  align-items: center
  justify-content: center
  gap:50px
}
.stats{
  display: flex
  flex-direction: column
}
.noData{
  position: absolute
  top: 50%
  left: 50%
  transform: translate(-50%, -50%)
  display:flex
  flex-direction: column
  align-items: center
  justify-content: center
}
</style>
