<script setup>
import NetworkTopologyChart from '@/components/charts/NetworkTopologyChart.vue'
import { QBtn } from 'quasar'
import { GridLayout, GridItem } from 'grid-layout-plus'
import { ref, reactive } from 'vue'

const chartAmount = ref(0)
const layout = reactive([])

const incrementChart = () => {
  chartAmount.value++
  changeLayout()
}

const deleteChart = (id) => {

  const index = layout.findIndex(item => item.i === id)
  if (index > -1) {
    layout.splice(index, 1)
    chartAmount.value--
    adjustLayoutAfterDelete()
  }

}

const getMaxItemsInRow = () => {
  const screenWidth = window.innerWidth
  return screenWidth >= 1800 ? 3 : 2
}

const changeLayout = () => {

  const maxItemsInRow = getMaxItemsInRow()
  const row = Math.floor((chartAmount.value - 1) / maxItemsInRow)
  const col = (chartAmount.value - 1) % maxItemsInRow

  layout.push({
    x: col * (12 / maxItemsInRow),
    y: row * 15,
    w: 12 / maxItemsInRow,
    h: 15,
    i: `${chartAmount.value}`,
    static: true,
    showLegend: false, 
  })

  adjustWidthsToFillRow(maxItemsInRow)
  updateLegends(maxItemsInRow)

}

const adjustWidthsToFillRow = (maxItemsInRow) => {

  const itemsInLastRow = layout.length % maxItemsInRow || maxItemsInRow
  const widthPerItem = 12 / itemsInLastRow
  const startIndex = layout.length - itemsInLastRow

  for (let i = startIndex; i < layout.length; i++) {
    layout[i].w = widthPerItem
    layout[i].x = (i % maxItemsInRow) * widthPerItem
  }

}

const adjustLayoutAfterDelete = () => {

  const maxItemsInRow = getMaxItemsInRow()

  layout.forEach((item, index) => {
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

  layout.forEach(item => item.showLegend = false)

  layout.forEach((item, index) => {
    const isLastInRow = (index + 1) % maxItemsInRow === 0 || index === layout.length - 1
    if (isLastInRow) {
      item.showLegend = true
    }
  })
  
}

</script>

<template>
  <h1 class="text-center">Network Topology Overview</h1>
  <div class="addTopologyButton">
    <QBtn color="secondary" label="Add Topology" @click="incrementChart"/>
  </div>
  <GridLayout v-model:layout="layout" :row-height="30">
    <GridItem v-for="item in layout" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" :static='item.static'>
      <NetworkTopologyChart :searchInput="item.asn || String(2501)" :showLegend="item.showLegend" :id="item.i" @deleteChart="deleteChart"/>
    </GridItem>
  </GridLayout>
</template>

<style>

.addTopologyButton {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

</style>
