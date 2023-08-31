import * as AggregatedAlarmsUtils from '../models/AggregatedAlarmsUtils'
import axios from 'axios'

export function getIodaAlarms(iodaAlarmsState, startTime, endTime, timezone='00Z', entityType='asn', ignoreMethods = '*.sarima',) {
  const request = () => {
    return new Promise((resolve, reject) => {
      if (iodaAlarmsState.data) {
        return resolve(iodaAlarmsState.data)
      }
      if (!iodaAlarmsState.data && !iodaAlarmsState.downloading) {
        iodaAlarmsState.downloading = true
        getIodaAlarmsHelper(startTime, endTime, timezone, entityType, ignoreMethods).then((iodaAlarms) => {
          iodaAlarmsState.downloading = false
          iodaAlarmsState.data = iodaAlarms
          return resolve(iodaAlarmsState.data)
        })
          .catch(error => {
            return reject(error)
          })
      }
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
      .catch((error) => {
        console.error(error)
        return []
      });
  };

  return request();
}
