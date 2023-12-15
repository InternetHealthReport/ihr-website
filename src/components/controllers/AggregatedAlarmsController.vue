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

const ALARMS_INFO_2 = {
  data_sources: {
    ihr: {
      hegemony_alarm_counts: [],
      hegemony_alarm_timebins: [],
      hegemony_alarm_severities: [],
      network_delay_alarm_counts: [],
      network_delay_alarm_timebins: [],
      network_delay_alarm_severities: []
    },
    grip: {
      moas_alarm_counts: [],
      moas_alarm_timebins: [],
      moas_alarm_severities: [],
      submoas_alarm_counts: [],
      submoas_alarm_timebins: [],
      submoas_alarm_severities: [],
      defcon_alarm_counts: [],
      defcon_alarm_timebins: [],
      defcon_alarm_severities: [],
      edges_alarm_counts: [],
      edges_alarm_timebins: [],
      edges_alarm_severities: [],
    },
    ioda: {
      ping_slash24_alarm_counts: [],
      ping_slash24_alarm_timebins: [],
      ping_slash24_alarm_severities: [],
      bgp_alarm_counts: [],
      bgp_alarm_timebins: [],
      bgp_alarm_severities: [],
      ucsd_nt_alarm_counts: [],
      ucsd_nt_alarm_timebins: [],
      ucsd_nt_alarm_severities: [],
    }
  },
  metadata: {
    data_sources: {
      ihr: {
        alarm_types: {
          hegemony: {
            title: 'AS Dependency',
            description: 'Routing changes found in AS Dependency data (a.k.a. AS Hegemony).',
            showHelpModal: false,
            default_key: 'origin_asn',
            group_by_key_options: { originasn: 'origin_asn', dependency: 'asn' }
          },
          network_delay: {
            title: 'Network Delay',
            description: 'Network delay changes observed in traceroute data.',
            showHelpModal: false,
            default_key: 'startpoint',
            group_by_key_options: { source: 'startpoint', destination: 'endpoint' }
          }
        },
        title: 'IHR',
        description: 'Alarms reported by IHR.',
        showHelpModal: false
      },
      grip: {
        alarm_types: {
          moas: {
            title: 'MOAS',
            description: 'Multi Origin-AS. Prefixes concurently announced in BGP by multiple ASes.',
            showHelpModal: false,
            default_key: 'asn_attacker',
            group_by_key_options: { attacker: 'asn_attacker', victim: 'asn_victim' }
          },
          submoas: {
            title: 'Sub-MOAS',
            description: 'Sub-prefix MOAS. Sup-prefix announced by a different origin AS.',
            showHelpModal: false,
            default_key: 'asn_attacker',
            group_by_key_options: { attacker: 'asn_attacker', victim: 'asn_victim' }
          },
          defcon: {
            title: 'DEFCON',
            description: 'Hijack using a more specific prefix on an existing AS path.',
            showHelpModal: false,
            default_key: 'asn_attacker',
            group_by_key_options: { attacker: 'asn_attacker', victim: 'asn_victim' }
          },
          edges: {
            title: 'Fake Path',
            description: 'Hijack using forged AS paths to legitimate origin AS. (a.k.a. Edges)',
            showHelpModal: false,
            default_key: 'asn_attacker',
            group_by_key_options: { attacker: 'asn_attacker', victim: 'asn_victim' }
          },
        },
        title: 'GRIP',
        description: "BGP hijacks reported by Georgia Tech's GRIP platform.",
        showHelpModal: false
      },
      ioda: {
        alarm_types: {
          ping_slash24: {
            title: 'Ping',
            description: 'Data plane outages detected in ping data.',
            showHelpModal: false,
            default_key: 'entity',
            group_by_key_options: { asn: 'entity' }
          },
          bgp: {
            title: 'BGP',
            description: 'Routing outages detected in BGP data.',
            showHelpModal: false,
            default_key: 'entity',
            group_by_key_options: { asn: 'entity' }
          },
          ucsd_nt: {
            title: 'UCSD Telescope',
            description: 'Outages detected with the UCSD network telescope.',
            showHelpModal: false,
            default_key: 'entity',
            group_by_key_options: { asn: 'entity' }
          },
        },
        title: 'IODA',
        description: "Internet outages reported by Georgia Tech's IODA platform",
        showHelpModal: false
      }
    }
  }
}

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
// const thirdPartyAlarmsStates = ref({
//   grip: { downloading: false, data: null },
//   ioda: { downloading: false, data: null }
// })
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
const selectedNetwork = ref(null)
const aggregatedAlarmsTab = ref('hegemony')

