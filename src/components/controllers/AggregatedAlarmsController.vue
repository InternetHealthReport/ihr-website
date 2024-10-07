<script setup>
import {
  QCard,
  QCardSection,
  QMarkupTable,
  QCheckbox,
  QSelect,
  QBtn,
  QTabs,
  QTab,
  QSeparator,
  QTabPanels,
  QTabPanel,
  QTooltip,
  QIcon,
  QInput,
  QTime,
  QDate
} from 'quasar'
import { ref, computed, inject, watch } from 'vue'
import WorldMapAggregatedAlarmsChart from '@/components/charts/WorldMapAggregatedAlarmsChart.vue'
import TimeSeriesAggregatedAlarmsChart from '@/components/charts/TimeSeriesAggregatedAlarmsChart.vue'
import TreeMapAggregatedAlarmsChart from '@/components/charts/TreeMapAggregatedAlarmsChart.vue'
import * as TableAggregatedAlarmsDataModel from '@/plugins/models/TableAggregatedAlarmsDataModel'
import * as AggregatedAlarmsDataModel from '@/plugins/models/AggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import AggregatedAlarmsTable from '@/components/tables/AggregatedAlarmsTable.vue'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'

const ihr_api = inject('ihr_api')

const SEVERITY_LEVELS = [
  {
    label: 'Low',
    value: 'low'
  },
  {
    label: 'Medium',
    value: 'medium'
  },
  {
    label: 'High',
    value: 'high'
  }
]

const IP_ADDRESS_FAMILIES = [
  {
    label: 'IPv4',
    value: 4
  },
  {
    label: 'IPv6',
    value: 6
  }
]

const props = defineProps({
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  hegemonyAlarms: {
    type: Array,
    required: true
  },
  networkDelayAlarms: {
    type: Array,
    required: true
  },
  networkDisconnectionAlarms: {
    type: Array,
    required: true
  },
  hegemonyLoading: {
    type: Boolean,
    required: true
  },
  networkDelayLoading: {
    type: Boolean,
    required: true
  },
  networkDisconnectionLoading: {
    type: Boolean,
    required: true
  }
})

const selectedDataSources = ref({})
const selectedAlarmTypes = ref({})
const selectedAlarmTypesOptions = ref({})
const selectSeveritiesLevels = ref(SEVERITY_LEVELS)
const selectIPAddressFamilies = ref(IP_ADDRESS_FAMILIES)
const aggregatedAlarmsLoadingVal = ref(false)
const thirdPartyAlarmsStates = ref({
  grip: null,
  ioda: null
})
const alarms = ref({
  raw: [],
  filter: []
})
const aggregatedAttrs = ref({})
const selectedCountry = ref(null)
const legendSelected = ref({ legend: null, opacity: null })
const minTimeFormatted = ref(props.startTime.toISOString().slice(0, 16))
const maxTimeFormatted = ref(props.endTime.toISOString().slice(0, 16))
const startTimeFormatted = ref(props.startTime.toISOString().slice(0, 16))
const endTimeFormatted = ref(props.endTime.toISOString().slice(0, 16))
const aggregatedAlarmsTab = ref('hegemony')
const filter = ref('')

const worldMapRef = ref(null)
const timeSeriesRef = ref(null)
const treeMapRef = ref(null)
const tableRef = ref(null)

const etlAggregatedAlarmsDataModel = () => {
  aggregatedAlarmsLoadingVal.value = true
  const selectedAlarmTypesFlattened = AggregatedAlarmsUtils.flattenDictionary(
    selectedAlarmTypes.value
  )
  const selectedAlarmTypesOptionsFlattened = AggregatedAlarmsUtils.flattenDictionary(
    selectedAlarmTypesOptions.value
  )
  const ihrAlarms = [
    props.hegemonyAlarms,
    props.networkDelayAlarms,
    props.networkDisconnectionAlarms
  ].flat()
  const startUnixTime = new Date(props.startTime).getTime() / 1000
  const endUnixTime = new Date(props.endTime).getTime() / 1000
  AggregatedAlarmsDataModel.etl(
    selectedDataSources.value,
    ALARMS_INFO,
    selectedAlarmTypesFlattened,
    selectedAlarmTypesOptionsFlattened,
    ihrAlarms,
    thirdPartyAlarmsStates.value,
    iodaIPAddressFamilies.value,
    startUnixTime,
    endUnixTime
  )
    .then((data) => {
      alarms.value.raw = data
      filterAlarmsHelper()
      aggregatedAlarmsLoadingVal.value = false
    })
    .catch((error) => {
      console.error(error)
    })
}

