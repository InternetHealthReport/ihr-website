<script setup>
import { QCard, QCardSection, QMarkupTable, QCheckbox, QSelect, QBtn } from 'quasar'
import { ref, computed, inject, onMounted, watch } from 'vue'
import WorldMapAggregatedAlarmsChart from '../charts/WorldMapAggregatedAlarmsChart.vue'
import TimeSeriesAggregatedAlarmsChart from '../charts/TimeSeriesAggregatedAlarmsChart.vue'
import TreeMapAggregatedAlarmsChart from '../charts/TreeMapAggregatedAlarmsChart.vue'
import { Query, HegemonyAlarmsQuery, AS_FAMILY } from '@/plugins/IhrApi'
import * as AggregatedAlarmsDataModel from '@/plugins/models/AggregatedAlarmsDataModel'
import * as AggregatedAlarmsUtils from '@/plugins/utils/AggregatedAlarmsUtils'
import { isCountryName } from '@/plugins/countryName'

const ihr_api = inject('ihr_api')

const ALARMS_INFO = {
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
            showHelpModal: false
          },
          network_delay: {
            title: 'Network Delay',
            description: 'Network delay changes observed in traceroute data.',
            showHelpModal: false
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
            showHelpModal: false
          },
          submoas: {
            title: 'Sub-MOAS',
            description: 'Sub-prefix MOAS. Sup-prefix announced by a different origin AS.',
            showHelpModal: false
          },
          defcon: {
            title: 'DEFCON',
            description: 'Hijack using a more specific prefix on an existing AS path.',
            showHelpModal: false
          },
          edges: {
            title: 'Fake Path',
            description: 'Hijack using forged AS paths to legitimate origin AS. (a.k.a. Edges)',
            showHelpModal: false
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
            showHelpModal: false
          },
          bgp: {
            title: 'BGP',
            description: 'Routing outages detected in BGP data.',
            showHelpModal: false
          },
          ucsd_nt: {
            title: 'UCSD Telescope',
            description: 'Outages detected with the UCSD network telescope.',
            showHelpModal: false
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
const selectSeveritiesLevels = ref(SEVERITIED_LEVELS)
const hegemonyData = ref([])
const loading = ref(false)
const aggregatedAlarmsLoadingVal = ref(false)
const thirdPartyAlarmsStates = ref({
  grip: { downloading: false, data: null },
  ioda: { downloading: false, data: null }
})
const alarms = ref({
  raw: [],
  filter: []
})
const aggregatedAttrs = ref({})
const selectedCountry = ref(null)
const selectedNetwork = ref(null)

const etlAggregatedAlarmsDataModel = (aggregatedAttrsSelectedFlattend) => {
  aggregatedAlarmsLoadingVal.value = true
  AggregatedAlarmsDataModel.etl(
    ALARMS_INFO.metadata.data_sources,
    selectedDataSources.value,
    aggregatedAttrsSelectedFlattend,
    props.hegemonyAlarms,
    props.networkDelayAlarms,
    thirdPartyAlarmsStates.value,
    props.startTime,
    props.endTime
  ).then((data) => {
    alarms.value.raw = data
    selectSeveritiesLevelsFilter()
    aggregatedAlarmsLoadingVal.value = false
  }).catch((error) => {
    console.error(error)
  })
}

const aggregatedAttrsSelected = () => {
  aggregatedAttrs.value = { counts: {}, timebins: {}, severities: {} }

  const alarmTypesSelected = []
  for (const [alarmType, isSelected] of Object.entries(AggregatedAlarmsUtils.flattenDictionary(Object.values(selectedAlarmTypes.value)))) {
    if (isSelected) {
      alarmTypesSelected.push(alarmType)
    }
  }

  const allAggergatedAttrs = AggregatedAlarmsUtils.flattenDictionary(Object.values(ALARMS_INFO.data_sources))
  const aggregatedAttrsFiltered = AggregatedAlarmsUtils.filterDictByPrefixes(allAggergatedAttrs, alarmTypesSelected)

  for (const aggregatedAttr in aggregatedAttrsFiltered) {
    if (aggregatedAttr.endsWith('counts')) {
      aggregatedAttrs.value.counts[aggregatedAttr] = []
    } else if (aggregatedAttr.endsWith('timebins')) {
      aggregatedAttrs.value.timebins[aggregatedAttr] = []
    } else if (aggregatedAttr.endsWith('severities')) {
      aggregatedAttrs.value.severities[aggregatedAttr] = []
    }
  }
}

const alarmTypeTitlesMap = computed(() => {
  const alarmTypesToTitles = {}
  const { data_sources: dataSources } = ALARMS_INFO.metadata
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
  for (const dataSourceKey in ALARMS_INFO.metadata.data_sources) {
    selectedDataSources.value[dataSourceKey] = true
    selectedAlarmTypes.value[dataSourceKey] = {}
    const alarmTypes = Object.keys(ALARMS_INFO.metadata.data_sources[dataSourceKey].alarm_types)
    maxAlarmTypesLength = Math.max(maxAlarmTypesLength, alarmTypes.length)
    alarmTypes.forEach(alarm => selectedAlarmTypes.value[dataSourceKey][alarm] = false)
  }
  selectedAlarmTypes.value['ihr']['hegemony'] = true
  selectedAlarmTypes.value['ihr']['network_delay'] = true
  return maxAlarmTypesLength
})

const loadingVal = computed(() => {
  return props.hegemonyLoading || props.networkDelayLoading || aggregatedAlarmsLoadingVal.value
})

const selectSeveritiesLevelsFilter = () => {
  if (!selectSeveritiesLevels.value.length) {
    alarms.value.filter = []
  } else{
    const alarmsSeverityFiltered = AggregatedAlarmsDataModel.filterAlarmsBySeverity(alarms.value.raw, selectSeveritiesLevels.value.map(obj => obj.value))
    alarms.value.filter = alarmsSeverityFiltered
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

watch(selectSeveritiesLevels, () => {
  selectSeveritiesLevelsFilter()
})

watch(selectedAlarmTypes.value, () => {
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
              <tr v-for="(dataSource, indexSource) in ALARMS_INFO.metadata.data_sources" :key="indexSource" class="q-tr--no-hover">
                <td><QCheckbox v-model="selectedDataSources[indexSource]" disable />{{ dataSource.title }}</td>
                <td v-for="(dataAlarm, indexAlarm) in dataSource.alarm_types" :key="indexAlarm">
                  <QCheckbox v-model="selectedAlarmTypes[indexSource][indexAlarm]" :disable="isLoaded" />{{ dataAlarm.title }}
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
  </div>
</template>

<style lang="stylus" scoped>
</style>