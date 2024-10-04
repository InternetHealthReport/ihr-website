import * as GripApiPlugin from '../GripApi'
import * as IodaApiPlugin from '../IodaApi'
import * as AsNamesPlugin from '../AsNames'
import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'
import { getCountryISOCode3, getCountryName } from '../countryName'

const dataSourcesTransformers = {
  ihr: {
    transformFunc: transformIHRAlarms
  },
  grip: {
    transformFunc: transformGripAlarms
  },
  ioda: {
    transformFunc: transformIodaAlarms
  }
}

let asNamesCountryMappingsResult = {}

export function etl(
  dataSourcesSelected,
  dataSources,
  alarmTypesSelected,
  groupByKeys,
  ihrAlarms,
  externalAlarms,
  iodaIPAddressFamilies,
  startUnixTime,
  endUnixTime
) {
  dataSourcesTransformers.ioda.ipAddressFamilies = iodaIPAddressFamilies
  return new Promise((resolve, reject) => {
    extractAlarms(
      dataSourcesSelected,
      alarmTypesSelected,
      ihrAlarms,
      externalAlarms,
      startUnixTime,
      endUnixTime
    )
      .then((extractedAlarms) =>
        transformAlarms(
          extractedAlarms,
          dataSourcesSelected,
          dataSources,
          alarmTypesSelected,
          groupByKeys
        )
      )
      .then((alarms) => resolve(alarms))
      .catch((error) => reject(error))
  })
}

function extractAlarms(
  dataSourcesSelected,
  alarmTypesSelected,
  ihrAlarms,
  externalAlarms,
  startUnixTime,
  endUnixTime
) {
  const request = () => {
    return new Promise((resolve, _) => {
      let extractedAlarms = { ihr: ihrAlarms }

      let gripAlarmsPromise =
        dataSourcesSelected.grip && !externalAlarms.grip
          ? GripApiPlugin.getGripAlarms(
              new Date(startUnixTime * 1000),
              new Date(endUnixTime * 1000)
            )
          : Promise.resolve([])
      let iodaAlarmsPromise =
        dataSourcesSelected.ioda && !externalAlarms.ioda
          ? IodaApiPlugin.getIodaAlarms(
              new Date(startUnixTime * 1000),
              new Date(endUnixTime * 1000)
            )
          : Promise.resolve([])

      Promise.all([gripAlarmsPromise, iodaAlarmsPromise]).then(([gripAlarms, iodaAlarms]) => {
        if (dataSourcesSelected.grip) {
          externalAlarms.grip = externalAlarms.grip ? externalAlarms.grip : gripAlarms
          extractedAlarms.grip = externalAlarms.grip
        }
        if (dataSourcesSelected.ioda) {
          externalAlarms.ioda = externalAlarms.ioda ? externalAlarms.ioda : iodaAlarms
          extractedAlarms.ioda = externalAlarms.ioda
        }
        resolve(extractedAlarms)
      })
    })
  }

  return request()
}

function transformAlarms(
  alarms,
  dataSourcesSelected,
  dataSources,
  alarmTypesSelected,
  groupByKeys
) {
  const request = () => {
    return new Promise((resolve, reject) => {
      const transformedAlarms = dynamicAlarmsTransformation(
        alarms,
        dataSourcesSelected,
        dataSources,
        alarmTypesSelected,
        groupByKeys
      )
      addASNameAndCountryInfo(transformedAlarms)
        .then((alarmsWithASNamesAndCountryInfo) => {
          const alarmsList = Object.values(alarmsWithASNamesAndCountryInfo)
          const alarmsWithCountries = Object.values(alarmsList).filter(
            (alarm) => alarm.asn_country_iso_code3
          )
          alarmsWithCountries.forEach((alarm) => {
            alarm.asn_name_truncated = truncateASName(String(alarm.asn_name), alarm.asn)
          })
          resolve(alarmsWithCountries)
        })
        .catch((error) => reject(error))
    })
  }
  return request()
}

