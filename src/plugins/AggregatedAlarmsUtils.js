export function truncateString(str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    } else {
        return str.slice(0, maxLength) + '...';
    }
}

export function flattenDictionary(inputDict) {
    let flattenedDict = {};

    for (let key in inputDict) {
        let nestedDict = inputDict[key];
        for (let nestedKey in nestedDict) {
            flattenedDict[nestedKey] = nestedDict[nestedKey];
        }
    }

    return flattenedDict;
}

export function getKeysValuesEndWithSuffixes(obj, suffixes) {
    let keysValuesWithSuffixes = {}
    for (const suffix of suffixes) {
        const keysValuesWithSuffix = getKeysValuesEndsWithSuffix(obj, suffix)
        keysValuesWithSuffixes = { ...keysValuesWithSuffixes, ...keysValuesWithSuffix }
    }
    return keysValuesWithSuffixes
}

function getKeysValuesEndsWithSuffix(obj, suffix) {
    const keysValuesWithSuffix = {}
    for (const key in obj) {
        if (key.endsWith(suffix)) {
            keysValuesWithSuffix[key] = []
        }
    }
    return keysValuesWithSuffix
}

export function deepCopy(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    const copy = Array.isArray(obj) ? [] : {};

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            copy[key] = deepCopy(obj[key]);
        }
    }

    return copy;
}

export function isDictSubset(subsetDict, supersetDict) {
    for (let key in subsetDict) {
        if (!supersetDict.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

export function filterDictByPrefixes(dict, prefixes) {
    const filteredDict = {}
    for (const key in dict) {
        for (const prefix of prefixes) {
            if (key.startsWith(prefix)) {
                filteredDict[key] = dict[key]
            }
        }
    }
    return filteredDict
}

export function titleCase(str) {
    return str.toLowerCase().replace(/_/g, ' ').split(' ').map(function (word) {
        return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
}

export function formatUTCTime(date, timezone = '') {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    formattedDate = timezone.length ? `${formattedDate}:${timezone}` : formattedDate
    return formattedDate;
}

export function compareUtcStrings(utcString1, utcString2) {
    const date1 = new Date(utcString1);
    const date2 = new Date(utcString2);

    const year1 = date1.getUTCFullYear();
    const month1 = date1.getUTCMonth();
    const day1 = date1.getUTCDate();
    const hour1 = date1.getUTCHours();
    const minute1 = date1.getUTCMinutes();
    const second1 = date1.getUTCSeconds();

    const year2 = date2.getUTCFullYear();
    const month2 = date2.getUTCMonth();
    const day2 = date2.getUTCDate();
    const hour2 = date2.getUTCHours();
    const minute2 = date2.getUTCMinutes();
    const second2 = date2.getUTCSeconds();

    if (year1 > year2) return 1;
    if (year1 < year2) return -1;
    if (month1 > month2) return 1;
    if (month1 < month2) return -1;
    if (day1 > day2) return 1;
    if (day1 < day2) return -1;
    if (hour1 > hour2) return 1;
    if (hour1 < hour2) return -1;
    if (minute1 > minute2) return 1;
    if (minute1 < minute2) return -1;
    if (second1 > second2) return 1;
    if (second1 < second2) return -1;
    return 0;
}

export function zipAggregatedAttrs(aggregatedAttrsDict) {
    const arrays = []
    for (const aggregatedAttrType in aggregatedAttrsDict) {
        const aggregatedAttrs = Object.keys(aggregatedAttrsDict[aggregatedAttrType])
        arrays.push(aggregatedAttrs)
    }
    const zip = (arrays) => {
        const length = Math.min(...arrays.map(arr => arr.length));
        return Array.from({ length }, (_, index) => arrays.map(array => array[index]));
    };

    const zippedData = zip(arrays);
    return zippedData
}

export function getUniqueValues(data, property) {
    return [...new Set(data.map(item => item[property]))];
}

export function isDictEmpty(dict) {
    return !Boolean(Object.keys(dict).length)
}
