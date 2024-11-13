<script setup>
import NetworkTopologyChart from '@/components/charts/NetworkTopologyChart.vue'
import { QBtn } from 'quasar'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Tr from '@/i18n/translation'
import '@/styles/chart.css'

const route = useRoute()
const router = useRouter()

const chartAmount = ref(0)
const layout = ref([])
const childRefs = ref([])

const isLinkClick = ref(false)

const incrementChart = (searchInput, af, fromLink=false) => {
  chartAmount.value += 1
  changeLayout(searchInput, af)
  if (!fromLink) {
    pushRoute(`[${layout.value.map(obj => obj.searchInput).toString()}]`, `[${layout.value.map(obj => obj.af).toString()}]`)
  }
}

const pushRoute = (searchInput, af) => {
  let query = null
  if (searchInput !== "[]") {
    query = Object.assign({}, route.query, {
      input: searchInput,
      af: af,
    })
  }
  router.push(
    Tr.i18nRoute({
      replace: true,
      query: query
    })
  )
}

const deleteChart = (id) => {
  const index = layout.value.findIndex((item) => item.i === id)
  if (index > -1) {
    layout.value.splice(index, 1)
    chartAmount.value -= 1
    adjustLayoutAfterDelete()
    pushRoute(`[${layout.value.map(obj => obj.searchInput).toString()}]`, `[${layout.value.map(obj => obj.af).toString()}]`)
  }
}

const getMaxItemsInRow = () => {
  const screenWidth = window.innerWidth
  return screenWidth >= 1800 ? 3 : 2
}

const changeLayout = (searchInput, af) => {
  const maxItemsInRow = getMaxItemsInRow()
  const row = Math.floor((chartAmount.value - 1) / maxItemsInRow)
  const col = (chartAmount.value - 1) % maxItemsInRow

  layout.value.push({
    x: col * (12 / maxItemsInRow),
    y: row * 15,
    w: 12 / maxItemsInRow,
    h: 15,
    i: `${chartAmount.value}`,
    static: true,
    searchInput: searchInput,
    af: af,
    showLegend: false
  })

  adjustWidthsToFillRow(maxItemsInRow)
  updateLegends(maxItemsInRow)
}

const adjustWidthsToFillRow = (maxItemsInRow) => {
  const itemsInLastRow = layout.value.length % maxItemsInRow || maxItemsInRow
  const widthPerItem = 12 / itemsInLastRow
  const startIndex = layout.value.length - itemsInLastRow

  if (startIndex >= 0) {
    for (let i = startIndex; i < layout.value.length; i++) {
      layout.value[i].w = widthPerItem
      layout.value[i].x = (i % maxItemsInRow) * widthPerItem
    }
  }
}

const adjustLayoutAfterDelete = () => {
  const maxItemsInRow = getMaxItemsInRow()

  layout.value.forEach((item, index) => {
    const row = Math.floor(index / maxItemsInRow)
    const col = index % maxItemsInRow

    item.x = col * (12 / maxItemsInRow)
    item.w = 12 / maxItemsInRow
    item.y = row * 15
    item.showLegend = false
  })

  adjustWidthsToFillRow(maxItemsInRow)
  updateLegends(maxItemsInRow)
}

const updateLegends = (maxItemsInRow) => {
  layout.value.forEach((item) => (item.showLegend = false))

  layout.value.forEach((item, index) => {
    const isLastInRow = (index + 1) % maxItemsInRow === 0 || index === layout.value.length - 1
    if (isLastInRow) {
      item.showLegend = true
    }
  })
}

const searchChange = (id, newValue) => {
  const index = layout.value.findIndex((item) => item.i === id)
  if (index > -1) {
    layout.value[index].searchInput = newValue.input
    layout.value[index].af = newValue.af
    pushRoute(`[${layout.value.map(obj => obj.searchInput).toString()}]`, `[${layout.value.map(obj => obj.af).toString()}]`)
  }
}

const afChange = (id, newValue) => {
  const index = layout.value.findIndex((item) => item.i === id)
  if (index > -1) {
    layout.value[index].af = newValue
  }
}

const fitScreen = () => {
  childRefs.value.forEach((child) => {
    if (child && typeof child.fitToScreen === 'function') {
      child.fitToScreen()
    }
  })
}

const init = (fromLink=false) => {
  let queryInput = route.query.input
  if (queryInput) {
    queryInput = queryInput.slice(1, -1)
    queryInput = queryInput.split(/,(?![^\[\]]*\])/)
    if (queryInput[0] != '') {
      let af = JSON.parse(route.query.af)
      queryInput.forEach((query, index) => {
        incrementChart(query, af[index], fromLink)
      })
      fitScreen()
    }
  }
}

const setLinkClick = () => {
  isLinkClick.value = true
}

watch(() => route.query, () => {
  if (Object.keys(route.query).length === 0) {
    chartAmount.value = 0
    layout.value = []
    childRefs.value = []
  } else if (isLinkClick.value) {
    init(true)
    isLinkClick.value = false
  }
})

onMounted(async () => {
  init()
})
</script>

<template>
  <div class="IHR_char-container">
    <h1 class="text-center">Network Topology Overview</h1>
    <div class="row justify-center">
      <div v-if="chartAmount == 0" class="IHR_description">
        <p>
          This tool provides a comprehensive platform for researchers and network professionals to
          explore and analyze the topology of an AS or a network prefix.
        </p>
        <p>
          You may begin by either selecting from the examples provided below or by adding a new
          topology.
        </p>
        <div class="row q-pa-sm column items-center">
          <div class="col-6">
            <h3>Examples</h3>
          </div>
        </div>
        <div class="row justify-center">
          <div class="row examples">
            <ul class="ul_styles">
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[2497]`,
                      af: `[4]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  IIJ (AS2497)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[15169]`,
                      af: `[4]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  Google (AS15169)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[2501]`,
                      af: `[4]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  University of Tokyo (AS2501)
                </RouterLink>
              </li>
            </ul>
            <ul class="ul_styles">
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[2404:d540:1::/48]`,
                      af: `[6]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  University of Tokyo (2404:d540:1::/48)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[192.16.51.0/24]`,
                      af: `[4]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  Edgecast (192.16.51.0/24)
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  :to="Tr.i18nRoute({
                    replace: true,
                    query: Object.assign({}, route.query, {
                      input: `[218.47.0.0/16]`,
                      af: `[4]`,
                    })
                  })"
                  @click="setLinkClick"
                  class="IHR_delikify"
                >
                  NTT OCN (218.47.0.0/16)
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    <div class="addTopologyButton">
      <QBtn color="secondary" label="Add Topology" @click="incrementChart(``, ``)" />
    </div>
    {{ layout.value }}
    <GridLayout v-model:layout="layout" :row-height="30">
      <GridItem
        v-for="(item, index) in layout"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
        :static="item.static"
      >
        <NetworkTopologyChart
          :id="item.i"
          :ref="(el) => (childRefs[index] = el)"
          :search-input-p="item.searchInput"
          :af="`IPv` + item.af"
          :show-legend="item.showLegend"
          @delete-chart="deleteChart"
          @search-change="searchChange"
          @af-change="afChange"
        />
      </GridItem>
    </GridLayout>
  </div>
</template>

<style>
.addTopologyButton {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

li {
  font-size: 15px;
  cursor: pointer;
}
</style>