function dynamicAlarmsTransformation(
  alarms,
  dataSourcesSelected,
  dataSources,
  alarmTypesSelected,
  groupByKeys
) {
  let alarmsTransformed = {}
  for (const dataSource in dataSourcesSelected) {
    const isDataSourceSelected = dataSourcesSelected[dataSource]
    if (isDataSourceSelected) {
      const { transformFunc, ipAddressFamilies } = dataSourcesTransformers[dataSource]
      const dataSourceAlarmsTransformed = transformFunc(
        alarms[dataSource],
        dataSources[dataSource].alarm_types,
        alarmTypesSelected,
        groupByKeys,
        ipAddressFamilies
      )
      const dataSourceColumns = AggregatedAlarmsUtils.normalizeColumns(
        AggregatedAlarmsUtils.filterDictByPrefixes(
          Object.values(dataSourceAlarmsTransformed)[0],
          Object.keys(dataSources[dataSource].alarm_types)
        )
      )
      const alarmsTransformedColumns = AggregatedAlarmsUtils.normalizeColumns(
        AggregatedAlarmsUtils.filterDictByPrefixes(
          Object.values(alarmsTransformed)[0],
          Object.keys(dataSources).flatMap((dataSource) =>
            Object.keys(dataSources[dataSource].alarm_types)
          )
        )
      )
      alarmsTransformed = fullOuterJoinAlarms(
        alarmsTransformed,
        dataSourceAlarmsTransformed,
        alarmsTransformedColumns,
        dataSourceColumns
      )
    }
  }
  return alarmsTransformed
}

function transformIHRAlarms(ihrAlarms, ihrDataSource, alarmTypesSelected, groupByKeys) {
  const hegemonyAlarms = ihrAlarms.filter((alarm) => alarm.event_type === 'hegemony')
  const networkDelayAlarms = ihrAlarms.filter((alarm) => alarm.event_type === 'network_delay')
  const networkDisconnectionAlarms = ihrAlarms.filter(
    (alarm) => alarm.event_type === 'network_disconnection'
  )
  const ihrColumnsJoined = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(ihrDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? ihrDataSource[alarmType].columns : {}
    )
  )
  const ihrGroupByKeys = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(ihrDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? { [alarmType]: groupByKeys[alarmType] } : {}
    )
  )
  const hegemonyAlarmsTransformed = alarmTypesSelected.hegemony
    ? transformHegemonyAlarms(hegemonyAlarms, ihrDataSource.hegemony.columns)
    : []
  const networkDelayAlarmsTransformed = alarmTypesSelected.network_delay
    ? transformNetworkDelayAlarms(networkDelayAlarms, ihrDataSource.network_delay.columns)
    : []
  const networkDisconnectionAlarmsTransformed = alarmTypesSelected.network_disconnection
    ? transformNetworkDisconnectionAlarms(
        networkDisconnectionAlarms,
        ihrDataSource.network_disconnection.columns
      )
    : []
  const ihrAlarmsJoined = [
    ...hegemonyAlarmsTransformed,
    ...networkDelayAlarmsTransformed,
    ...networkDisconnectionAlarmsTransformed
  ]
  const ihrAlarmsAggregated = aggregateAlarms(ihrAlarmsJoined, ihrColumnsJoined, ihrGroupByKeys)
  return ihrAlarmsAggregated
}

function transformGripAlarms(gripAlarms, gripDataSource, alarmTypesSelected, groupByKeys) {
  const gripColumnsJoined = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(gripDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? gripDataSource[alarmType].columns : {}
    )
  )
  const gripGroupByKeys = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(gripDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? { [alarmType]: groupByKeys[alarmType] } : {}
    )
  )
  const gripAlarmsTransformed = []
  for (const alarm of gripAlarms) {
    const gripAlarmsTransformedList = transformGripAlarmsHelper(
      alarm,
      gripDataSource,
      alarmTypesSelected
    )
    if (gripAlarmsTransformedList) {
      gripAlarmsTransformed.push(...gripAlarmsTransformedList)
    }
  }
  const gripAlarmsAggregated = aggregateAlarms(
    gripAlarmsTransformed,
    gripColumnsJoined,
    gripGroupByKeys
  )
  return gripAlarmsAggregated
}

