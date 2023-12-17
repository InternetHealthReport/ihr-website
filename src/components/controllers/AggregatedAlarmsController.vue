<script setup>
import { QCard, QCardSection, QMarkupTable, QCheckbox, QSelect, QBtn, QTabs, QTab, QSeparator, QTabPanels, QTabPanel } from 'quasar'
import { ref, computed, inject, onMounted, watch } from 'vue'
import WorldMapAggregatedAlarmsChart from '../charts/WorldMapAggregatedAlarmsChart.vue'
import TimeSeriesAggregatedAlarmsChart from '../charts/TimeSeriesAggregatedAlarmsChart.vue'
import TreeMapAggregatedAlarmsChart from '../charts/TreeMapAggregatedAlarmsChart.vue'
import { Query, HegemonyAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import * as AggregatedAlarmsDataModel from '@/plugins/models/AggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { isCountryName } from '@/plugins/countryName'
import AggregatedAlarmsTable from '../tables/AggregatedAlarmsTable.vue'
import { ALARMS_INFO } from '@/plugins/metadata/AggregatedAlarmsMetadata'

const ihr_api = inject('ihr_api')

const SEVERITIED_LEVELS = [
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
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  hegemonyAlarms: {
    type: Array,
    required: true,
  },
  networkDelayAlarms: {
    type: Array,
    required: true,
  },
  hegemonyLoading: {
    type: Boolean,
    required: true
  },
  networkDelayLoading: {
    type: Boolean,
    required: true
  }
})

const selectedDataSources = ref({})
const selectedAlarmTypes = ref({})
const selectedAlarmTypesOptions = ref({})
const selectSeveritiesLevels = ref(SEVERITIED_LEVELS)
const selectIPAddressFamilies = ref(IP_ADDRESS_FAMILIES)
const hegemonyData = ref([])
const loading = ref(false)
const aggregatedAlarmsLoadingVal = ref(false)
const thirdPartyAlarmsStates = ref({
  grip: null,
  ioda: null
})
const alarms = ref({
  raw: [],
  filter: [],
  saved: []
})
const aggregatedAttrs = ref({})
const selectedCountry = ref(null)
const selectedNetwork = ref(null)
const aggregatedAlarmsTab = ref('hegemony')

const etlAggregatedAlarmsDataModel = () => {
  aggregatedAlarmsLoadingVal.value = true
  AggregatedAlarmsDataModel.etl(
    selectedDataSources.value,
    ALARMS_INFO,
    AggregatedAlarmsUtils.flattenDictionary(selectedAlarmTypes.value),
    AggregatedAlarmsUtils.flattenDictionary(selectedAlarmTypesOptions.value),
    [props.hegemonyAlarms, props.networkDelayAlarms].flat(),
    thirdPartyAlarmsStates.value,
    iodaIPAddressFamilies.value,
    props.startTime,
    props.endTime
  ).then((data) => {
    alarms.value.raw = data
    selectSeveritiesLevelsAndIPAddressFamiliesFilter()
    aggregatedAlarmsLoadingVal.value = false
  }).catch((error) => {
    console.error(error)
  })
}

const iodaIPAddressFamilies = computed(() => {
  const result = {}
  Object.keys(selectedDataSources.value).forEach(dataSource => {
    if (dataSource === 'ioda') {
      Object.keys(selectedAlarmTypes.value[dataSource]).forEach(alarmType => {
        const ipAddressFamilies = ALARMS_INFO[dataSource].alarm_types[alarmType].metadata.ipAddressFamilies
        result[alarmType] = Object.entries(ipAddressFamilies).filter((val) => val[1]).map((val) => val[0])
      })
    }
  })
  return result
})

