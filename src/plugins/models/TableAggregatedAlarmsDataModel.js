import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'
import * as AggregatedAlarmsDataModel from './AggregatedAlarmsDataModel'

const aggregatedFunctions = {
  total_count: getCount,
  low_severity_count: (alarm, selectedAlarmType, _) => getSeverityCount(alarm, selectedAlarmType, 'low'),
  medium_severity_count: (alarm, selectedAlarmType, _) => getSeverityCount(alarm, selectedAlarmType, 'medium'),
  high_severity_count: (alarm, selectedAlarmType, _) => getSeverityCount(alarm, selectedAlarmType, 'high'),
}

export function etl(alarms, selectedAlarmType, selectedDataSource, tableColumns, tableAggregatedColumns, key, alternativeKey, severitiesSelectedList) {
  const alarmsTableData = {}
  let tableColumnsToInclude = {}
  let tableAggregatedColumnsToInclude = tableAggregatedColumns.filter((column) =>
    !column.name.includes('severity') ||
        (column.name.includes('severity') && severitiesSelectedList.includes(column.name.split('_severity_')[0]))
  )
  const keyWithPrefix = `${selectedAlarmType}_${key}`

  // const alarmsFiltered = alarms.filter((alarm) => alarm[keyWithPrefix] && alarm[keyWithPrefix].length)
  const alarmsFiltered = alarms.filter((alarm) => {
    console.log(alarm, keyWithPrefix)
    alarm[keyWithPrefix] && alarm[keyWithPrefix].length
  })
  console.log(alarmsFiltered)
  if (!alarmsFiltered.length) return [alarmsTableData, tableColumns, tableAggregatedColumnsToInclude]

  for (const alarmFiltered of alarmsFiltered) {
    const alarmTableData = {}
    tableColumnsTransformer(tableColumns, selectedAlarmType, alarmFiltered, keyWithPrefix, alarmTableData, tableColumnsToInclude)
    tableAggregatedColumnsTransformer(tableAggregatedColumns, selectedAlarmType, alarmFiltered, alarmTableData)
    dataSourcesPostTransformer(selectedDataSource, selectedAlarmType, alarmFiltered, alarmTableData, key, alternativeKey)
    alarmTableData.key_name_truncated = alarmFiltered.asn_name_truncated
    alarmTableData.key_normalized = alarmFiltered.asn
    alarmsTableData[alarmTableData.key_normalized] = alarmTableData
  }

  tableColumnsToInclude = Object.values(tableColumnsToInclude).flatMap((column) => column)

  sortTableColumnsToInclude(tableColumnsToInclude, key)

  tableColumnsToInclude = !tableColumnsToInclude.length ? tableColumns : tableColumnsToInclude

  tableDataPostTransformer(alarmsFiltered, alarmsTableData, selectedAlarmType)

  return [alarmsTableData, tableColumnsToInclude, tableAggregatedColumnsToInclude]
}

