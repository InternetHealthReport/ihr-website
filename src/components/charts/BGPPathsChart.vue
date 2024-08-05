<script setup>
import { QBtn } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  filteredMessages: {
    type: Array,
    default: () => []
  },
  maxHops: {
    type: Number
  },
  selectedPeers: {
    type: Array,
    default: () => []
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

const emit = defineEmits(['enable-live-mode'])

const actualChartData = ref([])
const actualChartLayout = ref({})
const nodes = ref(new Map()) //It will constins nodes (asn) data, key is asn and value is [asn, asn_name, country_iso_code2]
const links = ref([])

const generateGraphData = () => {
  nodes.value.clear()
  const linkSet = new Set()
  const sourceArray = []
  const targetArray = []
  const valueArray = []

  //Only consider selected peers which are selected in the table
  const peers = props.selectedPeers.map((message) => message.peer)
  const filteredSelectedMessages = props.filteredMessages.filter((message) =>
    peers.includes(message.peer)
  )

  filteredSelectedMessages.forEach((message) => {
    //Only consider bgp type Announce messagess
    if (
      !message.path ||
      message.path.length === 0 ||
      props.bgpMessageType(message) === 'Withdraw' ||
      props.bgpMessageType(message) === 'Unknown'
    )
      return
    const path = message.path.slice(-(props.maxHops + 1)) //+1 for the last as
    path.forEach((n, i) => {
      if (!nodes.value.has(n)) {
        //Avoiding duplicate nodes
        nodes.value.set(n, [n, message.as_info[i].asn_name, message.as_info[i].country_iso_code2])
      }
      if (i < path.length - 1) {
        const source = path[i]
        const target = path[i + 1]
        const link = [source, target].sort().join('-')
        if (!linkSet.has(link) && source !== target) {
          //Avoiding duplicate links
          linkSet.add(link)
          sourceArray.push(source)
          targetArray.push(target)
          valueArray.push(1)
        }
      }
    })
  })

  const nodesArray = Array.from(nodes.value.keys())
  links.value = {
    source: sourceArray.map((node) => nodesArray.indexOf(node)),
    target: targetArray.map((node) => nodesArray.indexOf(node)),
    value: valueArray
  }
}

const renderChart = () => {
  const data = [
    {
      type: 'sankey',
      node: {
        pad: 15,
        thickness: 20,
        line: {
          color: 'black',
          width: 0.5
        },
        label: Array.from(nodes.value.keys()),
        customdata: Array.from(nodes.value.values()),
        hovertemplate: 'AS%{customdata[0]}<br>%{customdata[1]}, %{customdata[2]}<extra></extra>'
      },
      link: links.value
    }
  ]

  const layout = {
    font: {
      size: 12
    },
    margin: { t: 20, b: 20, l: 20, r: 20 }
  }

  actualChartData.value = data
  actualChartLayout.value = layout
}

const init = () => {
  if (props.filteredMessages && props.filteredMessages.length > 0) {
    generateGraphData()
    renderChart()
  }
}

const enableLiveMode = () => {
  emit('enable-live-mode')
}

watch(
  () => props.filteredMessages,
  () => {
    init()
  },
  { deep: true }
)

watch(
  () => props.selectedPeers,
  () => {
    init()
  },
  { deep: true }
)

watch(
  () => props.maxHops,
  () => {
    if (!props.isPlaying || !props.isLiveMode) {
      init()
    }
  },
  { deep: true }
)

onMounted(() => {
  init()
})
</script>

<template>
  <div v-if="props.filteredMessages.length">
    <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
    <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    <ReactiveChart :layout="actualChartLayout" :traces="actualChartData" :newPlot="true" />
  </div>
  <div v-else class="noData">
    <h1>No data available</h1>
    <h3>Try Changing the Input Parameters or you can wait</h3>
    <h6>Note: Some prefixes become active after some time.</h6>
  </div>
</template>

<style>
.noData {
  text-align: center;
}
</style>
