import * as AggregatedAlarmsUtils from './AggregatedAlarmsUtils'

export function etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap) {
  const groupByKey = countryName ? 'asn_name' : 'country_name'
  const alarmsFilteredByCountryOptional = countryName ? filterAlarmsByCountry(alarms, countryName) : alarms
  const alarmCountsAggregatedBySeverity = aggregateAlarmCountsBySeverityType(alarmsFilteredByCountryOptional, aggregatedAttrsZipped, groupByKey)
  const treeMapTrace = getTreeMapTrace(alarmCountsAggregatedBySeverity, groupByKey, alarmTypeTitlesMap)
  return treeMapTrace
}

function filterAlarmsByCountry(alarms, countryName) {
  return alarms.filter(item => item.country_name === countryName && item.asn_name)
}

function aggregateAlarmCountsBySeverityType(alarms, aggregatedAttrsZipped, groupByKey) {
  const alarmCountsAggregatedBySeverity = []
  for (const [alarmCountType, alarmTimebinType, alarmSevertiyType] of aggregatedAttrsZipped) {
    for (const alarm of alarms) {
      const groupByKeyValue = alarm[groupByKey]
      const alarmCounts = alarm[alarmCountType]
      const alarmSeverities = alarm[alarmSevertiyType]

      const severityTypeAlarmCounts = {};

      for (let i = 0; i < alarmSeverities.length; i++) {
        const severity = alarmSeverities[i];
        severityTypeAlarmCounts[severity] = (severityTypeAlarmCounts[severity] || 0) + alarmCounts[i];
      }

      for (const severityType in severityTypeAlarmCounts) {
        const alarmType = alarmCountType.split('_alarm')[0]
        const alarmTypeTitledCase = AggregatedAlarmsUtils.titleCase(alarmType)
        const severityTypeTitledCase = AggregatedAlarmsUtils.titleCase(severityType)
        const count = severityTypeAlarmCounts[severityType];
        const alarmCountAggregatedBySeverity = { [groupByKey]: groupByKeyValue, alarm_type: alarmTypeTitledCase, severity: severityTypeTitledCase, count: count }
        alarmCountsAggregatedBySeverity.push(alarmCountAggregatedBySeverity);
      }
    }
  }
  const alarmsAggregated = aggregateAlarmCountsByCriteria(alarmCountsAggregatedBySeverity)
  return alarmsAggregated;
}

function aggregateAlarmCountsByCriteria(alarmCountsAggregatedBySeverity) {
  const alarmCountsMap = {};
  for (const alarm of alarmCountsAggregatedBySeverity) {
    const key = JSON.stringify({
      country_name: alarm.country_name,
      alarm_type: alarm.alarm_type,
      severity: alarm.severity,
      asn_name: alarm.asn_name
    });

    if (!alarmCountsMap[key]) {
      alarmCountsMap[key] = alarm;
    } else {
      alarmCountsMap[key].count += alarm.count;
    }
  }
  const groupedAlarms = Object.values(alarmCountsMap);
  return groupedAlarms
}

function getTreeMapTrace(alarmCountsAggregatedBySeverity, groupByKey, alarmTypeTitlesMap) {
  if (!alarmCountsAggregatedBySeverity.length || !groupByKey) {
    return {}
  }
  const groupByKeyUniqueValues = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(alarmCountsAggregatedBySeverity, groupByKey);
  const alarmTypesUniqueValues = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(alarmCountsAggregatedBySeverity, 'alarm_type');
  const severitiesUniqueValues = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(alarmCountsAggregatedBySeverity, 'severity');

  const trace = createBaseTrace()

  addGroupByKeyValues(trace, alarmCountsAggregatedBySeverity, groupByKey, groupByKeyUniqueValues);

  addAlarmTypeValues(trace, alarmCountsAggregatedBySeverity, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues, alarmTypeTitlesMap);

  addSeverityValues(trace, alarmCountsAggregatedBySeverity, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues, severitiesUniqueValues)

  return trace
}

function createBaseTrace() {
  return {
    type: 'treemap',
    ids: [],
    labels: [],
    parents: [],
    values: [],
    text: [],
    hoverinfo: 'label+text+value',
  }
}

function addGroupByKeyValues(trace, alarms, groupByKey, groupByKeyUniqueValues) {
  for (const groupByKeyUniqueValue of groupByKeyUniqueValues) {
    const groupByKeyAlarmCounts = alarms.filter(alarm => alarm[groupByKey] === groupByKeyUniqueValue).reduce((sum, alarm) => sum + alarm.count, 0);
    const traceText = `Total Number of Alarms: ${groupByKeyAlarmCounts}`
    trace.ids.push(groupByKeyUniqueValue);
    trace.labels.push(groupByKeyUniqueValue);
    trace.parents.push('');
    trace.values.push(0);
    trace.text.push(traceText);
  }
}

function addAlarmTypeValues(trace, alarms, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues, alarmTypeTitlesMap) {
  for (const groupByKeyUniqueValue of groupByKeyUniqueValues) {
    for (const alarmTypeUniqueValue of alarmTypesUniqueValues) {
      const traceId = `${groupByKeyUniqueValue}-${alarmTypeUniqueValue}`
      const alarmTypeCount = alarms.filter(alarm => alarm[groupByKey] === groupByKeyUniqueValue && alarm.alarm_type === alarmTypeUniqueValue).reduce((sum, alarm) => sum + alarm.count, 0);
      const alarmType = alarmTypeUniqueValue.trim().toLowerCase().replace(/\s/g,'_')
      const alarmTypeTitle = alarmTypeTitlesMap[alarmType]
      const traceText = `${alarmTypeTitle} Alarm Counts: ${alarmTypeCount}`
      trace.ids.push(traceId);
      trace.labels.push(alarmTypeTitle);
      trace.parents.push(groupByKeyUniqueValue);
      trace.values.push(0);
      trace.text.push(traceText);
    }
  }
}

function addSeverityValues(trace, alarms, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues, severitiesUniqueValues) {
  for (const groupByKeyUniqueValue of groupByKeyUniqueValues) {
    for (const alarmTypeUniqueValue of alarmTypesUniqueValues) {
      for (const severityUniqueValue of severitiesUniqueValues) {
        const alarm = alarms.find(alarm => alarm[groupByKey] === groupByKeyUniqueValue && alarm.alarm_type === alarmTypeUniqueValue && alarm.severity === severityUniqueValue);
        if (alarm) {
          const traceId = `${groupByKeyUniqueValue}-${alarmTypeUniqueValue}-${severityUniqueValue}`
          const traceParentValue = `${groupByKeyUniqueValue}-${alarmTypeUniqueValue}`
          const traceValue = alarm.count
          trace.ids.push(traceId);
          trace.labels.push(severityUniqueValue);
          trace.parents.push(traceParentValue);
          trace.values.push(traceValue);
          trace.text.push('');
        }
      }
    }
  }
}
