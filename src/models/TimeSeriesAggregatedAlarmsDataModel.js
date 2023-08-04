import { truncateString, titleCase } from "@/plugins/AggregatedAlarmsUtils"
import { deepCopy } from "@/plugins/AggregatedAlarmsUtils"

export function etl(alarms, aggregatedAttrsZipped, countryName) {
    const groupByKey = countryName ? 'asn' : 'country_name'
    const legendName = countryName ? `asn_name` : 'country_name'
    const alarmsFilteredByCountryOptional = countryName ? filterAlarmsByCountry(alarms, countryName) : alarms
    const alarmsGroupedByKey = groupAlarmsByKey(alarmsFilteredByCountryOptional, groupByKey, aggregatedAttrsZipped, 20);
    const alarmCountsAggregatedByTime = aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped)
    const alarmsWithAllCountsRecord = addAllAlarmCountsRecord(alarmCountsAggregatedByTime, aggregatedAttrsZipped)
    const alarmsWithCountsAcrossAllTimebins = addAlarmCountsAcrossAllTimebins(alarmsWithAllCountsRecord, aggregatedAttrsZipped)
    const alarmsByCountrySorted = sortAlarmsByCountry(alarmsWithCountsAcrossAllTimebins)
    const hoverData = getHoverZippedData(alarmsByCountrySorted, aggregatedAttrsZipped)
    const timeSeriesTraces = getTimeSeriesTraces(alarmsByCountrySorted, hoverData, legendName, aggregatedAttrsZipped)
    return timeSeriesTraces
}

function filterAlarmsByCountry(alarms, countryName) {
    const alarmsFilteredByCountry = alarms.filter(item => item.country_name === countryName && item.asn_name);
    return alarmsFilteredByCountry
}

function groupAlarmsByKey(alarms, key, aggregatedAttrsZipped, truncateLength = null) {
    const alarmsCopied = deepCopy(alarms)
    const alarmsGroupedByKey = alarmsCopied.reduce((result, obj) => {
        const existingEntry = result.find((entry) => entry[key] === obj[key]);

        if (existingEntry) {
            for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
                existingEntry[alarmTimebinType] = existingEntry[alarmTimebinType].concat(obj[alarmTimebinType]);
                existingEntry[alarmCountType] = existingEntry[alarmCountType].concat(obj[alarmCountType]);
            }
        } else {
            let alarmEntry = {
                [key]: obj[key],
                ...obj,
                country_iso_code2: obj.country_iso_code2,
                country_iso_code3: obj.country_iso_code3,
                country_name: obj.country_name,
            };

            if (truncateLength && obj.asn_name) {
                alarmEntry.asn_name = truncateString(obj.asn_name, truncateLength);
            }

            result.push(alarmEntry);
        }
        return result;
    }, []);

    return alarmsGroupedByKey;
}

function aggregateAlarmCountsByTime(alarmsGroupedByKey, aggregatedAttrsZipped) {
    const alarmCountsAggregatedByTime = deepCopy(alarmsGroupedByKey)
    for (let i = 0; i < alarmCountsAggregatedByTime.length; i++) {
        for (const [alarmCountTypeSelected, alarmTimebinTypeSelected, _] of aggregatedAttrsZipped) {
            const alarm = alarmCountsAggregatedByTime[i]
            const timebins = alarm[alarmTimebinTypeSelected];
            const duplicatesCount = findDuplicatesTimebinsCount(timebins)
            const uniqueSortedTimebins = Array.from(new Set(timebins.sort()));
            const summedCounts = uniqueSortedTimebins.map(timebin => {
                const alarmCountsSum = duplicatesCount[timebin] ? duplicatesCount[timebin] : 1
                return alarmCountsSum
            });
            alarm[alarmTimebinTypeSelected] = uniqueSortedTimebins
            alarm[alarmCountTypeSelected] = summedCounts;
        }
    }
    return alarmCountsAggregatedByTime
}

function addAllAlarmCountsRecord(alarms, aggregatedAttrsZipped) {
    const alarmsWithTotalAlarmCountsRecord = deepCopy(alarms)

    let totalAlarmCountsRecord = {
        country_iso_code2: 'All',
        country_iso_code3: 'All',
        country_name: 'All',
        asn_name: 'All',
        timebins: [],
    }

    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        totalAlarmCountsRecord[alarmCountType] = []
        totalAlarmCountsRecord[alarmTimebinType] = []
    }

    for (const alarm of alarmsWithTotalAlarmCountsRecord) {
        for (const key in alarm) {
            if (Array.isArray(totalAlarmCountsRecord[key])) {
                totalAlarmCountsRecord[key] = totalAlarmCountsRecord[key].concat(alarm[key]);
            }
        }
    }

    alarmsWithTotalAlarmCountsRecord.push(totalAlarmCountsRecord)
    return alarmsWithTotalAlarmCountsRecord
}

function findDuplicatesTimebinsCount(alarmTimebins) {
    const dateCounts = {}
    alarmTimebins.forEach(timebin => {
        if (dateCounts[timebin]) {
            dateCounts[timebin]++;
        } else {
            dateCounts[timebin] = 1;
        }
    });
    return dateCounts;
}

