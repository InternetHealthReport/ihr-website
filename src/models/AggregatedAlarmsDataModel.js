import { getGripAlarms } from "@/plugins/GripApi"
import { getIodaAlarms } from "@/plugins/IodaApi"
import { getKeysValuesEndWithSuffixes, deepCopy, filterDictByPrefixes, formatUTCTime, compareUtcStrings } from '@/plugins/AggregatedAlarmsUtils'
import { getCountryISOCode3 } from '@/plugins/countryISOCode3'
import getCountryName from '@/plugins/countryName'
import axios from 'axios'

const dataSourcesTransformers = {
    ihr: {
        transformFunc: transformIHRAlarms,
    },
    grip: {
        transformFunc: transformGripAlarms,
    },
    ioda: {
        transformFunc: transformIodaAlarms,
    },
}

export function etl(dataSourcesMetadata, dataSourcesSelected, alarmTypesFilter, aggregatedAttrsSelected, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime) {
    return new Promise((resolve, reject) => {
        extractAlarms(dataSourcesSelected, alarmTypesFilter, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime).then((extractedAlarms) => {
            transformAlarms(extractedAlarms, dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected).then((alarms) => {
                resolve(alarms)
            }).catch((error) => reject(error))
        }).catch((error) => reject(error))
    })
}

function extractAlarms(dataSourcesSelected, alarmTypesFilter, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime) {
    const request = () => {
        return new Promise((resolve, reject) => {
            let extractedAlarms = {
                ihr: { hegemony: [], network_delay: [] },
                grip: [], ioda: []
            }

            extractedAlarms.ihr.hegemony = alarmTypesFilter.hegemony ? hegemonyAlarms : []
            extractedAlarms.ihr.network_delay = alarmTypesFilter.network_delay ? networkDelayAlarms : []

            const gripAlarmsPromise = dataSourcesSelected.grip
                ? extractGripAlarmsHelper(thirdPartyAlarmsStates.grip, startTime, endTime)
                : Promise.resolve([]);

            const iodaAlarmsPromise = dataSourcesSelected.ioda
                ? extractIodaAlarmsHelper(thirdPartyAlarmsStates.ioda, startTime, endTime)
                : Promise.resolve([]);

            Promise.all([gripAlarmsPromise, iodaAlarmsPromise]).then(([gripAlarms, iodaAlarms]) => {
                extractedAlarms.grip = gripAlarms;
                extractedAlarms.ioda = iodaAlarms;
                return resolve(extractedAlarms)
            }).catch((error) => {
                return reject(error)
            })

        });
    }

    return request();
}

function transformAlarms(alarms, dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected) {
    const request = () => {
        return new Promise((resolve, reject) => {
            const transformedAlarms = dynamicAlarmsTransformation(alarms, dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected)
            transformAlarmsHelper(transformedAlarms).then((alarms) => {
                return resolve(alarms)
            }).catch(error => {
                reject(error)
            })
        })
    }
    return request()
}

function dynamicAlarmsTransformation(alarms, dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected) {
    let alarmsTransformed = {}
    for (const dataSource in dataSourcesSelected) {
        const isDataSourceSelected = dataSourcesSelected[dataSource]
        if (isDataSourceSelected) {
            const { transformFunc } = dataSourcesTransformers[dataSource];
            const alarmTypesDataSource = Object.keys(dataSourcesMetadata[dataSource].alarm_types)
            const aggregatedAttrsDataSource = filterDictByPrefixes(aggregatedAttrsSelected, alarmTypesDataSource)
            const alarmsDataSourceTransformed = transformFunc(alarms[dataSource], aggregatedAttrsDataSource);
            const listOfTransformedAlarmsDict = Object.values(alarmsTransformed)[0];
            const alarmsTransformedAggregatedAttrs = getKeysValuesEndWithSuffixes(listOfTransformedAlarmsDict, ['_alarm_counts', '_alarm_timebins', '_alarm_severities']);
            alarmsTransformed = fullOuterJoinAlarms(alarmsTransformed, alarmsDataSourceTransformed, alarmsTransformedAggregatedAttrs, aggregatedAttrsDataSource);
        }
    }
    return alarmsTransformed
}