const aggregatedAttrsSelected = () => {
  const aggregatedAttrsSelected = { counts: [], timebins: [], severities: [], ipAddressFamilies: [] }
  for (const dataSource in selectedDataSources.value) {
    const alarmTypes = selectedAlarmTypes.value[dataSource]
    for (const alarmType in alarmTypes) {
      if (selectedAlarmTypes.value[dataSource][alarmType]) {
        aggregatedAttrsSelected.counts.push(`${alarmType}_count`)
        aggregatedAttrsSelected.timebins.push(`${alarmType}_timebin`)
        aggregatedAttrsSelected.severities.push(`${alarmType}_severity`)
        aggregatedAttrsSelected.ipAddressFamilies.push(Object.values(ALARMS_INFO[dataSource].alarm_types[alarmType].metadata.group_by_key_options).map((groupByKey) => `${alarmType}_${groupByKey}_af`))
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
    alarmTypes.forEach(alarm => selectedAlarmTypes.value[dataSourceKey][alarm] = false)
    alarmTypes.forEach(alarm => selectedAlarmTypesOptions.value[dataSourceKey][alarm] = ALARMS_INFO[dataSourceKey].alarm_types[alarm].metadata.default_key)
  }
  selectedAlarmTypes.value['ihr']['hegemony'] = true
  selectedAlarmTypes.value['ihr']['network_delay'] = true
  return maxAlarmTypesLength
})

const loadingVal = computed(() => {
  return props.hegemonyLoading || props.networkDelayLoading || aggregatedAlarmsLoadingVal.value
})

const selectSeveritiesLevelsAndIPAddressFamiliesFilter = () => {
  if (!selectSeveritiesLevels.value.length) {
    alarms.value.filter = []
  } else{
    const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms.value.raw, selectSeveritiesLevels.value.map(obj => obj.value), AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrs.value))
    const ipAddressFamiliesFiltered = AggregatedAlarmsDataModel.filterAlarmsByIpAddressFamily(alarmsSeverityFiltered, selectIPAddressFamilies.value.map(obj => obj.value), AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrs.value))
    alarms.value.filter = ipAddressFamiliesFiltered
    alarms.value.saved = ipAddressFamiliesFiltered
    countryFilter()
    networkFilter()
  }
}

const countryFilter = () => {
  if (selectedCountry.value) {
      const countryFilter = alarms.value.filter.map(obj => {
        if (obj.asn_country === selectedCountry.value) {
          return obj
        }
      }).filter(obj => obj !== undefined)
      alarms.value.filter = countryFilter
    }
}

const networkFilter = () => {
  if (selectedNetwork.value) {
    const networkFilter = alarms.value.filter.map(obj => {
      if (obj.asn_name_truncated === selectedNetwork.value) {
        return obj
      }
    }).filter(obj => obj !== undefined)
    alarms.value.filter = networkFilter
  }
}

const timeFilter = (obj) => {
  const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrs.value)
  const timeFilter = AggregatedAlarmsDataModel.filterAlarmsByTime(alarms.value.filter, new Date(obj.startDateTime).getTime() / 1000, new Date(obj.endDateTime).getTime() / 1000, aggregatedAttrsZipped)
  alarms.value.filter = timeFilter
}

const isLoaded = computed(() => {
  if (props.hegemonyLoading || props.networkDelayLoading) {
    return true
  }
  return false
})

const countryClickedHandler = (event) => {
  if (event.points) {
    if (event.points[0].data.type === 'choropleth') {
      selectedCountry.value = event.points[0].text
      countryFilter()
    } else if (event.points[0].data.type === 'treemap') {
      try {
        const name = event.points[0].id.split('-')[0]
        if (isCountryName(name)) {
          selectedCountry.value = name
          countryFilter()
        } else {
          selectedNetwork.value = event.points[0].id
          networkFilter()
        }
      } catch (error) {
        resetGranularity()
      }
    }
  } else if (event.node) {
    const name = event.node.textContent.split('-')[0]
    if (isCountryName(name)) {
      selectedCountry.value = name
      countryFilter()
    } else {
      selectedNetwork.value = event.node.textContent
      networkFilter()
    }
  } else if (event.type === 'button') {
    if (isCountryName(event.target)) {
      selectedCountry.value = event.target
      countryFilter()
    } else {
      selectedNetwork.value = event.target
      networkFilter()
    }
  }
}

const resetGranularity = () => {
  selectedCountry.value = null
  selectedNetwork.value = null
  alarms.value.filter = alarms.value.saved
}