function tableColumnsTransformer(tableColumns, selectedAlarmType, alarmFiltered, keyWithPrefix, alarmTableData, tableColumnsToInclude) {
  for (let i = 0; i < tableColumns.length; i++) {
    const tableColumnName = tableColumns[i].name
    let columnVal;
    const alarmColumnName = `${selectedAlarmType}_${tableColumnName}`
    const alarmColumnNameVal = alarmFiltered[alarmColumnName]
    if (Array.isArray(alarmColumnNameVal)) {
      if (alarmColumnName.startsWith(keyWithPrefix)) {
        if (alarmColumnName == keyWithPrefix) {
          columnVal = `AS${alarmColumnNameVal[0]}`
        } else {
          const uniqueColumnValues = new Set(alarmColumnNameVal)
          const uniqueColumnValuesList = [...new Set([...uniqueColumnValues].flatMap((val) => isNaN(val) && val.includes(',') ? val.split(', ') : val))]
          if (uniqueColumnValuesList.length == 1) {
            columnVal = uniqueColumnValuesList[0]
          } else if (uniqueColumnValuesList.length == 2 && alarmColumnName.endsWith('af')) {
            columnVal = '4/6'
          } else if (uniqueColumnValuesList.length >= 2 && !alarmColumnName.endsWith('af')) {
            columnVal = uniqueColumnValuesList.map((uniqueValue, index) => {
              return index % 10 === 0 && index !== 0 ? `${uniqueValue}<br>` : index === uniqueColumnValuesList.length - 1 ? `${uniqueValue}` : `${uniqueValue}, `
            }).join('');
            tableColumns[i].is_comma_separated = true
          }
        }
      } else {
        const alarmColumnWithSuffixName = `${alarmColumnName}_name`
        if (alarmFiltered[alarmColumnWithSuffixName]) {
          const asUniqueElements = [...new Set(alarmFiltered[alarmColumnName])]
          columnVal = asUniqueElements.map((as, index) => {
            return index % 10 === 0 && index !== 0 ? `AS${as}<br>` : index === asUniqueElements.length - 1 ? `AS${as}` : `AS${as}, `
          }).join('');
        }
      }
    } else {
      columnVal = alarmColumnNameVal
    }

    if (columnVal !== null && columnVal !== undefined) {
      alarmTableData[tableColumnName] = columnVal
      if (!tableColumnsToInclude[tableColumnName]) tableColumnsToInclude[tableColumnName] = tableColumns[i]
    } else if (tableColumnName.endsWith('overview')) {
      alarmTableData[tableColumnName] = false
      if (!tableColumnsToInclude[tableColumnName]) tableColumnsToInclude[tableColumnName] = tableColumns[i]
    }
  }
}
function tableAggregatedColumnsTransformer(tableAggregatedColumns, selectedAlarmType, alarmFiltered, alarmTableData) {
  for (const aggregatedColumn of tableAggregatedColumns) {
    const tableAggregatedColumnName = aggregatedColumn.name
    if (tableAggregatedColumnName.endsWith('avg')) {
      alarmTableData[tableAggregatedColumnName] = getAverageValueHelper(alarmFiltered, selectedAlarmType, tableAggregatedColumnName)
    } else if (tableAggregatedColumnName.endsWith('median')) {
      alarmTableData[tableAggregatedColumnName] = getMedianValueHelper(alarmFiltered, selectedAlarmType, tableAggregatedColumnName)
    } else if (tableAggregatedColumnName.endsWith('sum')) {
      alarmTableData[tableAggregatedColumnName] = getSumValue(alarmFiltered, selectedAlarmType, tableAggregatedColumnName)
    } else if (aggregatedFunctions[tableAggregatedColumnName]) {
      const func = aggregatedFunctions[tableAggregatedColumnName]
      alarmTableData[tableAggregatedColumnName] = func(alarmFiltered, selectedAlarmType, tableAggregatedColumnName)
    } else {
      alarmTableData[tableAggregatedColumnName] = null
    }
  }
}

function dataSourcesPostTransformer(selectedDataSource, selectedAlarmType, alarmFiltered, alarmTableData, key, alternativeKey) {
  if (selectedDataSource === 'ihr') ihrAlarmsPostTransformer(selectedAlarmType, alarmFiltered, alarmTableData, key, alternativeKey)
  if (selectedDataSource === 'ioda') iodAlamsPostTransformer(selectedAlarmType, alarmFiltered, alarmTableData)
}

function ihrAlarmsPostTransformer(selectedAlarmType, alarm, alarmTableData, key, alternativeKey) {
  if (selectedAlarmType === 'network_delay') {
    ihrNetworkDelayAlarmsPostTransformer(alarm, alarmTableData, key, alternativeKey)
  } else if (selectedAlarmType === 'network_disconnection') {
    ihrNetworkDisconnectionAlarmsPostTransformer(alarm, alarmTableData, key)
  }
}

function ihrNetworkDelayAlarmsPostTransformer(alarm, alarmTableData, _, alternativeKey) {
  const alternativeASes = alarm[`network_delay_${alternativeKey}`]
  const alternativeASAFs = alarm[`network_delay_${alternativeKey}_af`]
  const alternativeASDeviations = alarm.network_delay_deviation
  if (!alternativeASes || !alternativeASAFs || !alternativeASDeviations) return
  const alternativeUniqueASes = [...new Set(alternativeASes)]
  const alternativeUniqueASesToInclude = alternativeUniqueASes.slice()
  const alternativeASAFsEquivalent = []
  const alternativeASDeviationsAvg = []
  for (let uniqueASIndex = 0; uniqueASIndex < alternativeUniqueASes.length; uniqueASIndex++) {
    const uniqueAlternativeAS = alternativeUniqueASes[uniqueASIndex]
    const indices = AggregatedAlarmsUtils.findAllIndices(alternativeASes, uniqueAlternativeAS)
    const uniqueAFs = [...new Set(indices.map(index => alternativeASAFs[index]))]
    const deviationsAvg = AggregatedAlarmsUtils.getAverageValue(indices.map((index) => alternativeASDeviations[index]))
    if (uniqueAFs.length == 1) {
      alternativeASAFsEquivalent.push(uniqueAFs[0])
      alternativeASDeviationsAvg.push(deviationsAvg)
    } else {
      alternativeUniqueASesToInclude.splice(uniqueASIndex, 1)
    }
  }
  alarmTableData.alternative_key_normalized = alternativeUniqueASesToInclude
  alarmTableData.alternative_key_normalized_af = alternativeASAFsEquivalent
  alarmTableData.alternative_key_avg_deviation = alternativeASDeviationsAvg
}

