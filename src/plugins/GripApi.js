import * as AggregatedAlarmsUtils from './utils/AggregatedAlarmsUtils'
import axios from 'axios'

export function getGripAlarms(startTime, endTime, timezone = '', minSuspicionLevel = 80, maxSuspicionLevel = 100, eventType = 'all', onePage = false) {
  const request = () => {
    return new Promise((resolve, _) => {
      getGripAlarmsHelper(startTime, endTime, timezone, minSuspicionLevel, maxSuspicionLevel, eventType, onePage)
        .then((gripAlarmsData) => resolve(gripAlarmsData))
        .catch(error => {
          console.error(error)
          resolve([])
        })
    })
  }
  return request()
}

function getGripAlarmsHelper(startTime, endTime, timezone = '', minSuspicionLevel = 80, maxSuspicionLevel = 100, eventType = 'all', onePage) {
  const API_URL = 'https://ihr.iijlab.net/proxy/grip/events';

  const chunkSize = 100;
  const startUTCTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(startTime, timezone)
  const endUTCTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(endTime, timezone)

  const params = {
    length: chunkSize,
    start: 0,
    ts_start: startUTCTimeFormatted,
    ts_end: endUTCTimeFormatted,
    min_susp: minSuspicionLevel,
    max_susp: maxSuspicionLevel,
    event_type: eventType
  };

  const request = () => {
    return axios.get(API_URL, { params })
      .then((handleResponse))
      .catch((error) => Promise.reject(error));
  };

  const handleResponse = (response) => {
    const data = response.data;
    const totalRecords = parseInt(data.recordsTotal);
    const bgpAlertsData = [...data.data];
    if (onePage) {
      return bgpAlertsData
    }
    const getPageDataPromises = createGetPageDataPromises(totalRecords, bgpAlertsData, params);

    return Promise.all(getPageDataPromises)
      .then(() => bgpAlertsData)
      .catch(error => Promise.reject(error));
  };

  const createGetPageDataPromises = (totalRecords, bgpAlertsData, params) => {
    const getPageDataPromises = [];

    for (let i = 100; i < totalRecords; i += 100) {
      params.start = i;
      const getPromise = getPageData(API_URL, params)
        .then(pageData => {
          bgpAlertsData.push(...pageData);
          return delay(0.5);
        })
        .catch(_ => {
          return delay(1000);
        });

      getPageDataPromises.push(getPromise);
    }

    return getPageDataPromises;
  };

  const getPageData = async (url, params) => {
    return axios.get(url, { params })
      .then(response => response.data.data);
  };

  const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  return request();
}