const getDataSourceFromSelectedAlarmType = (val) => {
  let selectedKey = null
  Object.keys(selectedAlarmTypes.value).forEach(keyA => {
    Object.keys(selectedAlarmTypes.value[keyA]).forEach(keyB => {
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

watch(selectSeveritiesLevels, () => {
  selectSeveritiesLevelsAndIPAddressFamiliesFilter()
})

watch(selectIPAddressFamilies, () => {
  selectSeveritiesLevelsAndIPAddressFamiliesFilter()
})

watch(selectedAlarmTypes.value, () => {
  Object.keys(selectedAlarmTypes.value).forEach(key => {
    selectedDataSources.value[key] = Object.values(selectedAlarmTypes.value[key]).some(Boolean)
  })
  aggregatedAttrsSelected()
  etlAggregatedAlarmsDataModel()
})

watch(selectedAlarmTypesOptions.value, () => {
  Object.keys(selectedAlarmTypes.value).forEach(key => {
    selectedDataSources.value[key] = Object.values(selectedAlarmTypes.value[key]).some(Boolean)
  })
  aggregatedAttrsSelected()
  etlAggregatedAlarmsDataModel()
})

</script>

<template>
  <div>
    <QCard class="IHR_charts-body">
      <QCardSection>
        <QMarkupTable flat bordered separator="cell">
            <thead>
              <tr>
                <th>Data Source</th>
                <th :colspan="maxAlarmTypesLength">Alarm Types</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(dataSource, indexSource) in ALARMS_INFO" :key="indexSource" class="q-tr--no-hover">
                <td><QCheckbox v-model="selectedDataSources[indexSource]" disable />{{ dataSource.metadata.title }}</td>
                <td v-for="(dataAlarm, indexAlarm) in dataSource.alarm_types" :key="indexAlarm">
                  <QCheckbox v-model="selectedAlarmTypes[indexSource][indexAlarm]" :disable="isLoaded" />{{ dataAlarm.metadata.title }}
                  <QSelect filled v-model="selectedAlarmTypesOptions[indexSource][indexAlarm]" :options="Object.values(ALARMS_INFO[indexSource].alarm_types[indexAlarm].metadata.group_by_key_options)" :disable="isLoaded || !selectedAlarmTypes[indexSource][indexAlarm]" />
                </td>
                <td v-for="i in maxAlarmTypesLength - Object.keys(dataSource.alarm_types).length" :key="`empty-cell-${i}`"></td>
              </tr>
            </tbody>
        </QMarkupTable>
        <br />
        <div class="row">
          <div class="col">
            <QSelect :disable="isLoaded" outlined multiple v-model="selectSeveritiesLevels" :options="SEVERITIED_LEVELS" label="Severity Levels:" stack-label use-chips/>
          </div>
          <div class="col">
            <QSelect :disable="isLoaded" outlined multiple v-model="selectIPAddressFamilies" :options="IP_ADDRESS_FAMILIES" label="IP Address Families:" stack-label use-chips/>
          </div>
          <div class="col">
            <QBtn color="primary" class="float-right" @click="resetGranularity()">Reset Granularity</QBtn>
          </div>
        </div>
      </QCardSection>
    </QCard>

    <QCard class="IHR_charts-body">
      <QCardSection>
        <div class="text-h6 center">Aggregated Alarms by Countries</div>
      </QCardSection>
      <QCardSection>
        <WorldMapAggregatedAlarmsChart :loading="loadingVal" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" />
      </QCardSection>
    </QCard>

    <div class="row">
      <div class="col">
        <QCard class="IHR_charts-body">
          <QCardSection>
            <div class="text-h6 center">{{ selectedCountry ? `Alarms by ASNs over Time for ${selectedCountry}` : 'Alarms for all Countries over Time' }}</div>
          </QCardSection>
          <QCardSection>
            <TimeSeriesAggregatedAlarmsChart :loading="loadingVal" :network-name="selectedNetwork" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" @select-time="timeFilter" />
          </QCardSection>
        </QCard>
      </div>
      <div class="col">
        <QCard class="IHR_charts-body">
          <QCardSection>
            <div class="text-h6 center">{{ selectedCountry ? `Aggregated Alarms by ASN, Alarm Type, and Severity for ${selectedCountry}` : 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity' }}</div>
          </QCardSection>
          <QCardSection>
            <TreeMapAggregatedAlarmsChart :loading="loadingVal" :network-name="selectedNetwork" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" />
          </QCardSection>
        </QCard>
      </div>
    </div>
    <QCard>
      <QTabs v-model="aggregatedAlarmsTab">
        <QTab v-for="(dataAlarmTypeTitlesMap, indexAlarmTypeTitlesMap) in alarmTypeTitlesMap" :key="indexAlarmTypeTitlesMap" :label="dataAlarmTypeTitlesMap" :name="indexAlarmTypeTitlesMap" />
      </QTabs>
      <QSeparator />
      <QTabPanels v-model="aggregatedAlarmsTab">
        <QTabPanel v-for="(dataAlarmTypeTitlesMap, indexAlarmTypeTitlesMap) in alarmTypeTitlesMap" :key="indexAlarmTypeTitlesMap" :name="indexAlarmTypeTitlesMap">
          <AggregatedAlarmsTable :start-time="startTime" :end-time="endTime" :table-key-current="AggregatedAlarmsUtils.flattenDictionary(selectedAlarmTypesOptions)[indexAlarmTypeTitlesMap]" :severities-selected-list="selectSeveritiesLevels.map(obj => obj.value)" :selected-table-data-source="getDataSourceFromSelectedAlarmType(indexAlarmTypeTitlesMap)" :selected-table-alarm-type="indexAlarmTypeTitlesMap" :loading="loadingVal" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" />
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus" scoped>
</style>