function transformIHRAlarms(ihrAlarmsSegregated, ihrAggregatedAttrs) {
    const { hegemony: hegemonyAlarms, network_delay: networkDelayAlarms } = ihrAlarmsSegregated
    const networkDelayAlarmsASFiltered = filterASNetworkDelayAlarms(networkDelayAlarms)
    const hegemonyAlarmsTransformed = transformHegemonyASNameAndCountryIsoCode2(hegemonyAlarms)
    const hegemonyAlarmsWithEventType = addEventType(hegemonyAlarmsTransformed, 'hegemony')
    const networkDelayAlarmsWithEventType = addEventType(networkDelayAlarmsASFiltered, 'network_delay')
    const ihrAlarms = [...hegemonyAlarmsWithEventType, ...networkDelayAlarmsWithEventType]
    const ihrAlarmsSeveritiesTransformed = transformAlarmsSeverities(ihrAlarms, ihrSeverityMapper)
    const ihrAlarmsAggregated = aggregateAlarms(ihrAlarmsSeveritiesTransformed, ihrAggregatedAttrs)
    return ihrAlarmsAggregated
}

function transformGripAlarms(gripAlarms, gripAggregatedAttrs) {
    const gripAlarmsTransformed = filterGripAlarms(gripAlarms);
    const gripAlarmsSeveritiesTransformed = transformAlarmsSeverities(gripAlarmsTransformed, gripSeverityMapper)
    const gripAlarmsAggregated = aggregateAlarms(gripAlarmsSeveritiesTransformed, gripAggregatedAttrs);
    return gripAlarmsAggregated;
}

function transformIodaAlarms(iodaAlarms, iodaAggregatedAttrs) {
    const iodaAlarmsTransformed = filterIodaAlarms(iodaAlarms);
    const iodaAlarmsSeveritiesTransformed = transformAlarmsSeverities(iodaAlarmsTransformed, iodaSeverityMapper)
    const iodaAlarmsAggregated = aggregateAlarms(iodaAlarmsSeveritiesTransformed, iodaAggregatedAttrs);
    return iodaAlarmsAggregated;
}

function filterASNetworkDelayAlarms(networkDelayAlarms) {
    const filteredASNetworkDelayAlarms = networkDelayAlarms
        .filter(alarm => alarm.startpoint_type === 'AS')
        .map(alarm => ({ ...alarm, asn: alarm.startpoint_name, asn_name: alarm.startpoint_name }));
    return filteredASNetworkDelayAlarms
}

function filterGripAlarms(gripAlarms) {
    const gripAlarmsTransformed = gripAlarms.reduce((acc, curr) => {
        const trustWorthy = curr.summary.tr_worthy;

        if (trustWorthy === true) {
            curr.summary.victims.forEach((victim) => {
                const asnInfo = curr.asinfo[victim]
                const asnName = asnInfo && asnInfo.asrank && asnInfo.asrank.asnName ? asnInfo.asrank.asnName.trim() : victim
                const countryIsoCode2 = asnInfo && asnInfo.asrank && asnInfo.asrank.organization && asnInfo.asrank.organization.country
                    && asnInfo.asrank.organization.country.iso ? asnInfo.asrank.organization.country.iso : null
                const eventType = curr.event_type
                const severityValue = curr.pfx_events[0].inferences[0].suspicion_level
                const eventLocalDateTime = new Date(curr.last_modified_ts * 1000)
                const eventUTCDateTimeFormatted = formatUTCTime(eventLocalDateTime, '00Z')

                let bgpAlertAlarm = {
                    asn_name: asnName,
                    asn: victim,
                    country_iso_code2: countryIsoCode2,
                    timebin: eventUTCDateTimeFormatted,
                    event_type: eventType,
                    severity: severityValue
                };

                acc.push(bgpAlertAlarm);
            });
        }

        return acc;
    }, []);
    return gripAlarmsTransformed;
}

