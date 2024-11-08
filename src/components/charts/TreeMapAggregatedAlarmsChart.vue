<script setup>
import { QCardSection } from 'quasar'
import ReactiveChart from './ReactiveChart.vue'
import { ref, computed, watch, onMounted } from 'vue'
import * as TreeMapAggregatedAlarmsDataModel from '@/plugins/models/TreeMapAggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'

const props = defineProps({
  loading: {
    type: Boolean,
    required: true
  },
  alarms: {
    type: Array
  },
  selectSeveritiesList: {
    type: Array
  },
  aggregatedAttrsSelected: {
    type: Object
  },
  countryName: {
    type: String
  },
  alarmTypeTitlesMap: {
    type: Object
  },
  legendSelected: {
    type: String
  },
  isASGranularity: {
    type: Boolean
  }
})

const emits = defineEmits(['treemap-node-clicked'])

const layout = ref({
  autosize: true,
  margin: { t: 10, b: 0, l: 0, r: 0 },
  height: 500
})
const traces = ref([])
const chartTitle = ref('')

const clickProcessing = ref(false)

const noData = computed(() => {
  if (!props.loading && !traces.value.length) {
    return 'No data to show'
  } else if (!props.loading) {
    return false
  } else {
    return 'Loading...'
  }
})

const init = (
  alarms,
  selectSeveritiesList,
  aggregatedAttrsSelected,
  countryName,
  alarmTypeTitlesMap,
  legendSelected,
  isASGranularity,
  render = true
) => {
  if (render) {
    const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
    const treeMapTrace = TreeMapAggregatedAlarmsDataModel.etl(
      alarms,
      aggregatedAttrsZipped,
      countryName,
      alarmTypeTitlesMap,
      legendSelected,
      isASGranularity
    )
    traces.value = !AggregatedAlarmsUtils.isDictEmpty(treeMapTrace) ? [treeMapTrace] : []
  }
  chartTitle.value = TreeMapAggregatedAlarmsDataModel.getChartTitle(
    traces.value?.[0],
    selectSeveritiesList,
    countryName,
    legendSelected,
    isASGranularity
  )
}

const onTreemapNodeClicked = (clickedData) => {
  if (clickProcessing.value) return
  const treemapPointClicked = clickedData.points[0]
  if (treemapPointClicked.pointNumber !== undefined && treemapPointClicked.parent == '') {
    clickProcessing.value = true
    emits('treemap-node-clicked', treemapPointClicked.label)
    setTimeout(() => {
      clickProcessing.value = false
    }, 900)
  }
}

watch(
  () => props.alarms,
  () => {
    init(
      props.alarms,
      props.selectSeveritiesList,
      props.aggregatedAttrsSelected,
      props.countryName,
      props.alarmTypeTitlesMap,
      props.legendSelected,
      props.isASGranularity
    )
  }
)

onMounted(() => {
  init(
    props.alarms,
    props.selectSeveritiesList,
    props.aggregatedAttrsSelected,
    props.countryName,
    props.alarmTypeTitlesMap,
    props.legendSelected,
    props.isASGranularity
  )
})

defineExpose({ init })
</script>

<template>
  <div class="IHR_chart">
    <QCardSection>
      <div class="text-h6 center">{{ chartTitle }}</div>
    </QCardSection>
    <div class="IHR_disco-chart">
      <ReactiveChart
        :layout="layout"
        :traces="traces"
        :no-data="noData"
        @plotly-click="onTreemapNodeClicked"
      />
    </div>
  </div>
</template>