function transformIodaAlarms(
  iodaAlarms,
  iodaDataSource,
  alarmTypesSelected,
  groupByKeys,
  iodaIPAddressFamilies
) {
  const iodaColumnsJoined = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(iodaDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? iodaDataSource[alarmType].columns : {}
    )
  )
  const iodaGroupByKeys = AggregatedAlarmsUtils.flattenDictionary(
    Object.keys(iodaDataSource).map((alarmType) =>
      alarmTypesSelected[alarmType] ? { [alarmType]: groupByKeys[alarmType] } : {}
    )
  )
  const iodaAlarmsNonEmpty = iodaAlarms.filter(
    (alarm) => !AggregatedAlarmsUtils.isDictEmpty(alarm) && alarm.entity.type == 'asn'
  )
  const iodaAlarmsTransformed = []
  for (const alarm of iodaAlarmsNonEmpty) {
    const iodaAlarmTransformed = transformIodaAlarm(
      alarm,
      iodaDataSource,
      alarmTypesSelected,
      iodaIPAddressFamilies
    )
    if (iodaAlarmTransformed) {
      iodaAlarmsTransformed.push(iodaAlarmTransformed)
    }
  }
  const iodaAlarmsAggregated = aggregateAlarms(
    iodaAlarmsTransformed,
    iodaColumnsJoined,
    iodaGroupByKeys
  )
  return iodaAlarmsAggregated
}

function transformHegemonyAlarms(hegemonyAlarms, hegemonyColumns) {
  const hegemonyAlarmsTransformed = []

  const hegemonyAlarmsValid = hegemonyAlarms.filter(
    (alarm) => alarm.originasn != '0' && alarm.asn != '0'
  )
  for (const alarm of hegemonyAlarmsValid) {
    const hegemonyAlarmTransformed = transformHegemonyAlarm(alarm, hegemonyColumns)
    hegemonyAlarmsTransformed.push(hegemonyAlarmTransformed)
  }

  return hegemonyAlarmsTransformed
}

function transformHegemonyAlarm(alarm, hegemonyColumns) {
  const eventType = 'hegemony'
  const alarmEntryTransformed = { event_type: eventType }
  const hegemonyAlarm = {
    severity: ihrSeverityMapper(alarm.deviation),
    deviation: alarm.deviation,
    timebin: Date.parse(alarm.timebin) / 1000,
    origin_asn: alarm.originasn,
    origin_asn_af: alarm.af,
    asn: alarm.asn,
    asn_af: alarm.af,
    count: 1
  }
  postAlarmTransformerHelper(hegemonyColumns, eventType, hegemonyAlarm, alarmEntryTransformed)
  return alarmEntryTransformed
}

function transformNetworkDelayAlarms(networkDelayAlarms, networkDelayColumns) {
  const networkDelayAlarmsTransformed = []

  const netDelayAlarmsValid = networkDelayAlarms.filter(
    (alarm) =>
      alarm.startpoint_type === 'AS' &&
      alarm.endpoint_type === 'AS' &&
      alarm.startpoint_name != '0' &&
      alarm.endpoint_name != '0'
  )
  for (const alarm of netDelayAlarmsValid) {
    const networkDelayAlarmTransformed = transformNetworkDelayAlarm(alarm, networkDelayColumns)
    networkDelayAlarmsTransformed.push(networkDelayAlarmTransformed)
  }
  return networkDelayAlarmsTransformed
}

function transformNetworkDelayAlarm(alarm, networkDelayColumns) {
  const eventType = 'network_delay'
  const alarmEntryTransformed = { event_type: eventType }
  const networkDelayAlarm = {
    severity: ihrSeverityMapper(alarm.deviation),
    deviation: alarm.deviation,
    timebin: Date.parse(alarm.timebin) / 1000,
    startpoint: alarm.startpoint_name,
    startpoint_name: alarm.startpoint_name,
    startpoint_type: alarm.startpoint_type,
    startpoint_af: alarm.startpoint_af,
    endpoint: alarm.endpoint_name,
    endpoint_name: alarm.endpoint_name,
    endpoint_type: alarm.endpoint_type,
    endpoint_af: alarm.endpoint_af,
    count: 1
  }
  postAlarmTransformerHelper(
    networkDelayColumns,
    eventType,
    networkDelayAlarm,
    alarmEntryTransformed
  )
  return alarmEntryTransformed
}

