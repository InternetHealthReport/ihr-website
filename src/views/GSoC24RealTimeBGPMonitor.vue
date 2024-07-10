<script setup>
import { QBtn, QSelect, QInput, QSlider, QRange, QTable, QIcon, QTd, QCheckbox, uid } from 'quasar'
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
const disableTimeRange = ref(false)
const timeRange = ref({
  min: Infinity,
  max: -Infinity
})
const selectedTimeRange = ref({
  min: 0,
  max: 0
})

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
  router.push({ query })
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
    router.push({ query })
  },
  { deep: true }
)

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
  if (!disableTimeRange.value) {
    handleFilterMessages(data)
  }
}

const handleFilterMessages = (data) => {
  if (data) {
    uniquePeerMessages.set(data.peer, data)
  } else {
    filteredMessages.value = []
    uniquePeerMessages.clear()
    const filteredRawMessages = rawMessages.value.filter(
      (message) =>
        message.timestamp >= selectedTimeRange.value.min &&
        message.timestamp <= selectedTimeRange.value.max
    )
    filteredRawMessages.forEach((message) => {
      uniquePeerMessages.set(message.peer, message)
    })
  }
  filteredMessages.value = Array.from(uniquePeerMessages.values())
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
    if (!message.path && message.path.length === 0) return
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
    timestamp: new Date(message.timestamp * 1000).toUTCString(),
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
})

const updateTimeRange = (timestamp) => {
  if (timestamp) {
    if (timestamp > timeRange.value.max) timeRange.value.max = timestamp
    if (timestamp < timeRange.value.min) timeRange.value.min = timestamp
  }
  if (!disableTimeRange.value) {
    selectedTimeRange.value.min = timeRange.value.min
    selectedTimeRange.value.max = timeRange.value.max
  }
}

watch(selectedTimeRange, () => {
  handleFilterMessages()
})

watch(disableTimeRange, () => {
  updateTimeRange()
  handleFilterMessages()
})
</script>

<template>
  <div id="IHR_as-and-ixp-container" class="IHR_char-container">
    <h1 class="text-center q-pa-xl">Real-Time BGP Monitor</h1>
    <div class="controls justify-center q-pa-md flex">
      <QInput outlined placeholder="Prefix" :dense="true" color="accent" v-model="params.prefix" />
      <QInput outlined placeholder="ASN" :dense="true" color="accent" />
      <QSelect
        style="min-width: 100px"
        filled
        v-model="params.host"
        :options="rrcList"
        label="RRC"
        :dense="true"
        color="accent"
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
    <div class="controls justify-center q-pa-md flex">
      <QBtn
        @click="toggleConnection"
        color="secondary"
        :label="disableButton ? 'Connecting' : isPlaying ? 'Pause' : 'Play'"
        :disable="disableButton"
      />
      <div class="replayControls flex">
        <QBtn color="secondary" label="<" />
        <QBtn color="secondary" label="Replay" />
        <QBtn color="secondary" label=">" />
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
    <div class="sankeyChart q-mb-lg" ref="sankeyChart"></div>
    <div class="timeRange">
      <QCheckbox v-model="disableTimeRange" label="Time Range" />
      <QRange
        v-model="selectedTimeRange"
        :min="timeRange.min"
        :max="timeRange.max"
        :disable="!disableTimeRange"
        :left-label-value="'Timestamp: ' + new Date(selectedTimeRange.min * 1000).toUTCString()"
        :right-label-value="'Timestamp: ' + new Date(selectedTimeRange.max * 1000).toUTCString()"
        label-always
        color="accent"
      />
    </div>
  </div>
</template>

<style lang="stylus" scoped>
.controls{
	gap: 30px;
}
.replayControls{
	gap: 20px;
}
.sankeyChart{
  box-shadow: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
  font-weight: 500;
  left 0%
  height 100vh
  width 100%
}
.timeRange {
  display: flex
  flex-direction: column
  gap: 20px
  justify-content: center
  align-items: center
  width: 100%
  overflow: hidden
  padding: 20px
}
</style>
