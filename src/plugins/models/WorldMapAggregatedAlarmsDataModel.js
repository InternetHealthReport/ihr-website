import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'

export function etl(alarms, alarmCountsSelected, alarmTypeTitlesMap) {
  const alarmCountsByCountry = groupAlarmCountsByCountry(alarms, alarmCountsSelected)
  addTotalAlarmCountsAttr(alarmCountsByCountry, alarmCountsSelected)
  const worldMapData = getWorldMapData(alarmCountsByCountry)
  const hoverData = getHoverZippedData(worldMapData, alarmCountsSelected)
  const worldMapTrace = getWorldMapTrace(
    worldMapData,
    hoverData,
    alarmCountsSelected,
    alarmTypeTitlesMap
  )
  return worldMapTrace
}

function groupAlarmCountsByCountry(alarms, alarmCountsSelected) {
  const alarmsByCountry = alarms.reduce((result, obj) => {
    const existingEntry = result.find(
      (entry) =>
        entry.asn_country_iso_code2 === obj.asn_country_iso_code2 &&
        entry.asn_country_iso_code3 === obj.asn_country_iso_code3 &&
        entry.asn_country === obj.asn_country
    )

    if (existingEntry) {
      addAlarmCountsAttr(existingEntry, obj, alarmCountsSelected)
    } else {
      let alarmsInitial = {
        asn_country_iso_code2: obj.asn_country_iso_code2,
        asn_country_iso_code3: obj.asn_country_iso_code3,
        asn_country: obj.asn_country,
        total_alarm_counts: obj.total_alarm_counts
      }
      addAlarmCountsAttr(alarmsInitial, obj, alarmCountsSelected)
      result.push(alarmsInitial)
    }

    return result
  }, [])
  return alarmsByCountry
}

function addAlarmCountsAttr(accumulator, current, alarmCountsSelected) {
  for (const alarmCountType of alarmCountsSelected) {
    accumulator[alarmCountType] =
      (accumulator[alarmCountType] || 0) +
      (current[alarmCountType] ? current[alarmCountType].length : 0)
  }
}

function addTotalAlarmCountsAttr(alarms, alarmCountsSelected) {
  alarms.forEach((alarm) => {
    let totalAlarmCounts = 0
    alarmCountsSelected.forEach((alarmCountColumn) => {
      totalAlarmCounts += alarm[alarmCountColumn]
    })
    alarm.total_alarm_counts = totalAlarmCounts
  })
}

function getWorldMapData(inputData) {
  const data = {}
  for (let field in inputData[0]) {
    for (let index in inputData) {
      if (!data[field]) {
        data[field] = []
      }
      data[field].push(inputData[index][field])
    }
  }
  return data
}

function getHoverZippedData(alarmsData, alarmCountsSelected) {
  if (AggregatedAlarmsUtils.isDictEmpty(alarmsData) || !alarmCountsSelected.length) {
    return []
  }
  const zippedData = []
  const alarmCountsTypeList = alarmsData[alarmCountsSelected[0]]
  for (let i = 0; i < alarmCountsTypeList.length; i++) {
    const customDataElement = {}
    alarmCountsSelected.forEach((alarmCountsType) => {
      let alarmCountsValue = alarmsData[alarmCountsType][i]
      customDataElement[alarmCountsType] = alarmCountsValue
    })
    zippedData.push(customDataElement)
  }
  return zippedData
}

function getWorldMapTrace(worldMapData, hoverData, alarmCountsSelected, alarmTypeTitlesMap) {
  let trace = {}
  trace.customdata = hoverData
  trace.locations = worldMapData['asn_country_iso_code3']
    ? worldMapData['asn_country_iso_code3']
    : []
  trace.z = worldMapData['total_alarm_counts'] ? worldMapData['total_alarm_counts'] : []
  trace.text = worldMapData['asn_country'] ? worldMapData['asn_country'] : []
  trace.hovertemplate = getHoverTemplate(alarmCountsSelected, alarmTypeTitlesMap)
  trace = trace.z.every((element) => element === 0) ? {} : trace
  return trace
}

function getHoverTemplate(alarmCountsSelected, alarmTypeTitlesMap) {
  let hoverTemplate = '<b>%{text}</b><br>' + 'Total Number of Alarms: %{z}<br>'
  for (const alarmCountType of alarmCountsSelected) {
    const alarmType = alarmCountType.split('_count')[0]
    const alarmCountTypeTitledCase = `${alarmTypeTitlesMap[alarmType]} Alarm Counts`
    hoverTemplate += `${alarmCountTypeTitledCase}: %{customdata.${alarmCountType}}<br>`
  }
  return hoverTemplate
}

export function getChartTitle(trace = null, alarms = null, selectedCountry = null, legend = null) {
  if (!trace || AggregatedAlarmsUtils.isDictEmpty(trace)) {
    return 'Alarms by Countries'
  } else {
    const selectedCountryVal = selectedCountry || legend
    const alarmCounts = trace.z.reduce((acc, curr) => acc + curr, 0)
    const chartTitle = selectedCountryVal
      ? `${selectedCountryVal}: ${alarmCounts} Alarms | ${alarms.length} ASes`
      : `${alarmCounts} Alarms | ${trace.locations.length} Countries | ${alarms.length} ASes`
    return chartTitle
  }
}