const iodaIPAddressFamilies = computed(() => {
  const result = {}
  Object.keys(selectedDataSources.value).forEach((dataSource) => {
    if (dataSource === 'ioda') {
      Object.keys(selectedAlarmTypes.value[dataSource]).forEach((alarmType) => {
        const ipAddressFamilies =
          ALARMS_INFO[dataSource].alarm_types[alarmType].metadata.ipAddressFamilies
        result[alarmType] = Object.entries(ipAddressFamilies)
          .filter((val) => val[1])
          .map((val) => val[0])
      })
    }
  })
  return result
})

const aggregatedAttrsSelected = () => {
  const aggregatedAttrsSelected = {
    counts: [],
    timebins: [],
    severities: [],
    ipAddressFamilies: []
  }
  for (const dataSource in selectedDataSources.value) {
    const alarmTypes = selectedAlarmTypes.value[dataSource]
    for (const alarmType in alarmTypes) {
      if (selectedAlarmTypes.value[dataSource][alarmType]) {
        aggregatedAttrsSelected.counts.push(`${alarmType}_count`)
        aggregatedAttrsSelected.timebins.push(`${alarmType}_timebin`)
        aggregatedAttrsSelected.severities.push(`${alarmType}_severity`)
        aggregatedAttrsSelected.ipAddressFamilies.push(
          Object.values(
            ALARMS_INFO[dataSource].alarm_types[alarmType].metadata.group_by_key_options
          ).map((groupByKey) => `${alarmType}_${groupByKey}_af`)
        )
      }
    }
  }
  aggregatedAttrs.value = aggregatedAttrsSelected
}

const alarmTypeTitlesMap = computed(() => {
  const alarmTypesToTitles = {}
  for (const dataSource in ALARMS_INFO) {
    const dataSourceAlarmTypes = ALARMS_INFO[dataSource].alarm_types
    for (const dataSourceAlarmTypeKey in dataSourceAlarmTypes) {
      const dataSourceAlarmTypeTitle = dataSourceAlarmTypes[dataSourceAlarmTypeKey].metadata.title
      alarmTypesToTitles[dataSourceAlarmTypeKey] = dataSourceAlarmTypeTitle
    }
  }
  return alarmTypesToTitles
})

const maxAlarmTypesLength = computed(() => {
  let maxAlarmTypesLength = 0
  for (const dataSourceKey in ALARMS_INFO) {
    selectedDataSources.value[dataSourceKey] = true
    selectedAlarmTypes.value[dataSourceKey] = {}
    selectedAlarmTypesOptions.value[dataSourceKey] = {}
    const alarmTypes = Object.keys(ALARMS_INFO[dataSourceKey].alarm_types)
    maxAlarmTypesLength = Math.max(maxAlarmTypesLength, alarmTypes.length)
    alarmTypes.forEach(
      (alarm) =>
        (selectedAlarmTypes.value[dataSourceKey][alarm] =
          ALARMS_INFO[dataSourceKey].alarm_types[alarm].metadata.is_default_selected || false)
    )
    alarmTypes.forEach(
      (alarm) =>
        (selectedAlarmTypesOptions.value[dataSourceKey][alarm] =
          ALARMS_INFO[dataSourceKey].alarm_types[alarm].metadata.default_key)
    )
  }
  return maxAlarmTypesLength
})