function filterIodaAlarms(iodaAlarms) {
    const iodaAlarmsNonEmpty = iodaAlarms.filter((alarm) => Object.keys(alarm).length)
    const iodaAlarmsTransformed = iodaAlarmsNonEmpty.reduce((acc, curr) => {
        const asnName = curr.entity.attrs.name ? curr.entity.attrs.name : curr.entity.attrs.org
        const asnNumber = curr.entity.code
        const eventType = curr.datasource.replace('-', '_')
        const iodaSeverityLevel = curr.level
        const eventLocalDateTime = new Date(curr.time * 1000)
        const eventUTCDateTimeFormatted = formatUTCTime(eventLocalDateTime, '00Z')

        const iodaAlarm = {
            asn_name: asnName,
            asn: asnNumber,
            country_iso_code2: null,
            timebin: eventUTCDateTimeFormatted,
            event_type: eventType,
            severity: iodaSeverityLevel,
        };
        acc.push(iodaAlarm);
        return acc;
    }, []);
    return iodaAlarmsTransformed;
}

function addEventType(alarms, eventTypeName) {
    const alarmsWithEventType = deepCopy(alarms)
    for (const alarm of alarmsWithEventType) {
        alarm.event_type = eventTypeName
    }
    return alarmsWithEventType
}

function transformAlarmsSeverities(alarms, alarmSeverityMapper) {
    const alarmsSeveritiesTransformed = deepCopy(alarms)
    for (const alarm of alarmsSeveritiesTransformed) {
        alarm.severity = alarmSeverityMapper(alarm)
    }
    return alarmsSeveritiesTransformed
}

function gripSeverityMapper(alarm) {
    const severityValue = alarm.severity
    let severityLabel;
    if (severityValue >= 80 && severityValue <= 100) {
        severityLabel = 'high'
    } else if (severityValue >= 21 && severityValue <= 79) {
        severityLabel = 'normal'
    } else if (severityValue >= 0 && severityValue <= 20) {
        severityLabel = 'low'
    }
    return severityLabel
}

function iodaSeverityMapper(alarm) {
    const severityValue = alarm.severity
    let severityLabel;
    if (severityValue === 'critical') {
        severityLabel = 'high'
    } else if (severityValue === 'normal') {
        severityLabel = 'normal'
    } else {
        severityLabel = 'low'
    }
    return severityLabel
}

function ihrSeverityMapper(alarm) {
    const severityValue = alarm.deviation
    let severityLabel;
    if (severityValue >= 20) {
        severityLabel = 'high'
    }
    return severityLabel
}

function transformHegemonyASNameAndCountryIsoCode2(hegemonyAlarms) {
    const hegemonyAlarmsUpdatedWithASNameAndIsoCode2 = deepCopy(hegemonyAlarms)
    for (const alarm of hegemonyAlarmsUpdatedWithASNameAndIsoCode2) {
        updateASNameAndCountryIsoCode2(alarm, alarm.asn_name)
    }
    return hegemonyAlarmsUpdatedWithASNameAndIsoCode2
}

function aggregateAlarms(alarmsTransformed, aggregatedAttrs) {
    const aggregatedAlarms = alarmsTransformed.reduce((acc, curr) => {

        const { asn, asn_name, country_iso_code2, timebin, severity, event_type } = curr;

        if (!acc[asn]) {
            acc[asn] = {
                asn_name,
                asn,
                country_iso_code2,
                ...deepCopy(aggregatedAttrs)
            };
        }

        updateAlarmAggregatedAttrs(acc[asn], timebin, severity, event_type);

        return acc;
    }, {});

    return aggregatedAlarms;
}