const etlAggregatedAlarmsDataModel = (aggregatedAttrsSelectedFlattend) => {
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
  const { data_sources: dataSources } = ALARMS_INFO_2.metadata
  for (const dataSource in dataSources) {
    const dataSourceAlarmTypes = dataSources[dataSource].alarm_types
    for (const dataSourceAlarmTypeKey in dataSourceAlarmTypes) {
      const dataSourceAlarmTypeTitle = dataSourceAlarmTypes[dataSourceAlarmTypeKey].title
      alarmTypesToTitles[dataSourceAlarmTypeKey] = dataSourceAlarmTypeTitle
    }
  }
  return alarmTypesToTitles
})

const maxAlarmTypesLength = computed(() => {
  let maxAlarmTypesLength = 0
  for (const dataSourceKey in ALARMS_INFO_2.metadata.data_sources) {
    selectedDataSources.value[dataSourceKey] = true
    selectedAlarmTypes.value[dataSourceKey] = {}
    selectedAlarmTypesOptions.value[dataSourceKey] = {}
    const alarmTypes = Object.keys(ALARMS_INFO_2.metadata.data_sources[dataSourceKey].alarm_types)
    maxAlarmTypesLength = Math.max(maxAlarmTypesLength, alarmTypes.length)
    alarmTypes.forEach(alarm => selectedAlarmTypes.value[dataSourceKey][alarm] = false)
    alarmTypes.forEach(alarm => selectedAlarmTypesOptions.value[dataSourceKey][alarm] = ALARMS_INFO_2.metadata.data_sources[dataSourceKey].alarm_types[alarm].default_key)
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
  }
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
    } else if (event.points[0].data.type === 'treemap') {
      try {
        const name = event.points[0].id.split('-')[0]
        if (isCountryName(name)) {
          selectedCountry.value = name
        } else {
          selectedNetwork.value = event.points[0].id
        }
      } catch (error) {
        resetGranularity()
      }
    }
  } else if (event.node) {
    const name = event.node.textContent.split('-')[0]
    if (isCountryName(name)) {
      selectedCountry.value = name
    } else {
      selectedNetwork.value = event.node.textContent
    }
  }
}

const resetGranularity = () => {
  selectedCountry.value = null
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
  etlAggregatedAlarmsDataModel(aggregatedAttrs.value)
})

watch(selectedAlarmTypesOptions.value, () => {
  Object.keys(selectedAlarmTypes.value).forEach(key => {
    selectedDataSources.value[key] = Object.values(selectedAlarmTypes.value[key]).some(Boolean)
  })
  aggregatedAttrsSelected()
  etlAggregatedAlarmsDataModel(aggregatedAttrs.value)
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
              <tr v-for="(dataSource, indexSource) in ALARMS_INFO_2.metadata.data_sources" :key="indexSource" class="q-tr--no-hover">
                <td><QCheckbox v-model="selectedDataSources[indexSource]" disable />{{ dataSource.title }}</td>
                <td v-for="(dataAlarm, indexAlarm) in dataSource.alarm_types" :key="indexAlarm">
                  <QCheckbox v-model="selectedAlarmTypes[indexSource][indexAlarm]" :disable="isLoaded" />{{ dataAlarm.title }}
                  <QSelect filled v-model="selectedAlarmTypesOptions[indexSource][indexAlarm]" :options="Object.values(ALARMS_INFO_2.metadata.data_sources[indexSource].alarm_types[indexAlarm].group_by_key_options)" :disable="isLoaded || !selectedAlarmTypes[indexSource][indexAlarm]" />
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
            <TimeSeriesAggregatedAlarmsChart :loading="loadingVal" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" />
          </QCardSection>
        </QCard>
      </div>
      <div class="col">
        <QCard class="IHR_charts-body">
          <QCardSection>
            <div class="text-h6 center">{{ selectedCountry ? `Aggregated Alarms by ASN, Alarm Type, and Severity for ${selectedCountry}` : 'Aggregated Alarms by Country, ASN, Alarm Type, and Severity' }}</div>
          </QCardSection>
          <QCardSection>
            <TreeMapAggregatedAlarmsChart :loading="loadingVal" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" @country-clicked="countryClickedHandler" />
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
          {{ selectedAlarmTypes }}
          <!-- <AggregatedAlarmsTable :severities-selected-list="selectSeveritiesLevels.map(obj => obj.value)" :selected-table-data-source="getDataSourceFromSelectedAlarmType(indexAlarmTypeTitlesMap)" :selected-table-alarm-type="indexAlarmTypeTitlesMap" :loading="loadingVal" :country-name="selectedCountry" :alarms="alarms.filter" :aggregated-attrs-selected="aggregatedAttrs" :alarm-type-titles-map="alarmTypeTitlesMap" /> -->
        </QTabPanel>
      </QTabPanels>
    </QCard>
  </div>
</template>

<style lang="stylus" scoped>
</style>