const loadingVal = computed(() => {
  return (
    props.hegemonyLoading ||
    props.networkDelayLoading ||
    props.networkDisconnectionLoading ||
    aggregatedAlarmsLoadingVal.value
  )
})

const filterAlarmsHelper = () => {
  const selectSeveritiesList = selectSeveritiesLevels.value.map((obj) => obj.value)
  const selectIPAddressFamiliesList = selectIPAddressFamilies.value.map((obj) => obj.value)
  const alarmsFiltered = AggregatedAlarmsDataModel.filterAlarms(
    alarms.value.raw,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectSeveritiesList,
    selectIPAddressFamiliesList,
    selectedCountry.value
  )
  alarms.value.filter = alarmsFiltered
}

const timeFilter = (timeFilterObj) => {
  startTimeFormatted.value = timeFilterObj.startDateTime
  endTimeFormatted.value = timeFilterObj.endDateTime
  const selectSeveritiesList = selectSeveritiesLevels.value.map((obj) => obj.value)
  const selectIPAddressFamiliesList = selectIPAddressFamilies.value.map((obj) => obj.value)
  const alarmsFiltered = AggregatedAlarmsDataModel.filterAlarms(
    alarms.value.raw,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectSeveritiesList,
    selectIPAddressFamiliesList,
    selectedCountry.value
  )
  alarms.value.filter = alarmsFiltered
}

const resetTime = () => {
  const selectSeveritiesList = selectSeveritiesLevels.value.map((obj) => obj.value)
  const selectIPAddressFamiliesList = selectIPAddressFamilies.value.map((obj) => obj.value)
  const alarmsFiltered = AggregatedAlarmsDataModel.filterAlarms(
    alarms.value.raw,
    props.startTime,
    props.endTime,
    aggregatedAttrs.value,
    selectSeveritiesList,
    selectIPAddressFamiliesList,
    selectedCountry.value
  )
  alarms.value.filter = alarmsFiltered
  startTimeFormatted.value = props.startTime.toISOString().slice(0, 16)
  endTimeFormatted.value = props.endTime.toISOString().slice(0, 16)
}

const isLoaded = computed(() => {
  if (props.hegemonyLoading || props.networkDelayLoading || props.networkDisconnectionLoading) {
    return true
  }
  return false
})

const resetGranularity = () => {
  selectedCountry.value = legendSelected.value.legend = legendSelected.value.opacity = null
  const selectSeveritiesList = selectSeveritiesLevels.value.map((obj) => obj.value)
  const selectIPAddressFamiliesList = selectIPAddressFamilies.value.map((obj) => obj.value)
  const alarmsFiltered = AggregatedAlarmsDataModel.filterAlarms(
    alarms.value.raw,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectSeveritiesList,
    selectIPAddressFamiliesList,
    selectedCountry.value
  )
  alarms.value.filter = alarmsFiltered
  filter.value = ''
}

const getDataSourceFromSelectedAlarmType = (val) => {
  let selectedKey = null
  Object.keys(selectedAlarmTypes.value).forEach((keyA) => {
    Object.keys(selectedAlarmTypes.value[keyA]).forEach((keyB) => {
      if (keyB === val) {
        selectedKey = keyA
        return
      }
    })
    if (selectedKey) {
      return
    }
  })
  return selectedKey
}

const onCountryClicked = (newCountryClicked) => {
  legendSelected.value.legend = legendSelected.value.opacity = null
  selectedCountry.value = newCountryClicked
  const countryFilter = AggregatedAlarmsDataModel.filterAlarmsByCountry(
    alarms.value.filter,
    selectedCountry.value
  )
  alarms.value.filter = countryFilter
  filter.value = selectedCountry.value
}