function updateAlarmAggregatedAttrs(alarm, timebin, severity, eventType) {
    const alarmCountsAttr = `${eventType}_alarm_counts`
    const alarmTimebinsAttr = `${eventType}_alarm_timebins`
    const alarmSeveritiesAttr = `${eventType}_alarm_severities`
    if (alarm[alarmCountsAttr]) {
        alarm[alarmCountsAttr].push(1);
    }
    if (alarm[alarmTimebinsAttr]) {
        alarm[alarmTimebinsAttr].push(timebin);
    }
    if (alarm[alarmSeveritiesAttr]) {
        alarm[alarmSeveritiesAttr].push(severity)
    }
}

function fullOuterJoinAlarms(alarms1, alarms2, alarmsAggregatedAttrs1, alarmsAggregatedAttrs2) {
    const fullOuterJoin = (alarmsInput, alarmAggregatedAttrs) => {
        const mergedResult = {};
        for (const asnNumber in alarmsInput) {
            const alarmAggregated = alarmsInput[asnNumber];
            const alarmAggregatedAttrsCopied = deepCopy(alarmAggregatedAttrs);
            mergedResult[asnNumber] = { ...alarmAggregated, ...alarmAggregatedAttrsCopied };
        }
        return mergedResult
    }

    const updateMergedAlarms = (mergedAlarms, alarmsInput, alarmAggregatedAttrsASNotFound) => {
        for (const asnNumber in alarmsInput) {
            const alarmAggregated = alarmsInput[asnNumber];
            if (mergedAlarms[asnNumber]) {
                Object.assign(mergedAlarms[asnNumber], alarmAggregated);
            } else {
                const alarmAggregatedAttrsASNotFoundCopied = deepCopy(alarmAggregatedAttrsASNotFound);
                mergedAlarms[asnNumber] = { ...alarmAggregated, ...alarmAggregatedAttrsASNotFoundCopied }
            }
        }
    }

    let mergedAlarms = {}

    const mergedAlarms1 = fullOuterJoin(alarms1, alarmsAggregatedAttrs2);
    updateMergedAlarms(mergedAlarms, mergedAlarms1, alarmsAggregatedAttrs2);

    const mergedAlarms2 = fullOuterJoin(alarms2, alarmsAggregatedAttrs1);
    updateMergedAlarms(mergedAlarms, mergedAlarms2, alarmsAggregatedAttrs1);
    return mergedAlarms;
}


function transformAlarmsHelper(alarms) {
    const request = () => {
        return new Promise((resolve, reject) => {
            addASNameAndCountryIsoCode2(alarms).then((alarmsWithCountryIsoCodes2) => {
                const alarmsWithCountries = addCountryIsoCode3AndCountryName(alarmsWithCountryIsoCodes2)
                const alarmsList = convertAlarmsDictToList(alarmsWithCountries)
                const filteredAlarms = filterAlarmsByCountryIsoCode3(alarmsList)
                resolve(filteredAlarms)
            }).catch(error => {
                reject(error)
            })
        })
    }
    return request()
}

function addASNameAndCountryIsoCode2(data) {
    const alarms = deepCopy(data);
    const asnNumbers = [];

    for (let asnNumber in alarms) {
        const alarm = alarms[asnNumber]
        const containsCountryIsoCode2 = alarm.country_iso_code2
        if (!containsCountryIsoCode2 || !isNaN(alarm.asn_name)) {
            asnNumbers.push(asnNumber)
        }
    }

    const needToGetASNamesAndIsoCodes = asnNumbers.length > 0;
    if (needToGetASNamesAndIsoCodes) {
        const alarmsWithCountryIsoCodes2Promise = getASNamesAndIsoCodes(alarms, asnNumbers)
        return alarmsWithCountryIsoCodes2Promise
    } else {
        return Promise.resolve(alarms)
    }
}

function addCountryIsoCode3AndCountryName(data) {
    const alarms = deepCopy(data)
    for (let asnNumber in alarms) {
        const countryCode2 = alarms[asnNumber].country_iso_code2
        Object.assign(alarms[asnNumber], getCountryIsoCode3AndName(countryCode2))
    }
    return alarms
}

