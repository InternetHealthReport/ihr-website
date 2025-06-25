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
  isLiveMode: {
    type: Boolean
  },
  isPlaying: {
    type: Boolean
  },
  isLoadingBgplayData: {
    type: Boolean
  },
  dataSource: {
    type: String
  },
  isNoData: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['enable-live-mode'])

const actualChartData = ref([])
const actualChartLayout = ref({})
const nodes = ref(new Map()) //It will constins nodes (asn) data, key is asn and value is [asn, asn_name, country_iso_code2]
const links = ref([])

const generateGraphData = () => {
  nodes.value.clear()
  const sourceArray = []
  const targetArray = []
  const linkSetCount = new Map()

  //Only consider selected peers which are selected in the table
  const peers = props.selectedPeers.map((message) => message.peer)
  const filteredSelectedMessages = props.filteredMessages.filter((message) =>
    peers.includes(message.peer)
  )

  filteredSelectedMessages.forEach((message) => {
    //Only consider bgp type Announce and Initial State messagess
    if (
      !message.path ||
      message.path.length === 0 ||
      message.type === 'Withdraw' ||
      message.type === 'Unknown'
    )
      return
    const path = removeConsecutiveDuplicateAS(message.path).slice(-(props.maxHops + 1)) //+1 for the last AS
    path.forEach((n, i) => {
      if (nodes.value.has(n)) {
        const node = nodes.value.get(n)
        node[3] = node[3] + 1
        nodes.value.set(n, node)
      } else {
        const asn = message.as_info.find((entry) => entry.asn === n)
        nodes.value.set(n, [asn.asn, asn.asn_name, asn.country_iso_code2, 1])
      }
      if (i < path.length - 1) {
        const source = path[i]
        const target = path[i + 1]
        const link = [source, target].join('-')
        if (linkSetCount.has(link)) {
          linkSetCount.set(link, linkSetCount.get(link) + 1)
        } else {
          linkSetCount.set(link, 1)
          sourceArray.push(source)
          targetArray.push(target)
        }
      }
    })
  })

  const nodesArray = Array.from(nodes.value.keys())
  links.value = {
    source: sourceArray.map((node) => nodesArray.indexOf(node)),
    target: targetArray.map((node) => nodesArray.indexOf(node)),
    value: Array.from(linkSetCount.values())
  }
}

const removeConsecutiveDuplicateAS = (arr) => {
  const result = []
  for (let i = 0; i < arr.length; i++) {
    // Always add the first element, and add if the current element is different from the previous element
    if (i === 0 || arr[i] !== arr[i - 1]) {
      result.push(arr[i])
    }
  }
  return result
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
        hovertemplate:
          'AS%{customdata[0]}<br>%{customdata[1]}, %{customdata[2]}<br>Seen by %{customdata[3]} peers<extra></extra>'
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
  generateGraphData()
  renderChart()
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
  <div v-if="isLoadingBgplayData">
    <div class="text-center">
      <h1>Loading...</h1>
    </div>
  </div>
  <div v-else-if="props.isNoData">
    <div class="text-center">
      <h1>No data available</h1>
      <template v-if="dataSource === 'risLive'">
        <h3>Try Changing the Input Parameters or you can wait</h3>
        <h6>Note: Some prefixes become active after some time.</h6>
      </template>
    </div>
  </div>
  <div v-else>
    <div v-if="dataSource === 'risLive'">
      <QBtn v-if="isLiveMode && isPlaying" color="negative" label="Live" />
      <QBtn v-else color="grey-9" label="Go to Live" @click="enableLiveMode" />
    </div>
    <div
      v-if="!props.isNoData && nodes.size === 0"
      class="text-center absolute-center"
      style="z-index: 1"
    >
      <h1>No AS Path</h1>
    </div>
    <ReactiveChart :layout="actualChartLayout" :traces="actualChartData" :new-plot="true" />
  </div>
</template>
