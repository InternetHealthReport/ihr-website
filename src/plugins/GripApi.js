import { formatUTCTime } from '@/plugins/AggregatedAlarmsUtils'
import axios from 'axios'

export function getGripAlarms(startTime, endTime, timezone='', minSuspicionLevel = 0, maxSuspicionLevel = 100, eventType = 'all') {
    const API_URL = 'https://api.grip.inetintel.cc.gatech.edu/json/events';

    const chunkSize = 100;
    const startUTCTimeFormatted = formatUTCTime(startTime, timezone)
    const endUTCTimeFormatted = formatUTCTime(endTime, timezone)

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
            .catch(handleError);
    };

    const handleResponse = (response) => {
        const data = response.data;
        const totalRecords = parseInt(data.recordsTotal);
        const bgpAlertsData = [];
        const getPageDataPromises = createGetPageDataPromises(totalRecords, bgpAlertsData, params);

        return Promise.all(getPageDataPromises)
            .then(() => {
                return bgpAlertsData
            }).catch(error => {
                reject(error)
            });
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
                    console.log('Error getting page data, retrying...');
                    return delay(1000);
                });

            getPageDataPromises.push(getPromise);
        }

        return getPageDataPromises;
    };

    const getPageData = (url, params) => {
        return axios.get(url, { params })
            .then(response => response.data.data);
    };

    const handleError = (error) => {
        throw error;
    };

    const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    return request();
}
