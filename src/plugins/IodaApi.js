import * as AggregatedAlarmsUtils from '../models/AggregatedAlarmsUtils'
import axios from 'axios'

export function getIodaAlarms(startTime, endTime, timezone = ':00Z', entityType = 'asn', ignoreMethods = '*.sarima',) {
  const request = () => {
    return new Promise((resolve, _) => {
      getIodaAlarmsHelper(startTime, endTime, timezone, entityType, ignoreMethods)
        .then((iodaAlarmsData) => resolve(iodaAlarmsData))
        .catch(error => {
          console.error(error)
          resolve([])
        })
    })
  }
  return request()
}

function getIodaAlarmsHelper(startTime, endTime, timezone, entityType, ignoreMethods) {
  const API_URL = 'https://ihr.iijlab.net/proxy/ioda/alerts'

  const startUTCTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(startTime, timezone)
  const endUTCTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(endTime, timezone)

  const startUnixTime = Date.parse(startUTCTimeFormatted) / 1000;
  const endUnixTime = Date.parse(endUTCTimeFormatted) / 1000;

  const params = {
    from: startUnixTime, until: endUnixTime,
    entityType: entityType, ignoreMethods: ignoreMethods
  };

  const request = async () => {
    return axios.get(API_URL, { params })
      .then((response) => response.data.data)
      .catch((error) => Promise.reject(error));
  };

  return request();
}

export function getIodaEntityInfo(entityType, entityValue, startUnixTime, endUnixTime, sourceParams) {
  const API_URL = `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/${entityType}/${entityValue}?from=${startUnixTime}&until=${endUnixTime}&sourceParams=${sourceParams}`
  const request = () => {
    return new Promise((resolve, reject) => {
      axios.get(API_URL)
        .then((response) => {
          const data = response.data.data.length ? response.data.data[0] : []
          resolve(data)
        })
        .catch((error) => reject(error))
    })
  }
  return request()
}
