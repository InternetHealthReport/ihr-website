import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'

export function etl(
  alarms,
  aggregatedAttrsZipped,
  countryName,
  alarmTypeTitlesMap,
  legend,
  isASGranularity
) {
  const asGranularity = switchASGranularity(countryName, isASGranularity)
  const alarmsFilteredByCountryOptional = countryName
    ? filterAlarmsByCountry(alarms, countryName)
    : alarms
  const alarmCountsAggregatedBySeverity = aggregateAlarmCountsBySeverityType(
    alarmsFilteredByCountryOptional,
    aggregatedAttrsZipped,
    asGranularity.key
  )
  const treeMapTrace = getTreeMapTrace(
    alarmCountsAggregatedBySeverity,
    asGranularity.key,
    alarmTypeTitlesMap,
    legend
  )
  return treeMapTrace
}

function switchASGranularity(country, isASGranularity) {
  let result
  if (country || isASGranularity) {
    result = { key: 'asn_name_truncated' }
  } else {
    result = { key: 'asn_country' }
  }
  return result
}

function filterAlarmsByCountry(alarms, countryName) {
  return alarms.filter((item) => item.asn_country === countryName && item.asn_name_truncated)
}

function aggregateAlarmCountsBySeverityType(alarms, aggregatedAttrsZipped, key) {
  const alarmCountsAggregatedBySeverity = []
  for (const [alarmCountType, _, alarmSevertiyType, [__, ___]] of aggregatedAttrsZipped) {
    for (const alarm of alarms) {
      if (!alarm[alarmSevertiyType]) continue
      const keyValue = alarm[key]
      const alarmCounts = alarm[alarmCountType]
      const alarmSeverities = alarm[alarmSevertiyType]

      const severityTypeAlarmCounts = {}

      for (let i = 0; i < alarmSeverities.length; i++) {
        const severity = alarmSeverities[i]
        severityTypeAlarmCounts[severity] =
          (severityTypeAlarmCounts[severity] || 0) + alarmCounts[i]
      }

      for (const severityType in severityTypeAlarmCounts) {
        const alarmType = alarmCountType.split('_count')[0]
        const alarmTypeTitledCase = AggregatedAlarmsUtils.titleCase(alarmType)
        const severityTypeTitledCase = AggregatedAlarmsUtils.titleCase(severityType)
        const count = severityTypeAlarmCounts[severityType]
        const alarmCountAggregatedBySeverity = {
          [key]: keyValue,
          alarm_type: alarmTypeTitledCase,
          severity: severityTypeTitledCase,
          count: count
        }
        alarmCountsAggregatedBySeverity.push(alarmCountAggregatedBySeverity)
      }
    }
  }
  const alarmsAggregated = aggregateAlarmCountsByCriteria(alarmCountsAggregatedBySeverity)
  return alarmsAggregated
}

function aggregateAlarmCountsByCriteria(alarmCountsAggregatedBySeverity) {
  const alarmCountsMap = {}
  for (const alarm of alarmCountsAggregatedBySeverity) {
    const key = JSON.stringify({
      asn_country: alarm.asn_country,
      alarm_type: alarm.alarm_type,
      severity: alarm.severity,
      asn_name_truncated: alarm.asn_name_truncated
    })

    if (!alarmCountsMap[key]) {
      alarmCountsMap[key] = alarm
    } else {
      alarmCountsMap[key].count += alarm.count
    }
  }
  const groupedAlarms = Object.values(alarmCountsMap)
  return groupedAlarms
}

function getTreeMapTrace(alarmCountsAggregatedBySeverity, key, alarmTypeTitlesMap, legend) {
  if (!alarmCountsAggregatedBySeverity.length || !key) {
    return {}
  }
  const keyUniqueValues = AggregatedAlarmsUtils.getPropertyUniqueValues(
    alarmCountsAggregatedBySeverity,
    key
  )
  const alarmTypeUniqueValues = AggregatedAlarmsUtils.getPropertyUniqueValues(
    alarmCountsAggregatedBySeverity,
    'alarm_type'
  )
  const severityUniqueValues = AggregatedAlarmsUtils.getPropertyUniqueValues(
    alarmCountsAggregatedBySeverity,
    'severity'
  )

  const trace = createBaseTrace(legend)

  addKeyValues(trace, alarmCountsAggregatedBySeverity, key, keyUniqueValues)

  addAlarmTypeValues(
    trace,
    alarmCountsAggregatedBySeverity,
    key,
    keyUniqueValues,
    alarmTypeUniqueValues,
    alarmTypeTitlesMap
  )

  addSeverityValues(
    trace,
    alarmCountsAggregatedBySeverity,
    key,
    keyUniqueValues,
    alarmTypeUniqueValues,
    severityUniqueValues
  )

  return trace
}

function createBaseTrace(legend) {
  return {
    type: 'treemap',
    ids: [],
    labels: [],
    parents: [],
    values: [],
    text: [],
    hoverinfo: 'label+text+value',
    level: legend
  }
}

