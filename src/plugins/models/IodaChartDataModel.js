import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'
import * as IodaApiPlugin from '../IodaApi';

export function etl(entityType, entityValue, startDateTime, endDateTime, iodaAlarmTypes, sourceParams) {
  return new Promise((resolve, reject) => {
    extractAlarms(entityType, entityValue, startDateTime, endDateTime, sourceParams)
      .then((alarms) => resolve(transformAlarms(alarms, iodaAlarmTypes)))
      .catch((error) => reject(error))
  })
}

function extractAlarms(entityType, entityValue, startDateTime, endDateTime, sourceParams) {
  const startUnixTime = Math.floor(startDateTime.getTime() / 1000);
  const endUnixTime = Math.floor(endDateTime.getTime() / 1000)
  const request = IodaApiPlugin.getIodaEntityInfo(entityType, entityValue, startUnixTime, endUnixTime, sourceParams)
    .then((data) => data)
    .catch((error) => Promise.reject(error))
  return request
}

function transformAlarms(iodaData, iodaAlarmTypes) {
  const dataTransformed = []
  for (const iodaAlarmTypeData of iodaData) {
    const dataSource = iodaAlarmTypeData.datasource.replace('-', '_')
    const iodaDataSource = iodaAlarmTypes[dataSource]
    if (!iodaDataSource) continue
    const maxAlarmTypeUnitvalue = Math.max(...iodaAlarmTypeData.values)
    const unitValuesTransformed = iodaAlarmTypeData.values.filter((val) => val !== null).map((unitValue) => AggregatedAlarmsUtils.getPercentageValue(unitValue, maxAlarmTypeUnitvalue))
    const datesTransformed = []
    const nativeStep = iodaAlarmTypeData.nativeStep
    let fromUnixTime = iodaAlarmTypeData.from + nativeStep
    const untilUnixTime = iodaAlarmTypeData.until
    let index = 0
    while (fromUnixTime <= untilUnixTime) {
      if (iodaAlarmTypeData.values[index] !== null) {
        const dateTimeObj = new Date(fromUnixTime * 1000).toISOString()
        datesTransformed.push(dateTimeObj)
      }
      fromUnixTime += nativeStep
      index += 1
    }
    if (datesTransformed.length !== 0 && unitValuesTransformed.length !== 0 && datesTransformed.length === unitValuesTransformed.length) {
      dataTransformed.push({
        x: datesTransformed,
        y: unitValuesTransformed,
        name: iodaDataSource,
        mode: 'lines',
        type: 'scatter',
        hovertemplate: '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p} (UTC)</b><br>' + `${iodaDataSource}: %{y}<br><extra></extra>`
      })
    }

  }
  return dataTransformed
}
