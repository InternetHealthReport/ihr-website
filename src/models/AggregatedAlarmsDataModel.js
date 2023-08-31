import * as GripApiPlugin from '../plugins/GripApi';
import * as IodaApiPlugin from '../plugins/IodaApi';
import * as AggregatedAlarmsUtils from './AggregatedAlarmsUtils'
import * as NetworkIhr from './NetworkIhr'
import { getCountryISOCode3 } from '../plugins/countryISOCode3'
import getCountryName from '../plugins/countryName'

const dataSourcesTransformers = {
  ihr: {
    transformFunc: transformIHRAlarms,
  },
  grip: {
    transformFunc: transformGripAlarms,
  },
  ioda: {
    transformFunc: transformIodaAlarms,
  }
}

export function etl(dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime) {
  return new Promise((resolve, reject) => {
    extractAlarms(dataSourcesSelected, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime).then((extractedAlarms) => {
      transformAlarms(extractedAlarms, dataSourcesMetadata, dataSourcesSelected, aggregatedAttrsSelected).then((alarms) => {
        resolve(alarms)
      }).catch((error) => reject(error))
    }).catch((error) => reject(error))
  })
}

function extractAlarms(dataSourcesSelected, hegemonyAlarms, networkDelayAlarms, thirdPartyAlarmsStates, startTime, endTime) {
  const request = () => {
    return new Promise((resolve, reject) => {
      let extractedAlarms = { ihr: {} }

      if (dataSourcesSelected.ihr) {
        extractedAlarms.ihr.hegemony = hegemonyAlarms
        extractedAlarms.ihr.network_delay = networkDelayAlarms
      } else {
        extractedAlarms.ihr.hegemony = []
        extractedAlarms.ihr.network_delay = []
      }

      const gripAlarmsPromise = dataSourcesSelected.grip
        ? GripApiPlugin.getGripAlarms(thirdPartyAlarmsStates.grip, startTime, endTime)
        : Promise.resolve([]);

      const iodaAlarmsPromise = dataSourcesSelected.ioda
        ? IodaApiPlugin.getIodaAlarms(thirdPartyAlarmsStates.ioda, startTime, endTime)
        : Promise.resolve([]);

      Promise.all([gripAlarmsPromise, iodaAlarmsPromise]).then(([gripAlarms, iodaAlarms]) => {
        extractedAlarms.grip = gripAlarms;
        extractedAlarms.ioda = iodaAlarms;
        return resolve(extractedAlarms)
      }).catch((error) => {
        console.error(error)
        return resolve(extractedAlarms)
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
      const aggregatedAttrsDataSource = AggregatedAlarmsUtils.filterDictByPrefixes(aggregatedAttrsSelected, alarmTypesDataSource)
      const alarmsDataSourceTransformed = transformFunc(alarms[dataSource], aggregatedAttrsDataSource);
      const listOfTransformedAlarmsDict = Object.values(alarmsTransformed)[0];
      const alarmsTransformedAggregatedAttrs = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffixes(listOfTransformedAlarmsDict, ['_alarm_counts', '_alarm_timebins', '_alarm_severities']);
      alarmsTransformed = fullOuterJoinAlarms(alarmsTransformed, alarmsDataSourceTransformed, alarmsTransformedAggregatedAttrs, aggregatedAttrsDataSource);
    }
  }
  return alarmsTransformed
}

function transformIHRAlarms(ihrAlarmsSegregated, ihrAggregatedAttrs) {
  const { hegemony: hegemonyAlarms, network_delay: networkDelayAlarms } = ihrAlarmsSegregated
  const networkDelayAlarmsASFiltered = filterAndMapASNetworkDelayAlarms(networkDelayAlarms)
  const hegemonyAlarmsTransformed = transformHegemonyASNameAndCountryIsoCode2(hegemonyAlarms)
  addEventType(hegemonyAlarmsTransformed, 'hegemony')
  addEventType(networkDelayAlarmsASFiltered, 'network_delay')
  const ihrAlarms = [...hegemonyAlarmsTransformed, ...networkDelayAlarmsASFiltered]
  transformAlarmsSeverities(ihrAlarms, ihrSeverityMapper)
  const ihrAlarmsAggregated = aggregateAlarms(ihrAlarms, ihrAggregatedAttrs)
  return ihrAlarmsAggregated
}

function transformGripAlarms(gripAlarms, gripAggregatedAttrs) {
  const gripAlarmsTransformed = filterGripAlarms(gripAlarms);
  transformAlarmsSeverities(gripAlarmsTransformed, gripSeverityMapper)
  const gripAlarmsAggregated = aggregateAlarms(gripAlarmsTransformed, gripAggregatedAttrs);
  return gripAlarmsAggregated;
}

function transformIodaAlarms(iodaAlarms, iodaAggregatedAttrs) {
  const iodaAlarmsTransformed = filterIodaAlarms(iodaAlarms);
  transformAlarmsSeverities(iodaAlarmsTransformed, iodaSeverityMapper)
  const iodaAlarmsAggregated = aggregateAlarms(iodaAlarmsTransformed, iodaAggregatedAttrs);
  return iodaAlarmsAggregated;
}

function filterAndMapASNetworkDelayAlarms(networkDelayAlarms) {
  const networkDelayAlarmsCopied = AggregatedAlarmsUtils.deepCopy(networkDelayAlarms)
  const filteredASNetworkDelayAlarms = networkDelayAlarmsCopied
    .filter(alarm => alarm.startpoint_type === 'AS')
    .map(alarm => ({ ...alarm, asn: alarm.startpoint_name, asn_name: alarm.startpoint_name }));
  return filteredASNetworkDelayAlarms
}

function filterGripAlarms(gripAlarms) {
  const gripAlarmsTransformed = gripAlarms.reduce((acc, curr) => {
    const trustWorthy = curr.summary.tr_worthy;

    if (trustWorthy === true) {
      for (let index = 0; index < curr.summary.victims.length; index++) {
        const victim = curr.summary.victims[index]
        const asnInfo = curr.asinfo ? curr.asinfo[victim] : null
        const asnName = asnInfo && asnInfo.asrank && asnInfo.asrank.asnName ? asnInfo.asrank.asnName.trim() : victim
        const countryIsoCode2 = asnInfo && asnInfo.asrank && asnInfo.asrank.organization && asnInfo.asrank.organization.country
                    && asnInfo.asrank.organization.country.iso ? asnInfo.asrank.organization.country.iso : null
        const eventType = curr.event_type

        let severityValue;
        if (curr.summary.inference_result.inferences[index]) {
          severityValue = curr.summary.inference_result.inferences[index].suspicion_level
        } else {
          severityValue = curr.summary.inference_result.primary_inference.suspicion_level
        }

        const eventLocalDateTime = new Date(curr.last_modified_ts * 1000)
        const eventUTCDateTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(eventLocalDateTime, '00Z')

        let bgpAlertAlarm = {
          asn_name: asnName,
          asn: victim,
          country_iso_code2: countryIsoCode2,
          timebin: eventUTCDateTimeFormatted,
          event_type: eventType,
          severity: severityValue
        };

        acc.push(bgpAlertAlarm);
      }
    }

    return acc;
  }, []);
  return gripAlarmsTransformed;
}

function filterIodaAlarms(iodaAlarms) {
  const iodaAlarmsNonEmpty = iodaAlarms.filter((alarm) => Object.keys(alarm).length)
  const iodaAlarmsTransformed = iodaAlarmsNonEmpty.reduce((acc, curr) => {
    const asnName = extractASNameBetweeParenthese(curr.entity.name, curr.entity)
    const asnNumber = curr.entity.code
    const eventType = curr.datasource.replace('-', '_')
    const iodaSeverityLevel = curr.level
    const eventLocalDateTime = new Date(curr.time * 1000)
    const eventUTCDateTimeFormatted = AggregatedAlarmsUtils.formatUTCTime(eventLocalDateTime, '00Z')

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

function extractASNameBetweeParenthese(asNameWithParenthese) {
  let asNameExtracted = ''
  const regex = /\(([^)]+)\)/;
  const match = asNameWithParenthese.match(regex);
  if (match && match.length > 1) {
    asNameExtracted = match[1];
  }
  return asNameExtracted
}

function addEventType(alarms, eventTypeName) {
  for (const alarm of alarms) {
    alarm.event_type = eventTypeName
  }
}

function transformAlarmsSeverities(alarms, alarmSeverityMapper) {
  for (const alarm of alarms) {
    alarm.severity = alarmSeverityMapper(alarm)
  }
}

function gripSeverityMapper(alarm) {
  const severityValue = alarm.severity
  let severityLabel;
  if (severityValue >= 80 && severityValue <= 100) {
    severityLabel = 'high'
  } else if (severityValue >= 21 && severityValue <= 79) {
    severityLabel = 'medium'
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
    severityLabel = 'medium'
  } else {
    severityLabel = 'low'
  }
  return severityLabel
}

function ihrSeverityMapper(alarm) {
  const severityValue = alarm.deviation
  let severityLabel;
  if (severityValue >= 20 && severityValue <= 30) {
    severityLabel = 'low'
  } else if (severityValue >= 31 && severityValue <= 50) {
    severityLabel = 'medium'
  } else if (severityValue >= 51) {
    severityLabel = 'high'
  } else {
    severityLabel = 'low'
  }
  return severityLabel
}

function transformHegemonyASNameAndCountryIsoCode2(hegemonyAlarms) {
  const hegemonyAlarmsUpdatedWithASNameAndIsoCode2 = AggregatedAlarmsUtils.deepCopy(hegemonyAlarms)
  for (const alarm of hegemonyAlarmsUpdatedWithASNameAndIsoCode2) {
    updateASNameAndCountryIsoCode2(alarm, alarm.originasn_name, alarm.originasn)
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
        ...AggregatedAlarmsUtils.deepCopy(aggregatedAttrs)
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
  const fullOuterJoin = (alarmsInput) => {
    const mergedResult = {};
    for (const asnNumber in alarmsInput) {
      const alarmAggregated = alarmsInput[asnNumber];
      mergedResult[asnNumber] = alarmAggregated;
    }
    return mergedResult
  }

  const updateMergedAlarms = (mergedAlarms, alarmsInput, alarmAggregatedAttrsASNotFound) => {
    for (const asnNumber in alarmsInput) {
      const alarmAggregated = alarmsInput[asnNumber];
      if (mergedAlarms[asnNumber]) {
        Object.assign(mergedAlarms[asnNumber], alarmAggregated);
      } else {
        const alarmAggregatedAttrsASNotFoundCopied = AggregatedAlarmsUtils.deepCopy(alarmAggregatedAttrsASNotFound);
        mergedAlarms[asnNumber] = { ...alarmAggregated, ...alarmAggregatedAttrsASNotFoundCopied }
      }
    }
  }

  let mergedAlarms = {}

  const mergedAlarms1 = fullOuterJoin(alarms1);
  updateMergedAlarms(mergedAlarms, mergedAlarms1, alarmsAggregatedAttrs2);

  const mergedAlarms2 = fullOuterJoin(alarms2);
  updateMergedAlarms(mergedAlarms, mergedAlarms2, alarmsAggregatedAttrs1);
  return mergedAlarms;
}


function transformAlarmsHelper(alarms) {
  const request = () => {
    return new Promise((resolve, reject) => {
      addASNameAndCountryIsoCode2(alarms).then((alarmsWithCountryIsoCodes2) => {
        addCountryIsoCode3AndCountryName(alarmsWithCountryIsoCodes2)
        const alarmsList = convertAlarmsDictToList(alarmsWithCountryIsoCodes2)
        const filteredAlarms = filterAlarmsByCountryIsoCode3(alarmsList)
        normalizeASNames(filteredAlarms)
        resolve(filteredAlarms)
      }).catch(error => {
        reject(error)
      })
    })
  }
  return request()
}

function normalizeASNames(alarms) {
  alarms.forEach((alarm) => {
    const asNameTruncated = AggregatedAlarmsUtils.truncateString(alarm.asn_name, 20);
    alarm.asn_name = `${asNameTruncated} (AS${alarm.asn})`
  })
}
function addASNameAndCountryIsoCode2(alarms) {
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

function addCountryIsoCode3AndCountryName(alarms) {
  for (let asnNumber in alarms) {
    const countryCode2 = alarms[asnNumber].country_iso_code2
    Object.assign(alarms[asnNumber], getCountryIsoCode3AndName(countryCode2))
  }
}

function convertAlarmsDictToList(alarms) {
  for (const asnNumber in alarms) {
    alarms[asnNumber].asn = asnNumber;
  }
  const alarmsArray = Object.values(alarms)
  return alarmsArray
}

function filterAlarmsByCountryIsoCode3(alarmsList) {
  return Object.values(alarmsList).filter(alarm => alarm.country_iso_code3)
}

function getASNamesAndIsoCodes(alarms, asnNumbers) {
  return new Promise((resolve, reject) => {
    const asnNumbersCommaSeparated = asnNumbers.join(',');
    getASNameAndCountryIsoCode2Proxy(asnNumbersCommaSeparated)
      .then(asnNamesAndIsoCodes2 => {
        for (const asnNameAndIsoCode2 of asnNamesAndIsoCodes2) {
          const { asn_number: asNumber, asn_name: asName, country_iso_code2: countryIsoCode2 } = asnNameAndIsoCode2;
          alarms[asNumber].country_iso_code2 = countryIsoCode2;
          alarms[asNumber].asn_name = asName
        }
        return resolve(alarms);
      })
      .catch(error => {
        console.error('Error retrieving ASN name and country ISO code:', error);
        return reject(error);
      });
  });
}

function getASNameAndCountryIsoCode2Proxy(asnNumbersCommaSeperated, maxRetries = 5, delay = 500) {
  let retries = 0;

  const request = () => {
    return new Promise((resolve, reject) => {
      getASNameAndCountryIsoCode2(asnNumbersCommaSeperated)
        .then(asnNamesAndIsoCodes2 => resolve(asnNamesAndIsoCodes2))
        .catch(error => {
          console.error(error)
          if (retries < maxRetries) {
            retryRequest(asnNumbersCommaSeperated, resolve, reject)
          } else {
            console.error(`Maximum retries reached for ASN ${asnNumbersCommaSeperated}`)
            reject(error);
          }
        });
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
      NetworkIhr.getNetworkInfo(asnNumbersCommaSeperated).then((networks) => {
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

function updateASNameAndCountryIsoCode2(alarm, asName, asNumber) {
  alarm.country_iso_code2 = normalizeCountryIsoCode2(asName);
  alarm.asn_name = normalizeASName(asName);
  alarm.asn = asNumber
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

export function filterAlarmsByTime(alarms, startDateTime, endDateTime, aggregatedAttrsZipped) {
  if (!aggregatedAttrsZipped.length) {
    return alarms
  }
  const filteredAlarms = alarms.map((alarm) => {
    const filteredAlarm = filterAlarmByTime(alarm, startDateTime, endDateTime, aggregatedAttrsZipped);
    return filteredAlarm;
  }).filter((alarm) => alarm !== null);
  return filteredAlarms;
}

function filterAlarmByTime(alarm, startDateTime, endDateTime, aggregatedAttrsZipped) {
  const isAlarmInTimebinRangeResult = isAlarmInTimebinRange(alarm, startDateTime, endDateTime, aggregatedAttrsZipped);

  if (isAlarmInTimebinRangeResult === null) {
    return null;
  }

  const filteredAlarm = { ...alarm };
  for (const [alarmCountType, alarmTimebinType, alarmSeverityType] of aggregatedAttrsZipped) {
    filteredAlarm[alarmTimebinType] = isAlarmInTimebinRangeResult[alarmTimebinType];
    filteredAlarm[alarmSeverityType] = isAlarmInTimebinRangeResult[alarmSeverityType]
    filteredAlarm[alarmCountType] = Array(filteredAlarm[alarmTimebinType].length).fill(1);
  }

  return filteredAlarm;
}

function isAlarmInTimebinRange(alarm, startDateTime, endDateTime, aggregatedAttrsZipped) {
  let areAllTimebinTypesEmpty = true;

  const filteredAlarm = {};
  for (const [alarmCountType, alarmTimebinType, alarmSeverityType] of aggregatedAttrsZipped) {
    filteredAlarm[alarmTimebinType] = []
    filteredAlarm[alarmSeverityType] = []
    for (let i = 0; i < alarm[alarmTimebinType].length; i++) {
      const timebinStartDateTimeComp = AggregatedAlarmsUtils.compareUtcStrings(alarm[alarmTimebinType][i], startDateTime);
      const timebinEndDateTimeComp = AggregatedAlarmsUtils.compareUtcStrings(alarm[alarmTimebinType][i], endDateTime);
      if (timebinStartDateTimeComp >= 0 && timebinEndDateTimeComp <= 0) {
        filteredAlarm[alarmTimebinType].push(alarm[alarmTimebinType][i])
        filteredAlarm[alarmSeverityType].push(alarm[alarmSeverityType][i])
      }
    }
    areAllTimebinTypesEmpty = areAllTimebinTypesEmpty && filteredAlarm[alarmTimebinType].length === 0;
  }

  if (areAllTimebinTypesEmpty) {
    return null
  } else {
    return filteredAlarm
  }
}

export function filterAlarmsBySeverity(alarms, severitiesSelected, aggregatedAttrsZipped) {
  if (!severitiesSelected.length || !aggregatedAttrsZipped.length) {
    return alarms
  }

  const filteredAlarms = alarms.map((alarm) => {
    const filteredAlarm = filterAlarmBySeverity(alarm, severitiesSelected, aggregatedAttrsZipped);
    return filteredAlarm
  }).filter((alarm) => alarm !== null)
  return filteredAlarms
}

function filterAlarmBySeverity(alarm, severitiesSelected, aggregatedAttrsZipped) {
  const isAlarmInSeveritiesRangeResult = isAlarmInSeveritiesRange(alarm, severitiesSelected, aggregatedAttrsZipped);

  if (isAlarmInSeveritiesRangeResult === null) {
    return null;
  }

  const filteredAlarm = { ...alarm };
  for (const [alarmCountType, alarmTimebinType, alarmSeverityType] of aggregatedAttrsZipped) {
    filteredAlarm[alarmSeverityType] = isAlarmInSeveritiesRangeResult[alarmSeverityType]
    filteredAlarm[alarmTimebinType] = isAlarmInSeveritiesRangeResult[alarmTimebinType]
    filteredAlarm[alarmCountType] = Array(filteredAlarm[alarmSeverityType].length).fill(1);
  }

  return filteredAlarm;
}

function isAlarmInSeveritiesRange(alarm, severitiesSelected, aggregatedAttrsZipped) {
  let areAllSeveritiesEmpty = true;

  const filteredAlarm = {};
  for (const [alarmCountType, alarmTimebinType, alarmSeverityType] of aggregatedAttrsZipped) {
    filteredAlarm[alarmTimebinType] = []
    filteredAlarm[alarmSeverityType] = []
    for (let i = 0; i < alarm[alarmSeverityType].length; i++) {
      if (severitiesSelected.includes(alarm[alarmSeverityType][i])) {
        filteredAlarm[alarmSeverityType].push(alarm[alarmSeverityType][i])
        filteredAlarm[alarmTimebinType].push(alarm[alarmTimebinType][i])
      }
    }
    areAllSeveritiesEmpty = areAllSeveritiesEmpty && filteredAlarm[alarmSeverityType].length === 0
  }

  if (areAllSeveritiesEmpty) {
    return null
  } else {
    return filteredAlarm
  }
}
