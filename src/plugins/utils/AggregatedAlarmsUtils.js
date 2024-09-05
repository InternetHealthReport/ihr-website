export function truncateString(str, maxLength) {
  if (str.length <= maxLength) {
    return str
  } else {
    return str.slice(0, maxLength).trim()
  }
}

export function flattenDictionary(inputDict) {
  function flatten(obj) {
    let result = {}
    for (let key in obj) {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        const nestedKeys = flatten(obj[key])
        result = { ...result, ...nestedKeys }
      } else {
        result[key] = obj[key]
      }
    }
    return result
  }

  return flatten(inputDict)
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
    return obj
  }

  if (copiedObjects.has(obj)) {
    return copiedObjects.get(obj)
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime())
  }

  const copy = Array.isArray(obj) ? [] : {}

  copiedObjects.set(obj, copy)

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key] = deepCopy(obj[key], copiedObjects)
    }
  }

  return copy
}

export function isDictKeysSubset(subsetDict, supersetDict) {
  for (let key in subsetDict) {
    if (!supersetDict.hasOwnProperty(key)) {
      return false
    }
  }
  return true
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
    return ''
  } else {
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hours = String(date.getUTCHours()).padStart(2, '0')
    const minutes = String(date.getUTCMinutes()).padStart(2, '0')
    let formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`
    formattedDate = timezone.length ? `${formattedDate}${timezone}` : formattedDate
    return formattedDate
  }
}

export function zipAggregatedAttrs(aggregatedAttrsDict) {
  const arrays = []
  for (const aggregatedAttrType in aggregatedAttrsDict) {
    arrays.push(aggregatedAttrsDict[aggregatedAttrType])
  }
  const arraysTransposed = transposeArrays(arrays)
  return arraysTransposed
}

export function transposeArrays(arrays) {
  const length = Math.max(...arrays.map((arr) => arr.length))

  const arraysTransposed = Array.from({ length }, (_, index) => {
    return arrays.map((array) => (index < array.length ? array[index] : null))
  })
  return arraysTransposed
}

export function getPropertyUniqueValues(data, property) {
  return [...new Set(data.map((item) => item[property]))]
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
  items.forEach((item) => {
    if (itemCounts[item]) {
      itemCounts[item]++
    } else {
      itemCounts[item] = 1
    }
  })
  return itemCounts
}

export function findAllIndices(array, value) {
  const indices = []

  for (let i = 0; i < array.length; i++) {
    if (array[i] === value) {
      indices.push(i)
    }
  }

  return indices
}

export function resetChartZooming(chart) {
  Object.assign(chart.layout.xaxis, { autorange: true })
  Object.assign(chart.layout.yaxis, { autorange: true })
}

export function normalizeASNames(alarms, asNameTruncateLength = 20) {
  alarms.forEach((alarm) => {
    const asNameTruncated = AggregatedAlarmsUtils.truncateString(
      alarm.asn_name,
      asNameTruncateLength
    )
    alarm.asn_name = `${asNameTruncated} (AS${alarm.asn})`
  })
}

export function getIPAddressFamily(ipPrefix) {
  if (/:/.test(ipPrefix)) {
    return 6
  } else if (/\./.test(ipPrefix)) {
    return 4
  } else {
    return null
  }
}

export function normalizeColumns(dict) {
  const normalizedColumns = Object.keys(dict).map((element) => {
    if (Array.isArray(dict[element])) {
      dict[element] = []
    }
    return { [element]: dict[element] }
  })
  const columnsFlattened = flattenDictionary(normalizedColumns)
  return columnsFlattened
}

export function roundToDecimalPlaces(number, decimalPlaces) {
  var factor = Math.pow(10, decimalPlaces)
  return Math.round(number * factor) / factor
}

export function getMedianValue(values) {
  const validValues = values.filter((value) => value !== null && value !== '' && !isNaN(value))
  if (validValues.length === 0) return null
  let medianValue
  const sortedValues = validValues.slice().sort((a, b) => a - b)
  const middle = Math.floor(validValues.length / 2)
  if (validValues.length % 2 === 0) {
    const mid1 = sortedValues[middle - 1]
    const mid2 = sortedValues[middle]
    medianValue = (mid1 + mid2) / 2
  } else {
    medianValue = sortedValues[middle]
  }
  medianValue = roundToDecimalPlaces(medianValue, 2)
  return medianValue
}

export function getAverageValue(values) {
  const validValues = values.filter((value) => value !== null && value !== '' && !isNaN(value))
  if (validValues.length === 0) return null
  const sum = validValues.reduce((acc, num) => acc + num, 0)
  let avgValue = sum / validValues.length
  avgValue = roundToDecimalPlaces(avgValue, 2)
  return avgValue
}

export function getPercentageValue(firstValue, secondValue) {
  if (
    firstValue === null ||
    secondValue === null ||
    firstValue === '' ||
    secondValue === '' ||
    isNaN(firstValue) ||
    isNaN(secondValue) ||
    secondValue === 0 ||
    (firstValue === 0 && secondValue === 0)
  )
    return null
  const percentageValue = roundToDecimalPlaces((firstValue / secondValue) * 100, 2)
  return percentageValue
}