function addAlarmCountsAcrossAllTimebins(alarmsAggregated, aggregatedAttrsZipped) {
    const alarmsAggregatedCopy = deepCopy(alarmsAggregated)
    alarmsAggregatedCopy.forEach(alarmAggregated => {
        let allTimebins = []
        for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
            allTimebins = allTimebins.concat(...alarmAggregated[alarmTimebinType])
        }
        const uniqueSortedTimebins = Array.from(new Set(allTimebins.sort()))
        alarmAggregated.timebins = uniqueSortedTimebins

        addAlarmCountsAttrsAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped)

        addAlarmCountsValuesAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped)

        addTotalAlarmCountsAttrAcrossAllTimebins(alarmAggregated)

        addTotalAlarmCountsValuesAcrossAllTimebins(alarmAggregated, aggregatedAttrsZipped);
    });
    return alarmsAggregatedCopy
}

function addAlarmCountsAttrsAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped) {
    for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
        alarmAggregated[`${alarmCountType}_across_timebins`] = Array(alarmAggregated.timebins.length).fill(0);
    }
}

function addAlarmCountsValuesAcrossTimebinsTypes(alarmAggregated, aggregatedAttrsZipped) {
    for (let i = 0; i < alarmAggregated.timebins.length; i++) {
        const timebin = alarmAggregated.timebins[i];
        for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
            const alarm_timebin_index = alarmAggregated[alarmTimebinType].findIndex(timebinValue => timebinValue === timebin);
            if (alarm_timebin_index !== -1) {
                alarmAggregated[`${alarmCountType}_across_timebins`][i] = alarmAggregated[alarmCountType][alarm_timebin_index] || 0;
            }
        }
    }
}

function addTotalAlarmCountsAttrAcrossAllTimebins(alarmAggregated) {
    const totalAlarmCountsAcrossAllTimebins = Array(alarmAggregated.timebins.length).fill(0)
    alarmAggregated.total_alarm_counts_across_all_timebins = totalAlarmCountsAcrossAllTimebins
}

function addTotalAlarmCountsValuesAcrossAllTimebins(alarmAggregated, aggregatedAttrsZipped) {
    for (let i = 0; i < alarmAggregated.total_alarm_counts_across_all_timebins.length; i++) {
        for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
            alarmAggregated.total_alarm_counts_across_all_timebins[i] += alarmAggregated[`${alarmCountType}_across_timebins`][i];
        }
    }
}

function sortAlarmsByCountry(alarmsByCountryData) {
    const alarmsByCountryDataCopied = deepCopy(alarmsByCountryData)
    alarmsByCountryDataCopied.sort((a, b) => {
        if (a.country_name.toLowerCase() === 'all') {
            return -1
        } else if (b.country_name.toLowerCase() === 'all') {
            return 1
        } else {
            return a.country_name.toLowerCase().localeCompare(b.country_name.toLowerCase())
        }
    });
    return alarmsByCountryDataCopied
}

function getHoverZippedData(data, aggregatedAttrsZipped) {
    const result = [];

    for (let i = 0; i < data.length; i++) {
        const row = [];
        const timebins = data[i].timebins;

        for (let j = 0; j < timebins.length; j++) {
            let customHoverDataElement = {}
            for (const [alarmCountType, alarmTimebinType, _] of aggregatedAttrsZipped) {
                customHoverDataElement[alarmCountType] = data[i][`${alarmCountType}_across_timebins`][j] || 0
            }
            row.push(customHoverDataElement);
        }
        if (row.length) {
            result.push(row);
        }
    }
    return result
}

function getTimeSeriesTraces(alarms, hoverData, legendName, aggregatedAttrsZipped) {
    if (!hoverData.length) {
        return []
    }
    const traces = []
    for (let i = 0; i < alarms.length; i++) {
        const trace = {
            x: alarms[i].timebins,
            y: alarms[i].total_alarm_counts_across_all_timebins,
            type: 'scatter',
            mode: 'lines',
            name: alarms[i][legendName],
            customdata: hoverData[i],
            marker: {
                line: {
                    color: 'rgb(255,255,255)',
                    width: 1,
                },
            },
            hoverlabel: {
                bgcolor: 'white',
            },
        }
        trace.hovertemplate = getHoverTemplate(aggregatedAttrsZipped)
        if (i !== 0) {
            trace.visible = 'legendonly'
            trace.hoverinfo = 'none'
        }
        traces.push(trace)
    }
    return traces
}

function getHoverTemplate(aggregatedAttrsZipped) {
    let hoverTemplate = '<b>%{x|%Y-%m-%d} at %{x|%I:%M %p}</b><br>' + 'Total Alarm Counts: %{y}<br>'
    for (const [alarmCountType, alarmTimebinsType, _] of aggregatedAttrsZipped) {
        const alarmCountTypeTitledCase = titleCase(alarmCountType)
        hoverTemplate += `${alarmCountTypeTitledCase}: %{customdata.${alarmCountType}}<br>`
    }
    return hoverTemplate
}
