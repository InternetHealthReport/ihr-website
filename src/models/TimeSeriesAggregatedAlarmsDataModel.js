import * as AggregatedAlarmUtils from './AggregatedAlarmsUtils'

export function etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap) {
  const groupByKey = countryName ? 'asn' : 'country_name'
  const legendName = countryName ? 'asn_name' : 'country_name'
  const alarmsFilteredByCountryOptional = countryName ? filterAlarmsByCountry(alarms, countryName) : alarms
  const alarmsGroupedByKey = groupAlarmsByKey(alarmsFilteredByCountryOptional, groupByKey, aggregatedAttrsZipped);
  aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped)
  addAllAlarmCountsRecord(alarmsGroupedByKey, aggregatedAttrsZipped)
  addAlarmCountsAcrossAllTimebins(alarmsGroupedByKey, aggregatedAttrsZipped)
  sortAlarmsByCountry(alarmsGroupedByKey)
  const hoverData = getHoverZippedData(alarmsGroupedByKey, aggregatedAttrsZipped)
  const timeSeriesTraces = getTimeSeriesTraces(alarmsGroupedByKey, hoverData, legendName, aggregatedAttrsZipped, alarmTypeTitlesMap)
  return timeSeriesTraces
}

function filterAlarmsByCountry(alarms, countryName) {
  const alarmsFilteredByCountry = alarms.filter(item => item.country_name === countryName && item.asn_name);
  return alarmsFilteredByCountry
}

function groupAlarmsByKey(alarms, key, aggregatedAttrsZipped) {
  const alarmsGroupedByKey = alarms.reduce((result, obj) => {
    const existingEntry = result.find((entry) => entry[key] === obj[key]);

    if (existingEntry) {
      for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        existingEntry[alarmTimebinType] = existingEntry[alarmTimebinType].concat(obj[alarmTimebinType]);
        existingEntry[alarmCountType] = existingEntry[alarmCountType].concat(obj[alarmCountType]);
      }
    } else {
      let alarmEntry = {
        [key]: obj[key],
        ...obj,
        country_iso_code2: obj.country_iso_code2,
        country_iso_code3: obj.country_iso_code3,
        country_name: obj.country_name,
      };

      result.push(alarmEntry);
    }
    return result;
  }, []);

  return alarmsGroupedByKey;
}

function aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped) {
  for (let i = 0; i < alarmsGroupedByKey.length; i++) {
    for (const [alarmCountTypeSelected, alarmTimebinTypeSelected, _] of aggregatedAttrsZipped) {
      const alarm = alarmsGroupedByKey[i]
      const timebins = alarm[alarmTimebinTypeSelected];
      const duplicatesCount = AggregatedAlarmUtils.countItemOccurrences(timebins)
      const uniqueSortedTimebins = Array.from(new Set(timebins.sort()));
      const summedCounts = uniqueSortedTimebins.map(timebin => {
        const alarmCountsSum = duplicatesCount[timebin] ? duplicatesCount[timebin] : 1
        return alarmCountsSum
      });
      alarm[alarmTimebinTypeSelected] = uniqueSortedTimebins
      alarm[alarmCountTypeSelected] = summedCounts;
    }
  }
}

function addAllAlarmCountsRecord(alarms, aggregatedAttrsZipped) {

  let totalAlarmCountsRecord = {
    country_iso_code2: 'All',
    country_iso_code3: 'All',
    country_name: 'All',
    asn_name: 'All'
  }

  for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
    totalAlarmCountsRecord[alarmCountType] = []
    totalAlarmCountsRecord[alarmTimebinType] = []
  }

  for (const alarm of alarms) {
    for (const key in alarm) {
      if (Array.isArray(totalAlarmCountsRecord[key])) {
        totalAlarmCountsRecord[key] = totalAlarmCountsRecord[key].concat(alarm[key]);
      }
    }
  }

  alarms.push(totalAlarmCountsRecord)
  return alarms
}


function addAlarmCountsAcrossAllTimebins(alarmsAggregated, aggregatedAttrsZipped) {
  alarmsAggregated.forEach(alarmAggregated => {
    let allTimebins = []
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
      allTimebins = allTimebins.concat(...alarmAggregated[alarmTimebinType])
    }
    const uniqueSortedTimebins = Array.from(new Set(allTimebins.sort()))
    alarmAggregated.timebins = uniqueSortedTimebins

    addAlarmCountsAttrsAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped)

    addAlarmCountsValuesAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped)

    addTotalAlarmCountsAttrAcrossAllTimebins(alarmAggregated)

    addTotalAlarmCountsValuesAcrossAllTimebins(alarmAggregated, aggregatedAttrsZipped);
  });
}

function addAlarmCountsAttrsAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped) {
  for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
    alarmAggregated[`${alarmCountType}_across_timebins`] = Array(alarmAggregated.timebins.length).fill(0);
  }
}

function addAlarmCountsValuesAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped) {
  for (let i = 0; i < alarmAggregated.timebins.length; i++) {
    const timebin = alarmAggregated.timebins[i];
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
      const alarmTimebinIndicies = AggregatedAlarmUtils.findIndicesOfValue(alarmAggregated[alarmTimebinType], timebin)
      for (const alarmTimebinIndex of alarmTimebinIndicies) {
        alarmAggregated[`${alarmCountType}_across_timebins`][i] += (alarmAggregated[alarmCountType][alarmTimebinIndex] || 0);
      }
    }
  }
}

function addTotalAlarmCountsAttrAcrossAllTimebins(alarmAggregated) {
  const totalAlarmCountsAcrossAllTimebins = Array(alarmAggregated.timebins.length).fill(0)
  alarmAggregated.total_alarm_counts_across_all_timebins = totalAlarmCountsAcrossAllTimebins
}

function addTotalAlarmCountsValuesAcrossAllTimebins(alarmAggregated, aggregatedAttrsZipped) {
  for (let i = 0; i < alarmAggregated.total_alarm_counts_across_all_timebins.length; i++) {
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
      alarmAggregated.total_alarm_counts_across_all_timebins[i] += alarmAggregated[`${alarmCountType}_across_timebins`][i];
    }
  }
}

function sortAlarmsByCountry(alarmsByCountryData) {
  alarmsByCountryData.sort((a, b) => {
    if (a.country_name.toLowerCase() === 'all') {
      return -1
    } else if (b.country_name.toLowerCase() === 'all') {
      return 1
    } else {
      return a.country_name.toLowerCase().localeCompare(b.country_name.toLowerCase())
    }
  });
}

function getHoverZippedData(data, aggregatedAttrsZipped) {
  const result = [];

  for (let i = 0; i < data.length; i++) {
    const row = [];
    const timebins = data[i].timebins;

    for (let j = 0; j < timebins.length; j++) {
      let customHoverDataElement = {}
      for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        customHoverDataElement[alarmCountType] = data[i][`${alarmCountType}_across_timebins`][j] || 0
      }
      row.push(customHoverDataElement);
    }
    if (row.length) {
      result.push(row);
    }
  }
  return result
}

function getTimeSeriesTraces(alarms, hoverData, legendName, aggregatedAttrsZipped, alarmTypeTitlesMap) {
  if (!alarms.length || !hoverData.length || !legendName || !aggregatedAttrsZipped.length) {
    return []
  }
  const traces = []
  for (let i = 0; i < alarms.length; i++) {
    if (alarms[i].timebins.length && alarms[i].total_alarm_counts_across_all_timebins.length) {
      const trace = {
        x: alarms[i].timebins,
        y: alarms[i].total_alarm_counts_across_all_timebins,
        type: 'scatter',
        mode: 'lines',
        name: alarms[i][legendName],
        customdata: hoverData[i],
        marker: {
          line: {
            color: 'rgb(255,255,255)',
            width: 1,
          },
        },
        hoverlabel: {
          bgcolor: 'white',
        },
      }
      trace.hovertemplate = getHoverTemplate(aggregatedAttrsZipped, alarmTypeTitlesMap)
      if (i !== 0) {
        trace.visible = 'legendonly'
        trace.hoverinfo = 'none'
      }
      traces.push(trace)
    }
  }
  return traces
}

function getHoverTemplate(aggregatedAttrsZipped, alarmTypeTitlesMap) {
  let hoverTemplate = '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p}</b><br>' + 'Total Number of Alarms: %{y}<br>'
  for (const [alarmCountType, alarmTimebinsType, _] of aggregatedAttrsZipped) {
    const alarmType = alarmCountType.split('_alarm_counts')[0]
    const alarmCountTypeTitledCase = `${alarmTypeTitlesMap[alarmType]} Alarm Counts`
    hoverTemplate += `${alarmCountTypeTitledCase}: %{customdata.${alarmCountType}}<br>`
  }
  return hoverTemplate
}