function convertAlarmsDictToList(alarms) {
    const alarmsCopied = deepCopy(alarms)
    for (const asnNumber in alarmsCopied) {
        alarmsCopied[asnNumber].asn = asnNumber;
    }
    const alarmsArray = Object.values(alarmsCopied)
    return alarmsArray
}

function filterAlarmsByCountryIsoCode3(alarmsList) {
    return Object.values(alarmsList).filter(alarm => alarm.country_iso_code3)
}

function getASNamesAndIsoCodes(alarms, asnNumbers) {
    return new Promise((resolve, reject) => {
        const alarmsCopied = deepCopy(alarms)
        const asnNumbersCommaSeparated = asnNumbers.join(',');
        getASNameAndCountryIsoCode2Proxy(asnNumbersCommaSeparated)
            .then(asnNamesAndIsoCodes2 => {
                for (const asnNameAndIsoCode2 of asnNamesAndIsoCodes2) {
                    const { asn_number } = asnNameAndIsoCode2;
                    alarmsCopied[asn_number].country_iso_code2 = asnNameAndIsoCode2.country_iso_code2;
                    alarmsCopied[asn_number].asn_name = asnNameAndIsoCode2.asn_name;
                }
                return resolve(alarmsCopied);
            })
            .catch(error => {
                console.error('Error retrieving ASN name and country ISO code:', error);
                return reject(error);
            });
    });
}

function getASNameAndCountryIsoCode2Proxy(asnNumbersCommaSeperated, maxRetries = 5, delay = 1000) {
    let retries = 0;

    const request = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                getASNameAndCountryIsoCode2(asnNumbersCommaSeperated)
                    .then(asnNamesAndIsoCodes2 => {
                        resolve(asnNamesAndIsoCodes2);
                    })
                    .catch(error => {
                        if (retries < maxRetries) {
                            retryRequest(asnNumbersCommaSeperated, resolve, reject)
                        } else {
                            console.error(`Maximum retries reached for ASN ${asnNumbersCommaSeperated}`)
                            reject(error);
                        }
                    });
            }, delay)
        });
    };

    const retryRequest = (asnNumber, resolve, reject) => {
        retries++;
        console.log(`Retrying request for ASN ${asnNumber} (Attempt ${retries + 1})...`);
        setTimeout(() => {
            request().then(resolve).catch(reject);
        }, delay);
    };

    return request();
}

function getASNameAndCountryIsoCode2(asnNumbersCommaSeperated) {
    const asnNamesAndIsoCodes2 = []

    const request = () => {
        return new Promise((resolve, reject) => {
            getNetworkInfoIHR(asnNumbersCommaSeperated).then((networks) => {
                networks.forEach(network => {
                    for (let asnNumber of asnNumbersCommaSeperated.split(',')) {
                        if (network.number == asnNumber) {
                            const countryIsoCode2 = normalizeCountryIsoCode2(network.name)
                            const asnName = normalizeASName(network.name)
                            asnNamesAndIsoCodes2.push({
                                asn_number: asnNumber,
                                asn_name: asnName,
                                country_iso_code2: countryIsoCode2,
                            })
                        }
                    }
                    return resolve(asnNamesAndIsoCodes2)
                })
            }).catch((error) => reject(error))
        })
    }

    return request();
}


function getNetworkInfoIHR(asnList) {
    const API_URL = "https://ihr.iijlab.net/ihr/api/networks";
    const MAX_ASNS_PER_REQUEST = 30; // Adjust this as needed

    const asnArray = asnList.split(',').map(asn => asn.trim());
    const numRequests = Math.ceil(asnArray.length / MAX_ASNS_PER_REQUEST);

    const requests = [];
    for (let i = 0; i < numRequests; i++) {
        const startIdx = i * MAX_ASNS_PER_REQUEST;
        const endIdx = (i + 1) * MAX_ASNS_PER_REQUEST;
        const slicedASNs = asnArray.slice(startIdx, endIdx);

        const params = { number: slicedASNs.join(',') };

        requests.push(
            axios.get(API_URL, { params })
                .then(response => response.data.results)
                .catch(error => {
                    throw error;
                })
        );
    }

    return Promise.all(requests)
        .then(resultsArray => resultsArray.flat()); // Combine results from all requests
}

