import { formatUTCTime } from '@/plugins/AggregatedAlarmsUtils'
import axios from 'axios'

export function getIodaAlarms(startTime, endTime, timezone='00Z', entityType = 'asn', ignoreMethods = '*.sarima',) {
    const API_URL = "https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts"

    const startUTCTimeFormatted = formatUTCTime(startTime, timezone)
    const endUTCTimeFormatted = formatUTCTime(endTime, timezone)

    const startUnixTime = Date.parse(startUTCTimeFormatted) / 1000;
    const endUnixTime = Date.parse(endUTCTimeFormatted) / 1000;

    const params = {
        from: startUnixTime, until: endUnixTime,
        entityType: entityType, ignoreMethods: ignoreMethods
    };

    const request = () => {
        return axios.get(API_URL, { params })
            .then((response) => response.data.data)
            .catch((error) => { throw error });
    };

    return request();
}