function transformNetworkDisconnectionAlarms(
  networkDisconnectionAlarms,
  networkDisconnectionColumns
) {
  const networkDisconnectionAlarmsTransformed = []

  const networkDisconnectionAlarmsValid = networkDisconnectionAlarms.filter(
    (alarm) => alarm.streamtype == 'asn'
  )

  for (const alarm of networkDisconnectionAlarmsValid) {
    const networkDisconnectionAlarmTransformed = transformNetworkDisconnectionAlarm(
      alarm,
      networkDisconnectionColumns
    )
    networkDisconnectionAlarmsTransformed.push(networkDisconnectionAlarmTransformed)
  }
  return networkDisconnectionAlarmsTransformed
}

function transformNetworkDisconnectionAlarm(alarm, networkDisconnectionColumns) {
  const eventType = 'network_disconnection'
  const alarmEntryTransformed = { event_type: eventType }
  const probePrefixes = alarm.discoprobes
    .flatMap((probe) => [probe.prefixv4, probe.prefixv6])
    .flatMap((prefix) => prefix)
    .filter((prefix) => prefix)
  const ipAddressFamilies = probePrefixes
    .map((prefix) => AggregatedAlarmsUtils.getIPAddressFamily(prefix))
    .join(', ')
  const networkDisconnectionAlarm = {
    start_timebin: Date.parse(alarm.starttime) / 1000,
    end_timebin: Date.parse(alarm.endtime) / 1000,
    timebin: Date.parse(alarm.starttime) / 1000,
    severity: ihrSeverityMapper(alarm.avglevel),
    stream_prob_id: alarm.discoprobes.map((discoprob) => discoprob.probe_id).join(', '),
    deviation: alarm.avglevel,
    stream_type: alarm.streamtype,
    stream: alarm.streamname,
    stream_total_probes: alarm.totalprobes,
    stream_id: alarm.id,
    stream_af: ipAddressFamilies,
    stream_disconnected_prefix: probePrefixes.join(', '),
    count: 1
  }
  networkDisconnectionAlarm.duration =
    networkDisconnectionAlarm.start_timebin !== networkDisconnectionAlarm.end_timebin
      ? AggregatedAlarmsUtils.roundToDecimalPlaces(
          (networkDisconnectionAlarm.end_timebin - networkDisconnectionAlarm.start_timebin) / 60,
          2
        )
      : null
  postAlarmTransformerHelper(
    networkDisconnectionColumns,
    eventType,
    networkDisconnectionAlarm,
    alarmEntryTransformed
  )
  return alarmEntryTransformed
}

function transformGripAlarmsHelper(alarm, gripDataSource, alarmTypesSelected) {
  const eventType = alarm.event_type
  if (!gripDataSource[eventType]) {
    console.warn(`🚨 Hey there! It looks like we've come across a new grip alarm type called ${eventType}.
    We haven't seen this one before! 😱 Please help us out by reporting it to us.
    Your input is invaluable in making our system even better! 🙌`)
    return null
  }

  if (!alarmTypesSelected[eventType]) return null

  const alarmsTransformed = []

  const isAlarmTrustworthy = alarm.summary.tr_worthy

  if (isAlarmTrustworthy) {
    const asnAttackers = alarm.summary.attackers
    for (let index = 0; index < asnAttackers.length; index++) {
      const asnAttacker = asnAttackers[index]
      const asnVictims = alarm.summary.victims
      for (let victimIndex = 0; victimIndex < asnVictims.length; victimIndex++) {
        const alarmEntryTransformed = { event_type: eventType }
        const asnVictim = asnVictims[victimIndex]
        const suspicion_level = alarm.summary.inference_result.primary_inference.suspicion_level
        const trustworthy_tags = alarm.tr_metrics.tr_worthy_tags.flatMap((tag) => tag).join(', ')
        const ipAddressFamilies = alarm.summary.prefixes
          .map((prefix) => AggregatedAlarmsUtils.getIPAddressFamily(prefix))
          .filter((af) => af)
          .join(', ')
        const gripAlarm = {
          asn_attacker: asnAttacker,
          asn_attacker_af: ipAddressFamilies,
          asn_attacker_newcomer: alarm.summary.newcomers.includes(asnAttacker),
          asn_attacker_attacking_prefix: alarm.summary.prefixes.join(', '),
          asn_attacker_trustworthy: isAlarmTrustworthy,
          asn_attacker_trustworthy_tag: trustworthy_tags,
          asn_victim: asnVictim,
          asn_victim_af: ipAddressFamilies,
          asn_victim_newcomer: alarm.summary.newcomers.includes(asnVictim),
          asn_victim_trustworthy: isAlarmTrustworthy,
          asn_victim_trustworthy_tag: trustworthy_tags,
          timebin: alarm.last_modified_ts,
          deviation: suspicion_level,
          severity: gripSeverityMapper(suspicion_level),
          duration: alarm.duration
            ? AggregatedAlarmsUtils.roundToDecimalPlaces(alarm.duration / 60, 2)
            : null,
          count: 1
        }

        const gripAlarmTypeColumns = gripDataSource[eventType].columns
        postAlarmTransformerHelper(
          gripAlarmTypeColumns,
          eventType,
          gripAlarm,
          alarmEntryTransformed
        )
        alarmsTransformed.push(alarmEntryTransformed)
      }
    }
    return alarmsTransformed
  }
  return null
}

