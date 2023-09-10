export function truncateString(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  } else {
    return str.slice(0, maxLength).trim()
  }
}

export function flattenDictionary(inputDict) {
  function flatten(obj) {
    let result = {};
    for (let key in obj) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        const nestedKeys = flatten(obj[key]);
        result = { ...result, ...nestedKeys };
      } else {
        result[key] = obj[key];
      }
    }
    return result;
  }

  return flatten(inputDict);
}

export function getKeysWithEmptyListsEndsWithSuffixes(obj, suffixes) {
  let keysValuesWithSuffixes = {}
  for (const suffix of suffixes) {
    const keysValuesWithSuffix = getKeysWithEmptyListsEndsWithSuffix(obj, suffix)
    keysValuesWithSuffixes = { ...keysValuesWithSuffixes, ...keysValuesWithSuffix }
  }
  return keysValuesWithSuffixes
}

export function getKeysWithEmptyListsEndsWithSuffix(obj, suffix) {
  const keysValuesWithSuffix = {}
  for (const key in obj) {
    if (key.endsWith(suffix)) {
      keysValuesWithSuffix[key] = []
    }
  }
  return keysValuesWithSuffix
}

export function deepCopy(obj, copiedObjects = new WeakMap()) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (copiedObjects.has(obj)) {
    return copiedObjects.get(obj);
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  const copy = Array.isArray(obj) ? [] : {};

  copiedObjects.set(obj, copy);

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key], copiedObjects);
    }
  }

  return copy;
}

export function isDictKeysSubset(subsetDict, supersetDict) {
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
  return str
    .toLowerCase()
    .replace(/[\s_]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .trim()
}

export function formatUTCTime(date, timezone = '') {
  if (!(date instanceof Date && !isNaN(date))) {
    return '';
  } else {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    formattedDate = timezone.length ? `${formattedDate}:${timezone}` : formattedDate
    return formattedDate;
  }
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

  const arraysTransposed = transposeArrays(arrays);
  return arraysTransposed
}

export function transposeArrays(arrays) {
  const length = Math.max(...arrays.map(arr => arr.length));

  const arraysTransposed = Array.from({ length }, (_, index) => {
    return arrays.map(array => (index < array.length ? array[index] : null))
  })
  return arraysTransposed
}

export function getUniqueValuesFromDictKeyValues(data, property) {
  return [...new Set(data.map(item => item[property]))];
}

export function isDictEmpty(dict) {
  if (dict) {
    return !Boolean(Object.keys(dict).length)
  } else {
    return true
  }
}

export function countItemOccurrences(items) {
  const itemCounts = {}
  items.forEach(item => {
    if (itemCounts[item]) {
      itemCounts[item]++;
    } else {
      itemCounts[item] = 1;
    }
  });
  return itemCounts;
}

export function findIndicesOfValue(array, value) {
  const indices = [];

  for (let i = 0; i < array.length; i++) {
    if (array[i] === value) {
      indices.push(i);
    }
  }

  return indices;
}
