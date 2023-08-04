import { truncateString, getUniqueValues, titleCase } from '@/plugins/AggregatedAlarmsUtils.js'

export function etl(alarms, aggregatedAttrsZipped, countryName) {
    const groupByKey = countryName ? 'asn_name' : 'country_name'
    const alarmsFilteredByCountryOptional = countryName ? filterAlarmsByCountry(alarms, countryName) : alarms
    const alarmCountsAggregatedBySeverity = aggregateAlarmCountsBySeverityType(alarmsFilteredByCountryOptional, aggregatedAttrsZipped, groupByKey)
    const treeMapTrace = getTreeMapTrace(alarmCountsAggregatedBySeverity, groupByKey)
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
                const alarmTypeTitledCase = titleCase(alarmType)
                const severityTypeTitledCase = titleCase(severityType)
                const count = severityTypeAlarmCounts[severityType];
                const alarmCountAggregatedBySeverity = { [groupByKey]: groupByKeyValue, alarm_type: alarmTypeTitledCase, severity: severityTypeTitledCase, count: count }
                alarmCountsAggregatedBySeverity.push(alarmCountAggregatedBySeverity);
            }
        }
    }
    return alarmCountsAggregatedBySeverity;
}

function getTreeMapTrace(alarmCountsAggregatedBySeverity, groupByKey) {
    if (!alarmCountsAggregatedBySeverity.length) {
        return {}
    }
    const groupByKeyUniqueValues = getUniqueValues(alarmCountsAggregatedBySeverity, groupByKey);
    const alarmTypesUniqueValues = getUniqueValues(alarmCountsAggregatedBySeverity, 'alarm_type');
    const severitiesUniqueValues = getUniqueValues(alarmCountsAggregatedBySeverity, 'severity');

    const trace = createBaseTrace()

    addGroupByKeyValues(trace, alarmCountsAggregatedBySeverity, groupByKey, groupByKeyUniqueValues);

    addAlarmTypeValues(trace, alarmCountsAggregatedBySeverity, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues);

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
        const traceLabelTruncated = truncateString(groupByKeyUniqueValue, 15)
        const groupByKeyAlarmCounts = alarms.filter(alarm => alarm[groupByKey] === groupByKeyUniqueValue).reduce((sum, alarm) => sum + alarm.count, 0);
        const totalAlarmCountsLabel = titleCase(`total_alarm_counts`)
        const groupByKeyLabel = titleCase(groupByKey)
        const traceText = `${groupByKeyLabel}: ${groupByKeyUniqueValue}<br>` + `${totalAlarmCountsLabel}: ${groupByKeyAlarmCounts}`
        trace.ids.push(groupByKeyUniqueValue);
        trace.labels.push(traceLabelTruncated);
        trace.parents.push('');
        trace.values.push(0);
        trace.text.push(traceText);
    }
}

function addAlarmTypeValues(trace, alarms, groupByKey, groupByKeyUniqueValues, alarmTypesUniqueValues) {
    for (const groupByKeyUniqueValue of groupByKeyUniqueValues) {
        for (const alarmTypeUniqueValue of alarmTypesUniqueValues) {
            const traceId = `${groupByKeyUniqueValue}-${alarmTypeUniqueValue}`
            const alarmTypeCount = alarms.filter(alarm => alarm[groupByKey] === groupByKeyUniqueValue && alarm.alarm_type === alarmTypeUniqueValue).reduce((sum, alarm) => sum + alarm.count, 0);
            const alarmTypeCountLabel = titleCase(`${alarmTypeUniqueValue}_alarm_counts`)
            const traceText = `${alarmTypeCountLabel}: ${alarmTypeCount}`
            trace.ids.push(traceId);
            trace.labels.push(alarmTypeUniqueValue);
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