function transformIodaAlarm(alarm, iodaDataSource, alarmTypesSelected, iodaIPAddressFamilies) {
  const eventType = alarm.datasource.replace('-', '_')
  if (!iodaDataSource[eventType]) {
    console.warn(`🚨 Hey there! It looks like we've come across a new ioda alarm type called ${alarm.datasource}.
    We haven't seen this one before! 😱 Please help us out by reporting it to us.
    Your input is invaluable in making our system even better! 🙌`)
    return null
  }

  if (!alarmTypesSelected[eventType]) return null

  const alarmEntryTransformed = { event_type: eventType }
  const alarmTypeIPAddrssFamilies = iodaIPAddressFamilies[eventType].filter((af) => af).join(', ')
  const iodaAlarm = {
    count: 1,
    event_type: eventType,
    entity_alarm_type: alarm.datasource,
    entity: alarm.entity.code,
    entity_type: alarm.entity.type,
    entity_ip_count: alarm.entity.attrs.ip_count,
    entity_af: alarmTypeIPAddrssFamilies,
    timebin: alarm.time,
    condition: alarm.condition,
    value: alarm.value,
    historical_value: alarm.historyValue,
    severity: iodaSeverityMapper(alarm.level)
  }
  const iodaAlarmTypeColumns = iodaDataSource[eventType].columns
  postAlarmTransformerHelper(iodaAlarmTypeColumns, eventType, iodaAlarm, alarmEntryTransformed)
  return alarmEntryTransformed
}

function postAlarmTransformerHelper(columns, eventType, alarm, alarmEntryTransformed) {
  for (const column in columns) {
    const originalColumn = column.split(`${eventType}_`)[1]
    const alarmColumnValue = alarm[originalColumn]
    if (alarmColumnValue !== undefined && alarmColumnValue !== null) {
      alarmEntryTransformed[column] =
        alarmColumnValue !== '' && !isNaN(alarmColumnValue) && typeof alarmColumnValue != 'boolean'
          ? Number(alarmColumnValue)
          : alarmColumnValue
    } else {
      alarmEntryTransformed[column] = null
    }
  }
}

function gripSeverityMapper(suspicionLevel) {
  const suspicionLevelVal = AggregatedAlarmsUtils.roundToDecimalPlaces(suspicionLevel, 0)
  let severityLabel
  if (suspicionLevelVal >= 80 && suspicionLevelVal <= 100) {
    severityLabel = 'high'
  } else if (suspicionLevelVal >= 21 && suspicionLevelVal <= 79) {
    severityLabel = 'medium'
  } else if (suspicionLevelVal >= 0 && suspicionLevelVal <= 20) {
    severityLabel = 'low'
  }

  return severityLabel
}

function iodaSeverityMapper(severity) {
  let severityLabel
  if (severity === 'critical') {
    severityLabel = 'high'
  } else if (severity === 'normal') {
    severityLabel = 'medium'
  } else {
    severityLabel = 'low'
  }
  return severityLabel
}

function ihrSeverityMapper(deviation) {
  const deviationVal = AggregatedAlarmsUtils.roundToDecimalPlaces(deviation, 0)
  let severityLabel
  if ((deviationVal >= 0 && deviationVal <= 30) || (deviationVal <= 0 && deviationVal >= -30)) {
    severityLabel = 'low'
  } else if (
    (deviationVal >= 31 && deviationVal <= 50) ||
    (deviationVal <= -31 && deviationVal >= -50)
  ) {
    severityLabel = 'medium'
  } else if (deviationVal >= 51 || deviationVal <= -51) {
    severityLabel = 'high'
  }
  return severityLabel
}