const onTreemapNodeClicked = (newNodeClickedLabel) => {
  if (legendSelected.value.legend !== newNodeClickedLabel) {
    legendSelected.value.legend = newNodeClickedLabel
    legendSelected.value.opacity = 1
  } else {
    legendSelected.value.legend = null
    legendSelected.value.opacity = 0.5
  }
  const selectSeveritiesLevelsList = selectSeveritiesLevels.value.map((obj) => obj.value)
  treeMapRef.value.init(
    alarms.value.filter,
    selectSeveritiesLevelsList,
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false,
    false
  )
  timeSeriesRef.value.init(
    alarms.value.filter,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false
  )
  filter.value = TableAggregatedAlarmsDataModel.normalizeTableSearchQuery(
    legendSelected.value.legend
  )
}

const onTimeseriesLegendClicked = (newLegend) => {
  if (newLegend.opacity < 1) {
    legendSelected.value = newLegend
  } else {
    if (legendSelected.value.legend === newLegend.legend) {
      legendSelected.value.legend = null
      legendSelected.value.opacity = 0.5
    }
  }
  const selectSeveritiesLevelsList = selectSeveritiesLevels.value.map((obj) => obj.value)
  treeMapRef.value.init(
    alarms.value.filter,
    selectSeveritiesLevelsList,
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false
  )
  timeSeriesRef.value.init(
    alarms.value.filter,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false,
    false
  )
  filter.value = TableAggregatedAlarmsDataModel.normalizeTableSearchQuery(
    legendSelected.value.legend
  )
}

const onASNameClicked = (asnKeyClicked) => {
  onCountryClicked(asnKeyClicked.country)
  const newASNKeyClicked = asnKeyClicked.asName
  if (legendSelected.value.legend !== newASNKeyClicked) {
    legendSelected.value.legend = newASNKeyClicked
    legendSelected.value.opacity = 1
  } else {
    legendSelected.value.legend = null
    legendSelected.value.opacity = 0.5
  }
  const selectSeveritiesLevelsList = selectSeveritiesLevels.value.map((obj) => obj.value)
  treeMapRef.value.init(
    alarms.value.filter,
    selectSeveritiesLevelsList,
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false
  )
  timeSeriesRef.value.init(
    alarms.value.filter,
    new Date(`${startTimeFormatted.value}:00Z`),
    new Date(`${endTimeFormatted.value}:00Z`),
    aggregatedAttrs.value,
    selectedCountry.value,
    alarmTypeTitlesMap.value,
    legendSelected.value.legend,
    false
  )
  filter.value = TableAggregatedAlarmsDataModel.normalizeTableSearchQuery(
    legendSelected.value.legend
  )
}

const init = () => {
  Object.keys(selectedAlarmTypes.value).forEach((key) => {
    selectedDataSources.value[key] = Object.values(selectedAlarmTypes.value[key]).some(Boolean)
  })
  aggregatedAttrsSelected()
  etlAggregatedAlarmsDataModel()
}

watch(
  () => props.hegemonyAlarms,
  () => {
    init()
  }
)

watch(
  () => props.networkDelayAlarms,
  () => {
    init()
  }
)

watch(
  () => props.networkDisconnectionAlarms,
  () => {
    init()
  }
)

watch(selectSeveritiesLevels, () => {
  filterAlarmsHelper()
})

watch(selectIPAddressFamilies, () => {
  filterAlarmsHelper()
})

watch(selectedAlarmTypes.value, () => {
  init()
})

watch(selectedAlarmTypesOptions.value, () => {
  init()
})
</script>