function addKeyValues(trace, alarms, key, keyUniqueValues) {
  for (const keyValue of keyUniqueValues) {
    const keyAlarmCounts = alarms
      .filter((alarm) => alarm[key] === keyValue)
      .reduce((sum, alarm) => sum + alarm.count, 0)
    const traceText = `Total Number of Alarms: ${keyAlarmCounts}`
    trace.ids.push(keyValue)
    trace.labels.push(keyValue)
    trace.parents.push('')
    trace.values.push(0)
    trace.text.push(traceText)
  }
}

function addAlarmTypeValues(
  trace,
  alarms,
  key,
  keyUniqueValues,
  alarmTypeUniqueValues,
  alarmTypeTitlesMap
) {
  for (const keyValue of keyUniqueValues) {
    for (const alarmType of alarmTypeUniqueValues) {
      const traceId = `${keyValue}-${alarmType}`
      const alarmTypeCount = alarms
        .filter((alarm) => alarm[key] === keyValue && alarm.alarm_type === alarmType)
        .reduce((sum, alarm) => sum + alarm.count, 0)
      const alarmTypeTransformed = alarmType.trim().toLowerCase().replace(/\s/g, '_')
      const alarmTypeTitle = alarmTypeTitlesMap[alarmTypeTransformed]
      const traceText = `${alarmTypeTitle} Alarm Counts: ${alarmTypeCount}`
      trace.ids.push(traceId)
      trace.labels.push(alarmTypeTitle)
      trace.parents.push(keyValue)
      trace.values.push(0)
      trace.text.push(traceText)
    }
  }
}

function addSeverityValues(
  trace,
  alarms,
  key,
  keyUniqueValues,
  alarmTypesUniqueValues,
  severityUniqueValues
) {
  for (const keyValue of keyUniqueValues) {
    for (const alarmType of alarmTypesUniqueValues) {
      for (const severity of severityUniqueValues) {
        const alarm = alarms.find(
          (alarm) =>
            alarm[key] === keyValue && alarm.alarm_type === alarmType && alarm.severity === severity
        )
        if (alarm) {
          const traceId = `${keyValue}-${alarmType}-${severity}`
          const traceParentValue = `${keyValue}-${alarmType}`
          const traceValue = alarm.count
          trace.ids.push(traceId)
          trace.labels.push(severity)
          trace.parents.push(traceParentValue)
          trace.values.push(traceValue)
          trace.text.push('')
        }
      }
    }
  }
}

export function getChartTitle(
  treeMapTrace,
  severitiesSelected,
  countryName,
  legend,
  isASGranularity
) {
  let chartTitle = 'Alarms by Severities'
  if (!treeMapTrace || !severitiesSelected) {
    return chartTitle
  } else {
    const severityCount = getSeverityCount(treeMapTrace, legend)
    if (severityCount === null) return chartTitle
    const alarmCounts = severityCount.low + severityCount.medium + severityCount.high
    if (((countryName && legend) || (legend && !countryName)) && !isASGranularity) {
      chartTitle = `${legend}: ${alarmCounts} Alarms |`
    } else if (countryName || isASGranularity) {
      const asnCounts = treeMapTrace.parents.filter((parent) => !parent).length
      const legendNameVal =
        (countryName && legend) || (legend && !countryName)
          ? legend
          : countryName
            ? countryName
            : 'All'
      chartTitle = `${legendNameVal}: ${alarmCounts} Alarms | ${asnCounts} ASes |`
    } else {
      chartTitle = `${alarmCounts} Alarms |`
    }

    chartTitle = getChartTitleHelper(chartTitle, severitiesSelected, severityCount)
    return chartTitle
  }
}

function getChartTitleHelper(title, severitiesSelected, severityCount) {
  const severitiesReversed = severitiesSelected.slice(0).reverse()
  let titleUpdated = title
  for (let i = 0; i < severitiesReversed.length; i++) {
    const severityLabel = severitiesReversed[i]
    titleUpdated += ` ${AggregatedAlarmsUtils.titleCase(severityLabel)}: ${severityCount[severityLabel]} |`
  }
  titleUpdated = titleUpdated.substring(0, titleUpdated.length - 1).trim()
  return titleUpdated
}

function getSeverityCount(treeMapTrace, legend = null) {
  if (AggregatedAlarmsUtils.isDictEmpty(treeMapTrace)) return null
  const severitiesCount = { low: 0, medium: 0, high: 0 }

  const treeMapTraceFiltered = { ids: [], values: [] }

  if (legend) {
    const legendVal = legend.toLowerCase()
    for (let i = 0; i < treeMapTrace.ids.length; i++) {
      const id = treeMapTrace.ids[i].toLowerCase()
      const value = treeMapTrace.values[i]
      if (id.startsWith(legendVal)) {
        treeMapTraceFiltered.ids.push(id)
        treeMapTraceFiltered.values.push(value)
      }
    }
  } else {
    treeMapTraceFiltered.ids = treeMapTrace.ids
    treeMapTraceFiltered.values = treeMapTrace.values
  }

  for (let i = 0; i < treeMapTraceFiltered.ids.length; i++) {
    const treeMapTraceId = treeMapTraceFiltered.ids[i].toLowerCase()
    for (const severityLabel in severitiesCount) {
      if (treeMapTraceId.includes(severityLabel)) {
        severitiesCount[severityLabel] += treeMapTraceFiltered.values[i]
        break
      }
    }
  }
  return severitiesCount
}