export function aggregateAlarms(alarms, columns, keys) {
  const aggregatedAlarms = alarms.reduce((acc, curr) => {
    const eventType = curr.event_type
    const key = `${eventType}_${keys[eventType]}`
    const keyValue = Number(curr[key])
    let {
      [key]: asn,
      [`${key}_name`]: asn_name,
      [`${key}_country`]: asn_country,
      [`${key}_country_iso_code2`]: asn_country_iso_code2,
      [`${key}_country_iso_code3`]: asn_country_iso_code3
    } = curr
    asn = Number(asn)
    if (!acc[keyValue]) {
      acc[keyValue] = {
        asn,
        asn_name,
        asn_country,
        asn_country_iso_code2,
        asn_country_iso_code3,
        ...AggregatedAlarmsUtils.deepCopy(columns)
      }
      for (const [alarmType, key] of Object.entries(keys)) {
        acc[keyValue][`${alarmType}_key`] = key
      }
    }

    for (const column in columns) {
      if (column.startsWith(eventType) && curr[column] !== undefined) {
        acc[keyValue][column].push(curr[column])
      }
    }

    return acc
  }, {})

  return aggregatedAlarms
}

function fullOuterJoinAlarms(alarms1, alarms2, columns1, columns2) {
  const fullOuterJoin = (alarmsInput) => {
    const mergedResult = {}
    for (const asnNumber in alarmsInput) {
      const alarmAggregated = alarmsInput[asnNumber]
      mergedResult[asnNumber] = alarmAggregated
    }
    return mergedResult
  }

  const updateMergedAlarms = (mergedAlarms, alarmsInput, columns2) => {
    for (const asnNumber in alarmsInput) {
      const alarmAggregated = alarmsInput[asnNumber]
      if (mergedAlarms[asnNumber]) {
        Object.assign(mergedAlarms[asnNumber], alarmAggregated)
      } else {
        const columns2Copied = AggregatedAlarmsUtils.deepCopy(columns2)
        mergedAlarms[asnNumber] = { ...alarmAggregated, ...columns2Copied }
      }
    }
  }

  let mergedAlarms = {}

  const mergedAlarms1 = fullOuterJoin(alarms1)
  updateMergedAlarms(mergedAlarms, mergedAlarms1, columns2)

  const mergedAlarms2 = fullOuterJoin(alarms2)
  updateMergedAlarms(mergedAlarms, mergedAlarms2, columns1)
  return mergedAlarms
}

export function truncateASName(asn_name, asn, asNameTruncateLength = 10) {
  const asNameTruncated =
    AggregatedAlarmsUtils.truncateString(asn_name, asNameTruncateLength) + ` (AS${asn})`
  return asNameTruncated
}

function addASNameAndCountryInfo(alarms) {
  const request = () =>
    new Promise((resolve, reject) => {
      if (!AggregatedAlarmsUtils.isDictEmpty(asNamesCountryMappingsResult)) {
        addASNameAndCountryInfoHelper(alarms, asNamesCountryMappingsResult)
        resolve(alarms)
      } else {
        AsNamesPlugin.getASNamesCountryMappings()
          .then((asNamesCountryMappings) => {
            asNamesCountryMappingsResult = asNamesCountryMappings
            addASNameAndCountryInfoHelper(alarms, asNamesCountryMappings)
            return resolve(alarms)
          })
          .catch((error) => reject(error))
      }
    })
  return request()
}