function ihrNetworkDisconnectionAlarmsPostTransformer(alarm, alarmTableData, _) {
  const networkDisconnectionStartTimebins = alarm.network_disconnection_start_timebin
  const networkDisconnectionEndTimebins = alarm.network_disconnection_end_timebin
  const networkDisconnectionProbIds = alarm.network_disconnection_stream_prob_id

  if (networkDisconnectionStartTimebins && networkDisconnectionEndTimebins) {
    const startTimebin = Math.min(...networkDisconnectionStartTimebins)
    const endTimebin = Math.max(...networkDisconnectionEndTimebins)
    const durationMinutes = AggregatedAlarmsUtils.roundToDecimalPlaces((endTimebin - startTimebin) / 60, 0)
    alarmTableData.stream_start_time = new Date(startTimebin * 1000)
    alarmTableData.stream_end_time = new Date(endTimebin * 1000)
    alarmTableData.stream_duration_minutes = durationMinutes
  }

  if (networkDisconnectionProbIds) {
    const probIdsSeperated = [...new Set(networkDisconnectionProbIds)].flatMap((val) => String(val).split(', '))
    const uniqueProbIds = [...new Set(probIdsSeperated)].map((probId) => Number(probId))
    alarmTableData.stream_disconnected_probe_ids = uniqueProbIds
    const percentageValue = AggregatedAlarmsUtils.getPercentageValue(alarmTableData.stream_disconnected_probe_ids.length, alarmTableData.stream_total_probes)
    alarmTableData.stream_disconnected_probe_percentage = percentageValue === null ? 'N/A' : percentageValue
  }
}

function iodAlamsPostTransformer(selectedAlarmType, alarm, alarmTableData) {
  const iodaUnitValue = alarm[`${selectedAlarmType}_value`]
  const iodaHistoricalUnitValue = alarm[`${selectedAlarmType}_historical_value`]

  if (iodaUnitValue) {
    const unitValueMax = Math.max(...alarm[`${selectedAlarmType}_value`])
    const percentageUnitValueAvg = AggregatedAlarmsUtils.roundToDecimalPlaces(alarmTableData.value_avg / unitValueMax * 100, 2)
    const percentageUnitValueMedian = AggregatedAlarmsUtils.roundToDecimalPlaces(alarmTableData.value_median / unitValueMax * 100, 2)
    alarmTableData.value_avg_percentage = percentageUnitValueAvg
    alarmTableData.value_median_percentage = percentageUnitValueMedian
  }

  if (iodaHistoricalUnitValue) {
    const historicalUnitValueMax = Math.max(...alarm[`${selectedAlarmType}_historical_value`])
    const historicalPercentageUnitValueAvg = AggregatedAlarmsUtils.roundToDecimalPlaces(alarmTableData.historical_value_avg / historicalUnitValueMax * 100, 2)
    const historicalPercentageUnitValueMedian = AggregatedAlarmsUtils.roundToDecimalPlaces(alarmTableData.historical_value_median / historicalUnitValueMax * 100, 2)
    alarmTableData.historical_value_avg_percentage = historicalPercentageUnitValueAvg
    alarmTableData.historical_value_median_percentage = historicalPercentageUnitValueMedian
  }
}

function sortTableColumnsToInclude(tableColumnsToInclude, key) {
  tableColumnsToInclude.sort((a, b) => {
    if (a.name === 'overview') return -1;
    if (b.name === 'overview') return 1;
    if (a.name === 'asn_overview') return -1;
    if (b.name === 'asn_overview') return 1;
    if (a.name.endsWith('overview')) return -1;
    if (b.name.endsWith('overview')) return 1;
    if (a.name === key) return -1;
    if (b.name === key) return 1;
    if (a.name.startsWith(key) && b.name.startsWith(key)) return 0;
    if (a.name.startsWith(key)) return -1
    return 1
  });
}