<template>
  <div>
    <QCard>
      <QCardSection>
        <QMarkupTable flat bordered separator="cell">
          <thead>
            <tr>
              <th>Data Source</th>
              <th :colspan="maxAlarmTypesLength">Alarm Types</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(dataSource, indexSource) in ALARMS_INFO"
              :key="indexSource"
              class="q-tr--no-hover"
            >
              <td>
                <QCheckbox v-model="selectedDataSources[indexSource]" disable />{{
                  dataSource.metadata.title
                }}
                <QIcon name="fas fa-circle-info">
                  <QTooltip>
                    {{ ALARMS_INFO[indexSource].metadata.description }}
                  </QTooltip>
                </QIcon>
              </td>
              <td v-for="(dataAlarm, indexAlarm) in dataSource.alarm_types" :key="indexAlarm">
                <QCheckbox
                  v-model="selectedAlarmTypes[indexSource][indexAlarm]"
                  :disable="isLoaded"
                />{{ dataAlarm.metadata.title }}
                <QIcon name="fas fa-circle-info">
                  <QTooltip>
                    {{ ALARMS_INFO[indexSource].alarm_types[indexAlarm].metadata.description }}
                  </QTooltip>
                </QIcon>
                <QSelect
                  filled
                  v-model="selectedAlarmTypesOptions[indexSource][indexAlarm]"
                  :options="
                    Object.values(
                      ALARMS_INFO[indexSource].alarm_types[indexAlarm].metadata.group_by_key_options
                    )
                  "
                  :disable="isLoaded || !selectedAlarmTypes[indexSource][indexAlarm]"
                />
              </td>
              <td
                v-for="i in maxAlarmTypesLength - Object.keys(dataSource.alarm_types).length"
                :key="`empty-cell-${i}`"
              ></td>
            </tr>
          </tbody>
        </QMarkupTable>
        <br />
        <div class="row">
          <div class="col-auto">
            <div class="row">
              <div class="col">
                <QInput
                  type="datetime-local"
                  v-model="startTimeFormatted"
                  label="From (UTC)"
                  :disable="isLoaded"
                  :min="minTimeFormatted"
                  :max="maxTimeFormatted"
                />
              </div>
              <div class="col-auto" style="width: 40px"></div>
              <div class="col">
                <QInput
                  type="datetime-local"
                  v-model="endTimeFormatted"
                  label="To (UTC)"
                  :disable="isLoaded"
                  :min="minTimeFormatted"
                  :max="maxTimeFormatted"
                />
              </div>
            </div>
            <div class="row" style="margin-top: 20px">
              <div class="col-5 text-center">
                <QBtn
                  color="primary"
                  class="float-right"
                  @click="
                    timeFilter({ startDateTime: startTimeFormatted, endDateTime: endTimeFormatted })
                  "
                  :disable="isLoaded"
                >
                  APPLY
                </QBtn>
              </div>
              <div class="col-4 text-center">
                <QBtn color="primary" class="float-right" @click="resetTime" :disable="isLoaded">
                  RESET TIME
                </QBtn>
              </div>
            </div>
          </div>
          <div class="col offset-md-1">
            <QSelect
              :disable="isLoaded"
              outlined
              multiple
              v-model="selectSeveritiesLevels"
              :options="SEVERITY_LEVELS"
              label="Severity Levels:"
              stack-label
              use-chips
            />
          </div>
          <div class="col offset-md-1">
            <QSelect
              :disable="isLoaded"
              outlined
              multiple
              v-model="selectIPAddressFamilies"
              :options="IP_ADDRESS_FAMILIES"
              label="IP Address Families:"
              stack-label
              use-chips
            />
          </div>
          <div class="col">
            <QBtn color="primary" class="float-right" @click="resetGranularity" :disable="isLoaded"
              >Show All Countries</QBtn
            >
          </div>
        </div>
      </QCardSection>
    </QCard>
    <QCard class="card">
      <QCardSection>
        <WorldMapAggregatedAlarmsChart
          ref="worldMapRef"
          :loading="loadingVal"
          :alarms="alarms.filter"
          :aggregated-attrs-selected="aggregatedAttrs"
          :alarm-type-titles-map="alarmTypeTitlesMap"
          :selected-country="selectedCountry"
          @country-clicked="onCountryClicked"
        />
      </QCardSection>
    </QCard>
    <div class="row">
      <div class="col q-mr-md">
        <QCard class="card">
          <QCardSection>
            <div class="row items-center">
              <div class="col">
                <QBtn color="primary" class="full-width" @click="resetTime" :disable="isLoaded">
                  RESET TIME
                </QBtn>
              </div>
              <div class="col">
                <QBtn
                  color="primary"
                  class="full-width"
                  @click="resetGranularity"
                  :disable="isLoaded"
                >
                  Show All Countries
                </QBtn>
              </div>
            </div>
          </QCardSection>
          <QCardSection>
            <TimeSeriesAggregatedAlarmsChart
              ref="timeSeriesRef"
              :loading="loadingVal"
              :country-name="selectedCountry"
              :alarms="alarms.filter"
              :start-time="new Date(`${startTimeFormatted}:00Z`)"
              :end-time="new Date(`${endTimeFormatted}:00Z`)"
              :aggregated-attrs-selected="aggregatedAttrs"
              :alarm-type-titles-map="alarmTypeTitlesMap"
              :legend-selected="legendSelected.legend"
              :isASGranularity="false"
              @timeseries-legend-clicked="onTimeseriesLegendClicked"
              @select-time="timeFilter"
            />
          </QCardSection>
        </QCard>
      </div>
      <div class="col">
        <QCard class="card">
          <QCardSection>
            <div class="col">
              <QBtn
                color="primary"
                class="full-width"
                @click="resetGranularity"
                :disable="isLoaded"
              >
                Show All Countries
              </QBtn>
            </div>
          </QCardSection>
          <QCardSection>
            <TreeMapAggregatedAlarmsChart
              ref="treeMapRef"
              :loading="loadingVal"
              :country-name="selectedCountry"
              :alarms="alarms.filter"
              :select-severities-list="selectSeveritiesLevels.map((obj) => obj.value)"
              :aggregated-attrs-selected="aggregatedAttrs"
              :alarm-type-titles-map="alarmTypeTitlesMap"
              :legend-selected="legendSelected.legend"
              :isASGranularity="false"
              @treemap-node-clicked="onTreemapNodeClicked"
            />
          </QCardSection>
        </QCard>
      </div>
    </div>
    <QCard class="card">
      <QTabs v-model="aggregatedAlarmsTab">
        <QTab
          v-for="(dataAlarmTypeTitlesMap, indexAlarmTypeTitlesMap) in alarmTypeTitlesMap"
          :key="indexAlarmTypeTitlesMap"
          :label="dataAlarmTypeTitlesMap"
          :name="indexAlarmTypeTitlesMap"
          :disable="
            isLoaded ||
            !AggregatedAlarmsUtils.flattenDictionary(selectedAlarmTypes)[indexAlarmTypeTitlesMap]
          "
        />
      </QTabs>
      <QSeparator />
      <QTabPanels v-model="aggregatedAlarmsTab">
        <QTabPanel
          v-for="(dataAlarmTypeTitlesMap, indexAlarmTypeTitlesMap) in alarmTypeTitlesMap"
          :key="indexAlarmTypeTitlesMap"
          :name="indexAlarmTypeTitlesMap"
        >
          <QInput debounce="300" v-model="filter" placeholder="Filter">
            <template v-slot:append>
              <QIcon name="fas fa-filter" />
            </template>
          </QInput>
          <AggregatedAlarmsTable
            ref="tableRef"
            :start-time="new Date(`${startTimeFormatted}:00Z`)"
            :end-time="new Date(`${endTimeFormatted}:00Z`)"
            :table-key-current="
              AggregatedAlarmsUtils.flattenDictionary(selectedAlarmTypesOptions)[
                indexAlarmTypeTitlesMap
              ]
            "
            :severities-selected-list="selectSeveritiesLevels.map((obj) => obj.value)"
            :selected-table-data-source="
              getDataSourceFromSelectedAlarmType(indexAlarmTypeTitlesMap)
            "
            :selected-table-alarm-type="indexAlarmTypeTitlesMap"
            :loading="loadingVal"
            :country-name="selectedCountry"
            :alarms="alarms.filter"
            :aggregated-attrs-selected="aggregatedAttrs"
            :alarm-type-titles-map="alarmTypeTitlesMap"
            :filter="filter"
            @country-clicked="onCountryClicked"
            @asn-name-key-clicked="onASNameClicked"
          />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style scoped>
.card {
  margin-top: 20px;
}
</style>