function addASNameAndCountryInfoHelper(alarms, asNamesCountryMappings) {
  for (const asn in alarms) {
    const alarm = alarms[asn]
    for (const key in alarm) {
      if (key.endsWith('_name')) {
        const asnKey = key.split('_name')[0]
        const asn_name_key = `${asnKey}_name`
        const asn_country_key = `${asnKey}_country`
        const asn_country_iso_code2_key = `${asnKey}_country_iso_code2`
        const asn_country_iso_code3_key = `${asnKey}_country_iso_code3`
        const asns = alarm[asnKey]
        if (Array.isArray(asns)) {
          for (let i = 0; i < asns.length; i++) {
            const asn = asns[i]
            if (asNamesCountryMappings[asn]) {
              const { country_iso_code2, asn_name } = asNamesCountryMappings[asn]
              const { country_iso_code3, country } = getCountryIsoCode3AndName(country_iso_code2)
              alarm[asn_name_key][i] = asn_name
              alarm[asn_country_key][i] = country
              alarm[asn_country_iso_code2_key][i] = country_iso_code2
              alarm[asn_country_iso_code3_key][i] = country_iso_code3
            } else {
              console.warn(`Hey there! It seems like the Autonomous System Number (ASN) ${asn} is not in our asn country mapping file yet.
              🌍 You can help us by adding it and contributing to our data quality!
              💪 Thank you for making our system even better! 🙏`)
            }
          }
        } else {
          if (asNamesCountryMappings[asns]) {
            const { country_iso_code2, asn_name } = asNamesCountryMappings[asns]
            const { country_iso_code3, country } = getCountryIsoCode3AndName(country_iso_code2)
            alarm[asn_name_key] = asn_name
            alarm[asn_country_key] = country
            alarm[asn_country_iso_code2_key] = country_iso_code2
            alarm[asn_country_iso_code3_key] = country_iso_code3
          }
        }
      }
    }
  }
}
function getCountryIsoCode3AndName(countryIsoCode2) {
  const country_iso_code3 = getCountryISOCode3(countryIsoCode2)
  const country = getCountryName(countryIsoCode2)
  return { country_iso_code3, country }
}

export function filterAlarmsByTime(alarms, startUnixTime, endUnixTime, aggregatedAttrsZipped) {
  if (!alarms.length || !aggregatedAttrsZipped.length) {
    return []
  }
  const filteredAlarms = alarms
    .map((alarm) => {
      const filteredAlarm = filterAlarmByTime(
        alarm,
        startUnixTime,
        endUnixTime,
        aggregatedAttrsZipped
      )
      return filteredAlarm
    })
    .filter((alarm) => alarm !== null)
  return filteredAlarms
}

function filterAlarmByTime(alarm, startUnixTime, endUnixTime, aggregatedAttrsZipped) {
  let areAllTimebinTypesEmpty = true
  const filteredAlarm = {}
  for (const [_, alarmTimebinType, __, [___, ____]] of aggregatedAttrsZipped) {
    if (!alarm[alarmTimebinType]) continue
    const timeInRangeIndices = []
    const alarmType = alarmTimebinType.split('_timebin')[0]
    for (let i = 0; i < alarm[alarmTimebinType].length; i++) {
      if (
        alarm[alarmTimebinType][i] >= startUnixTime &&
        alarm[alarmTimebinType][i] <= endUnixTime
      ) {
        initFilteredAlarm(filteredAlarm, alarm, alarmType, i)
        timeInRangeIndices.push(i)
      }
    }
    areAllTimebinTypesEmpty = areAllTimebinTypesEmpty && timeInRangeIndices.length === 0
  }
  if (areAllTimebinTypesEmpty) {
    return null
  } else {
    return filteredAlarm
  }
}

export function filterAlarmsBySeverity(alarms, severitiesSelected, aggregatedAttrsZipped) {
  if (!alarms.length || !severitiesSelected.length || !aggregatedAttrsZipped.length) {
    return []
  }
  const filteredAlarms = alarms
    .map((alarm) => {
      const filteredAlarm = filterAlarmBySeverity(alarm, severitiesSelected, aggregatedAttrsZipped)
      return filteredAlarm
    })
    .filter((alarm) => alarm !== null)
  return filteredAlarms
}

function filterAlarmBySeverity(alarm, severitiesSelected, aggregatedAttrsZipped) {
  let areAllSeveritiesEmpty = true
  const filteredAlarm = {}
  for (const [_, __, alarmSeverityType, [___, ____]] of aggregatedAttrsZipped) {
    if (!alarm[alarmSeverityType]) continue
    const severityInRangeIndices = []
    const alarmType = alarmSeverityType.split('_severity')[0]
    for (let i = 0; i < alarm[alarmSeverityType].length; i++) {
      if (severitiesSelected.includes(alarm[alarmSeverityType][i])) {
        initFilteredAlarm(filteredAlarm, alarm, alarmType, i)
        severityInRangeIndices.push(i)
      }
    }
    areAllSeveritiesEmpty = areAllSeveritiesEmpty && severityInRangeIndices.length === 0
  }
  if (areAllSeveritiesEmpty) {
    return null
  } else {
    return filteredAlarm
  }
}

