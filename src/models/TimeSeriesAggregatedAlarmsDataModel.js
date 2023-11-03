import * as AggregatedAlarmUtils from './AggregatedAlarmsUtils'

export function etl(alarms, aggregatedAttrsZipped, countryName, alarmTypeTitlesMap, legend, isASGranularity) {
  const asGranularity = switchASGranularity(countryName, isASGranularity)
  const alarmsFilteredByCountryOptional = countryName ? filterAlarmsByCountry(alarms, countryName) : alarms
  const alarmsGroupedByKey = groupAlarmsByKey(alarmsFilteredByCountryOptional, asGranularity.key, aggregatedAttrsZipped);
  aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped)
  addAllAlarmCountsRecord(alarmsGroupedByKey, aggregatedAttrsZipped)
  addAlarmCountsAcrossAllTimebins(alarmsGroupedByKey, aggregatedAttrsZipped)
  sortAlarmsByCountry(alarmsGroupedByKey)
  const hoverData = getHoverZippedData(alarmsGroupedByKey, aggregatedAttrsZipped)
  const timeSeriesTraces = getTimeSeriesTraces(alarmsGroupedByKey, hoverData, asGranularity.legend, aggregatedAttrsZipped, alarmTypeTitlesMap, legend)
  return timeSeriesTraces
}

function switchASGranularity(country, isASGranularity) {
  return country || isASGranularity
    ? { key: 'asn', legend: 'asn_name_truncated' }
    : { key: 'asn_country', legend: 'asn_country' }
}

function filterAlarmsByCountry(alarms, countryName) {
  const alarmsFilteredByCountry = alarms.filter(item => item.asn_country === countryName && item.asn_name_truncated);
  return alarmsFilteredByCountry
}

function groupAlarmsByKey(alarms, key, aggregatedAttrsZipped) {
  const alarmsGroupedByKey = alarms.reduce((result, obj) => {
    const existingEntry = result.find((entry) => entry[key] === obj[key]);

    if (existingEntry) {
      for (const [alarmCountType, alarmTimebinType, _, [__, ___]] of aggregatedAttrsZipped) {
        if ((!existingEntry[alarmTimebinType] && !existingEntry[alarmCountType]) || (!obj[alarmCountType] && !obj[alarmTimebinType])) continue
        existingEntry[alarmTimebinType] = existingEntry[alarmTimebinType].concat(obj[alarmTimebinType]);
        existingEntry[alarmCountType] = existingEntry[alarmCountType].concat(obj[alarmCountType]);
      }
    } else {
      let alarmEntry = {
        [key]: obj[key],
        ...obj,
        asn_country_iso_code2: obj.asn_country_iso_code2,
        asn_country_iso_code3: obj.asn_country_iso_code3,
        asn_country: obj.asn_country,
      };

      result.push(alarmEntry);
    }
    return result;
  }, []);

  return alarmsGroupedByKey;
}

function aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped) {
  for (let i = 0; i < alarmsGroupedByKey.length; i++) {
    for (const [alarmCountTypeSelected, alarmTimebinTypeSelected, _, [__, ___]] of aggregatedAttrsZipped) {
      const alarm = alarmsGroupedByKey[i]
      if (!alarm[alarmCountTypeSelected] && !alarm[alarmTimebinTypeSelected]) continue
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
    asn_country_iso_code2: 'All',
    asn_country_iso_code3: 'All',
    asn_country: 'All',
    asn_name: 'All',
    asn_name_truncated: 'All',
  }

  for (const [alarmCountType, alarmTimebinType, _, [__, ___]] of aggregatedAttrsZipped) {
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
    for (const [_, alarmTimebinType, __, [___, ____]] of aggregatedAttrsZipped) {
      if (!alarmAggregated[alarmTimebinType]) continue
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
  for (const [alarmCountType, _, __, [___, ____]] of aggregatedAttrsZipped) {
    alarmAggregated[`${alarmCountType}_across_timebins`] = Array(alarmAggregated.timebins.length).fill(0);
  }
}

function addAlarmCountsValuesAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped) {
  for (let i = 0; i < alarmAggregated.timebins.length; i++) {
    const timebin = alarmAggregated.timebins[i];
    for (const [alarmCountType, alarmTimebinType, _, [__, ___]] of aggregatedAttrsZipped) {
      if (!alarmAggregated[alarmCountType] && !alarmAggregated[alarmTimebinType]) continue
      const alarmTimebinIndicies = AggregatedAlarmUtils.findAllIndices(alarmAggregated[alarmTimebinType], timebin)
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
    for (const [alarmCountType, _, __, [___, ____]] of aggregatedAttrsZipped) {
      alarmAggregated.total_alarm_counts_across_all_timebins[i] += alarmAggregated[`${alarmCountType}_across_timebins`][i];
    }
  }
}

function sortAlarmsByCountry(alarmsByCountryData) {
  alarmsByCountryData.sort((a, b) => {
    if (a.asn_country.toLowerCase() === 'all') {
      return -1
    } else if (b.asn_country.toLowerCase() === 'all') {
      return 1
    } else {
      return a.asn_country.toLowerCase().localeCompare(b.asn_country.toLowerCase())
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
      for (const [alarmCountType, _, __, [___, ____]] of aggregatedAttrsZipped) {
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

function getTimeSeriesTraces(alarms, hoverData, legendName, aggregatedAttrsZipped, alarmTypeTitlesMap, legend) {
  if (!alarms.length || !hoverData.length || !legendName || !aggregatedAttrsZipped.length) {
    return []
  }
  const traces = []
  for (let i = 0; i < alarms.length; i++) {
    if (alarms[i].timebins.length && alarms[i].total_alarm_counts_across_all_timebins.length) {
      const trace = {
        x: alarms[i].timebins.map((unixTimebin) => new Date(unixTimebin * 1000).toISOString()),
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
      trace.hovertemplate = getHoverTemplate(alarms[i],aggregatedAttrsZipped, alarmTypeTitlesMap)
      if (!legend) {
        trace.visible = i === 0 ? true : 'legendonly'
      } else {
        trace.visible = trace.name === legend ? true : 'legendonly'
      }
      traces.push(trace)
    }
  }
  positionCustomLegend(legend, traces)
  return traces
}

function positionCustomLegend(legend, traces) {
  if (legend) {
    const index = traces.findIndex((trace) => trace.name === legend)
    if (index !== -1) {
      const trace = traces[index]
      traces.splice(index, 1);
      traces.splice(1, 0, trace);
    }
  }
}

function getHoverTemplate(alarm, aggregatedAttrsZipped, alarmTypeTitlesMap) {
  let hoverTemplate = '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p} (UTC)</b><br>' + 'Total Number of Alarms: %{y}<br>'
  for (const [alarmCountType, _, __, [___, ____]] of aggregatedAttrsZipped) {
    const alarmType = alarmCountType.split('_count')[0]
    const alarmCountTypeTitledCase = `${alarmTypeTitlesMap[alarmType]} Alarm Counts`
    hoverTemplate += `${alarmCountTypeTitledCase}: %{customdata.${alarmCountType}}<br>`
  }
  return hoverTemplate
}

export function getChartTitle(timeSeriesTraces = null, countryName = null, startEndDateTime = null, legend = null, isASGranularity = false) {
  let chartTitle = 'Alarms over Time'
  if (!timeSeriesTraces || !timeSeriesTraces.length) {
    return chartTitle
  } else {
    const { startDateFormatted, endDateFormatted } = startEndDateTime
    let totalAlarmCounts;
    if ((countryName && legend || legend && !countryName) && !isASGranularity) {
      const traceSelectedLegend = timeSeriesTraces.findIndex((trace) => trace.name === legend)
      if (traceSelectedLegend !== -1) {
        totalAlarmCounts = timeSeriesTraces[traceSelectedLegend].y.reduce((acc, curr) => acc + curr, 0)
        chartTitle = `${legend}: ${totalAlarmCounts} Alarms | ${startDateFormatted} - ${endDateFormatted}`
      }
    } else if (countryName || isASGranularity) {
      totalAlarmCounts = timeSeriesTraces.slice(1).flatMap((trace) => trace.y).reduce((acc, curr) => acc + curr, 0)
      const legendNameVal = (countryName && legend || legend && !countryName) ? legend : countryName  ? countryName : 'All'
      chartTitle = `${legendNameVal}: ${totalAlarmCounts} Alarms | ${startDateFormatted} - ${endDateFormatted}`
    } else {
      totalAlarmCounts = timeSeriesTraces.slice(1).flatMap((trace) => trace.y).reduce((acc, curr) => acc + curr, 0)
      chartTitle = `${totalAlarmCounts} Alarms | ${startDateFormatted} - ${endDateFormatted}`
    }
    return chartTitle
  }
}

export function formatDate(inputDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dateParts = inputDate.split('-');
  const year = dateParts[0];
  const month = months[parseInt(dateParts[1]) - 1];
  const day = dateParts[2];

  return `${month} ${day}, ${year}`;
}