function tableDataPostTransformer(alarmsFiltered, alarmsTableData, selectedAlarmType) {
  for (const alarmFiltered of alarmsFiltered) {
    const key = alarmFiltered.asn
    if (!alarmsTableData[key]) continue
    const alarmFilteredByPrefixes = AggregatedAlarmsUtils.filterDictByPrefixes(alarmFiltered, [selectedAlarmType])
    for (const alarmFilteredColumn in alarmFilteredByPrefixes) {
      const alarmFilteredOriginalColumn = alarmFilteredColumn.split(`${selectedAlarmType}_`)[1]
      if (alarmsTableData[key][alarmFilteredOriginalColumn] === undefined) alarmsTableData[key][alarmFilteredOriginalColumn] = alarmFiltered[alarmFilteredColumn]
    }
    alarmsTableData[key] = { ...alarmFilteredByPrefixes, ...alarmsTableData[key] }
  }
}

function getMedianValueHelper(alarm, selectedAlarmType, columnName) {
  const column = columnName.substring(0, columnName.lastIndexOf('_'))
  const values = alarm[`${selectedAlarmType}_${column}`]
  const medianDeviation = AggregatedAlarmsUtils.getMedianValue(values)
  return medianDeviation === null ? 'N/A' : medianDeviation
}

function getAverageValueHelper(alarm, selectedAlarmType, columnName) {
  const column = columnName.substring(0, columnName.lastIndexOf('_'))
  const values = alarm[`${selectedAlarmType}_${column}`]
  const averageDeviation = AggregatedAlarmsUtils.getAverageValue(values)
  return averageDeviation === null ? 'N/A' : averageDeviation
}

function getSumValue(alarm, selectedAlarmType, columnName) {
  const column = columnName.substring(0, columnName.lastIndexOf('_'))
  const values = alarm[`${selectedAlarmType}_${column}`]
  const sumValue = values.reduce((acc, curr) => acc + curr, 0)
  return sumValue
}

function getCount(alarm, selectedAlarmType, columnName) {
  const column = columnName.substring(0, columnName.lastIndexOf('_'))
  if (column == 'total') {
    return alarm[`${selectedAlarmType}_count`].length
  } else {
    return alarm[`${selectedAlarmType}_${column}`].length
  }
}

function getSeverityCount(alarm, selectedAlarmType, severityType) {
  const severities = alarm[`${selectedAlarmType}_severity`]
  const severityCount = severities.filter((severity) => severity === severityType).length
  return severityCount
}


export function getAlternativeKeyEndPointNames(endpoints, ipAddressFamilies, deviations, topN) {
  const deviationsEndpointIndicesMapping = []
  for (let i = 0; i < deviations.length; i++) {
    deviationsEndpointIndicesMapping[i] = [deviations[i], i]
  }
  deviationsEndpointIndicesMapping.sort((a, b) => b[0] - a[0]);

  const endpointDeviationsSorted = []
  for (const deviationMapping of deviationsEndpointIndicesMapping) {
    const endpointIndex = deviationMapping[1]
    endpointDeviationsSorted.push(endpoints[endpointIndex])
  }
  const result = endpointDeviationsSorted.slice(0, topN).map((endpoint, index) => `AS${ipAddressFamilies[index]}${endpoint}`)
  return result
}

export function aggregateAlarmsByAlternativeKey(data, selectedAlarmType, alternativeKey, alarmTypeColumns) {
  const keys = { [selectedAlarmType]: alternativeKey }
  const alternativeKeyWithPrefix = `${selectedAlarmType}_${alternativeKey}`
  const alternativeKeysData = data[alternativeKeyWithPrefix]
  const rowData = []
  for (let i = 0; i < alternativeKeysData.length; i++) {
    const element = {}
    for (const key in data) {
      if (!Array.isArray(data[key]) || !key.startsWith(selectedAlarmType) && key !== alternativeKeyWithPrefix) continue;
      element[key] = data[key][i]
    }
    element[alternativeKeyWithPrefix] = data[alternativeKeyWithPrefix][i]
    element.event_type = selectedAlarmType
    rowData.push(element)
  }
  const alarmsAggregated = Object.values(AggregatedAlarmsDataModel.aggregateAlarms(rowData, alarmTypeColumns, keys)).filter((alarm) => alarm.asn_country_iso_code3)
  for (const alarm of alarmsAggregated) {
    alarm.asn_name_truncated = AggregatedAlarmsDataModel.truncateASName(alarm.asn_name, alarm.asn, 10)
  }
  return alarmsAggregated
}