function updateASNameAndCountryIsoCode2(alarm, asnName) {
    alarm.country_iso_code2 = normalizeCountryIsoCode2(asnName);
    alarm.asn_name = normalizeASName(asnName);
}

function normalizeCountryIsoCode2(asnName) {
    return asnName.split(',').splice(-1)[0].trim()
}

function normalizeASName(asnName) {
    return asnName.split(',').splice(0, asnName.split(',').length - 1).join(',').trim()
}

function getCountryIsoCode3AndName(countryIsoCode2) {
    const country_iso_code3 = getCountryISOCode3(countryIsoCode2)
    const country_name = getCountryName(countryIsoCode2)
    return { country_iso_code3, country_name }
}

function extractGripAlarmsHelper(gripAlarmsState, startTime, endTime) {
    const request = () => {
        return new Promise((resolve, reject) => {
            if (gripAlarmsState.data) {
                return resolve(gripAlarmsState.data)
            }
            if (!gripAlarmsState.data && !gripAlarmsState.downloading) {
                gripAlarmsState.downloading = true
                getGripAlarms(startTime, endTime).then((gripAlarms) => {
                    gripAlarmsState.downloading = false
                    gripAlarmsState.data = gripAlarms
                    return resolve(gripAlarmsState.data)
                })
                    .catch(error => {
                        return reject(error)
                    })
            }
        })
    }
    return request()
}

function extractIodaAlarmsHelper(iodaAlarmsState, startTime, endTime) {
    const request = () => {
        return new Promise((resolve, reject) => {
            if (iodaAlarmsState.data) {
                return resolve(iodaAlarmsState.data)
            }
            if (!iodaAlarmsState.data && !iodaAlarmsState.downloading) {
                iodaAlarmsState.downloading = true
                getIodaAlarms(startTime, endTime).then((iodaAlarms) => {
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

export function filterAlarmsByTime(alarms, startDateTime, endDateTime, aggregatedAttrsZipped) {
    const filteredAlarms = alarms.map((alarm) => {
        const filteredAlarm = filterAlarmByTime(alarm, startDateTime, endDateTime, aggregatedAttrsZipped);
        return filteredAlarm;
    }).filter((alarm) => alarm !== null);
    return filteredAlarms;
}

function filterAlarmByTime(alarm, startDateTime, endDateTime, aggregatedAttrsZipped) {
    const isAlarmTimebinInRangeResult = isAlarmTimebinInRange(alarm, startDateTime, endDateTime, aggregatedAttrsZipped);

    if (isAlarmTimebinInRangeResult === null) {
        return null;
    }

    const filteredAlarm = { ...alarm };
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        filteredAlarm[alarmTimebinType] = isAlarmTimebinInRangeResult[alarmTimebinType];
        filteredAlarm[alarmCountType] = Array(filteredAlarm[alarmTimebinType].length).fill(1);
    }

    return filteredAlarm;
}

function isAlarmTimebinInRange(alarm, startDateTime, endDateTime, aggregatedAttrsZipped) {
    let areAllTimebinTypesEmpty = true;

    const filteredTimebins = {};
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        filteredTimebins[alarmTimebinType] = alarm[alarmTimebinType].filter((timebin) => {
            const timebinStartDateTimeComp = compareUtcStrings(timebin, startDateTime);
            const timebinEndDateTimeComp = compareUtcStrings(timebin, endDateTime);
            return timebinStartDateTimeComp >= 0 && timebinEndDateTimeComp <= 0;
        });
        areAllTimebinTypesEmpty = areAllTimebinTypesEmpty && filteredTimebins[alarmTimebinType].length === 0;
    }

    if (areAllTimebinTypesEmpty) {
        return null
    } else {
        return filteredTimebins
    }
}