export function filterAlarmsByIpAddressFamily(
  alarms,
  ipAddressFamiliesSelected,
  aggregatedAttrsZipped
) {
  if (!alarms.length || !ipAddressFamiliesSelected.length || !aggregatedAttrsZipped.length) {
    return []
  }
  const ipAddressFamiliesString = ipAddressFamiliesSelected.map((af) => String(af))
  const filteredAlarms = alarms
    .map((alarm) => {
      const filteredAlarm = filterAlarmByIpAddressFamily(
        alarm,
        ipAddressFamiliesString,
        aggregatedAttrsZipped
      )
      return filteredAlarm
    })
    .filter((alarm) => alarm !== null)
  return filteredAlarms
}

function filterAlarmByIpAddressFamily(alarm, ipAddressFamiliesSelected, aggregatedAttrsZipped) {
  let areAllIpAddressFamiliesEmpty = true
  const filteredAlarm = {}
  for (const [
    alarmCountType,
    __,
    ___,
    [alarmIpAddressFamily1, alarmIpAddressFamily2]
  ] of aggregatedAttrsZipped) {
    if (!alarm[alarmIpAddressFamily1]) continue
    const ipAddressFamilyInRangeIndices = []
    const alarmType = alarmCountType.split('_count')[0]
    for (let i = 0; i < alarm[alarmIpAddressFamily1].length; i++) {
      const isSelectedIpAddressFamiliesInRange = alarmIpAddressFamily2
        ? ipAddressFamiliesSelected.some(
            (af) =>
              String(alarm[alarmIpAddressFamily1][i]).includes(af) &&
              String(alarm[alarmIpAddressFamily2][i]).includes(af)
          )
        : ipAddressFamiliesSelected.some((af) =>
            String(alarm[alarmIpAddressFamily1][i]).includes(af)
          )
      if (isSelectedIpAddressFamiliesInRange) {
        initFilteredAlarm(filteredAlarm, alarm, alarmType, i)
        ipAddressFamilyInRangeIndices.push(i)
      }
    }
    areAllIpAddressFamiliesEmpty =
      areAllIpAddressFamiliesEmpty && ipAddressFamilyInRangeIndices.length === 0
  }
  if (areAllIpAddressFamiliesEmpty) {
    return null
  } else {
    return filteredAlarm
  }
}

function initFilteredAlarm(filteredAlarm, alarm, alarmType, index) {
  for (const key in alarm) {
    if (!key.startsWith('asn') && !key.startsWith(alarmType)) continue
    if (Array.isArray(alarm[key])) {
      !filteredAlarm[key]
        ? (filteredAlarm[key] = [alarm[key][index]])
        : filteredAlarm[key].push(alarm[key][index])
    } else {
      filteredAlarm[key] = alarm[key]
    }
  }
}

export function filterAlarms(
  alarms,
  startDateTime,
  endDateTime,
  aggregatedAttrsSelected,
  selectSeveritiesLevels,
  selectIPAddressFamilies,
  countryName = 'All'
) {
  const startUnixTime = new Date(startDateTime).getTime() / 1000
  const endUnixTime = new Date(endDateTime).getTime() / 1000
  const aggregatedAttrsZipped = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsSelected)
  const countryFilter = filterAlarmsByCountry(alarms, countryName)
  const alarmsTimeFiltered = filterAlarmsByTime(
    countryFilter,
    startUnixTime,
    endUnixTime,
    aggregatedAttrsZipped
  )
  const alarmsSeverityFiltered = filterAlarmsBySeverity(
    alarmsTimeFiltered,
    selectSeveritiesLevels,
    aggregatedAttrsZipped
  )
  const alarmsIpAddressFamilyFiltered = filterAlarmsByIpAddressFamily(
    alarmsSeverityFiltered,
    selectIPAddressFamilies,
    aggregatedAttrsZipped
  )
  return alarmsIpAddressFamilyFiltered
}

export function filterAlarmsByCountry(alarms, countryName) {
  if (countryName == 'All' || countryName === null) return alarms
  const countryFilter = alarms
    .map((obj) => {
      if (obj.asn_country === countryName) {
        return obj
      }
    })
    .filter((obj) => obj !== undefined)
  return countryFilter
}
