import { getGRIPAlarms } from "@/plugins/GripApi.js"

export function extractAlarms(alarmDataSourcesFilter, alarmTypesFilter, hegemonyAlarms, networkDelayAlarms, gripAlarmsState, startTime, endTime, severity) {
    const request = () => {
        return new Promise((resolve, reject) => {
            
            const extractedAlarms = {
                hegemoneyAlarms: alarmTypesFilter.hegemony ? hegemonyAlarms : [],
                networkDelayAlarms: alarmTypesFilter.network_delay ? networkDelayAlarms : [],
                gripAlarms: []
            }

            if (alarmDataSourcesFilter.grip) {
                extractGRIPAlarmsHelper(gripAlarmsState, startTime, endTime, severity).then((gripAlarms) => {
                    extractedAlarms.gripAlarms = gripAlarms
                    resolve(extractedAlarms)
                }).catch(error => {
                    reject(error)
                })
            } else {
                console.log('extractedAlarms else alarmDataSourcesFilter.grip', extractedAlarms)
                resolve(extractedAlarms)
            }

        })
    }
    return request()
}

function extractGRIPAlarmsHelper(gripAlarmsState, startTime, endTime, severity) {
    const request = () => {
        return new Promise((resolve, reject) => {
            if (gripAlarmsState.data) {
                resolve(gripAlarmsState.data)
            }
            if (!gripAlarmsState.data && !gripAlarmsState.downloading) {
                gripAlarmsState.downloading = true
                getGRIPAlarms(startTime, endTime, severity).then((gripAlarms) => {
                    gripAlarmsState.downloading = false
                    gripAlarmsState.data = gripAlarms
                    resolve(gripAlarmsState.data)
                })
                    .catch(error => {
                        reject(error)
                    })
            }
        })
    }
    return request()
}


