import * as AggregatedAlarmsUtils from '../utils/AggregatedAlarmsUtils'

describe('truncateString', () => {
  test('should truncate a string if it exceeds the max length', () => {
    const result = AggregatedAlarmsUtils.truncateString('Hello, world!', 5);
    expect(result).toEqual('Hello');
  });

  test('should not truncate a string if it is within or equal to the max length', () => {
    const result = AggregatedAlarmsUtils.truncateString('Hello', 5);
    expect(result).toEqual('Hello');
  });

  test('should handle empty string', () => {
    const result = AggregatedAlarmsUtils.truncateString('', 5);
    expect(result).toEqual('');
  });
});

describe('flattenDictionary', () => {
  test('should flatten a nested dictionary', () => {
    const inputDict = {
      key1: { nestedKey1: 'value1' },
      key2: { nestedKey2: 'value2' }
    };
    const result = AggregatedAlarmsUtils.flattenDictionary(inputDict);
    expect(result).toEqual({ nestedKey1: 'value1', nestedKey2: 'value2' });
  });

  test('should handle nested dictionaries with deeper levels', () => {
    const inputDict = {
      key1: { nestedKey1: { deepKey: 'value1' } },
      key2: { nestedKey2: { deeperKey: 'value2' } }
    };
    const result = AggregatedAlarmsUtils.flattenDictionary(inputDict);
    expect(result).toEqual({ deepKey: 'value1', deeperKey: 'value2' });
  });

  test('should handle empty dictionaries', () => {
    const inputDict = {};
    const result = AggregatedAlarmsUtils.flattenDictionary(inputDict);
    expect(result).toEqual({});
  });
});

describe('getKeysWithEmptyListsEndsWithSuffix', () => {
  it('should return an object with keys ending with the given suffix having empty arrays as values', () => {
    const inputObj = {
      apple_suffix: 'value1',
      orange_suffix: 'value2',
      banana: 'value3',
    };
    const suffix = '_suffix';
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffix(inputObj, suffix);
    const expectedResult = {
      apple_suffix: [],
      orange_suffix: [],
    };
    expect(result).toEqual(expectedResult);
  });

  it('should handle empty object', () => {
    const inputObj = {};
    const suffix = '_suffix';
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffix(inputObj, suffix);
    expect(result).toEqual({});
  });

  it('should handle object with no keys ending with the given suffix', () => {
    const inputObj = {
      apple: 'value1',
      orange: 'value2',
      banana: 'value3',
    };
    const suffix = '_suffix';
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffix(inputObj, suffix);
    expect(result).toEqual({});
  });
});

describe('getKeysWithEmptyListsEndsWithSuffixes', () => {
  it('should return an object with keys from multiple suffixes having empty arrays as values', () => {
    const inputObj = {
      apple_suffix: 'value1',
      orange_suffix: 'value2',
      banana_suffix: 'value3',
      mango_suffix: 'value4',
      grape: 'value5',
    };
    const suffixes = ['_suffix', '_suffixes'];
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffixes(inputObj, suffixes);
    const expectedResult = {
      apple_suffix: [],
      orange_suffix: [],
      banana_suffix: [],
      mango_suffix: [],
    };
    expect(result).toEqual(expectedResult);
  });

  it('should handle empty object and suffixes array', () => {
    const inputObj = {};
    const suffixes = [];
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffixes(inputObj, suffixes);
    expect(result).toEqual({});
  });

  it('should handle object with no keys from the given suffixes', () => {
    const inputObj = {
      apple: 'value1',
      orange: 'value2',
      banana: 'value3',
    };
    const suffixes = ['_suffix', '_suffixes'];
    const result = AggregatedAlarmsUtils.getKeysWithEmptyListsEndsWithSuffixes(inputObj, suffixes);
    expect(result).toEqual({});
  });
});


describe('deepCopy', () => {
  it('should create a deep copy of an object', () => {
    const originalObj = {
      key1: 'value1',
      key2: {
        nestedKey1: 'nestedValue1',
        nestedKey2: [1, 2, 3],
      },
      key3: new Date(),
    };
    const copiedObj = AggregatedAlarmsUtils.deepCopy(originalObj);
    expect(copiedObj).toEqual(originalObj);
    expect(copiedObj).not.toBe(originalObj);
  });

  it('should create a deep copy of an array', () => {
    const originalArray = [1, [2, 3], { key: 'value' }];
    const copiedArray = AggregatedAlarmsUtils.deepCopy(originalArray);
    expect(copiedArray).toEqual(originalArray);
    expect(copiedArray).not.toBe(originalArray);
  });

  it('should handle null and primitive types', () => {
    const nullValue = null;
    const numberValue = 42;
    const stringValue = 'hello';
    const resultNull = AggregatedAlarmsUtils.deepCopy(nullValue);
    const resultNumber = AggregatedAlarmsUtils.deepCopy(numberValue);
    const resultString = AggregatedAlarmsUtils.deepCopy(stringValue);
    expect(resultNull).toBe(nullValue);
    expect(resultNumber).toBe(numberValue);
    expect(resultString).toBe(stringValue);
  });

  it('should create a deep copy of a Date object', () => {
    const originalDate = new Date();
    const copiedDate = AggregatedAlarmsUtils.deepCopy(originalDate);
    expect(copiedDate).toEqual(originalDate);
    expect(copiedDate).not.toBe(originalDate);
  });

  it('should handle circular references', () => {
    const circularObj = { prop1: 'value1' };
    circularObj.circularRef = circularObj;
    const copiedCircularObj = AggregatedAlarmsUtils.deepCopy(circularObj);
    expect(copiedCircularObj).toEqual(circularObj);
    expect(copiedCircularObj.circularRef).toBe(copiedCircularObj);
  });
});

describe('isDictKeysSubset', () => {
  it('returns true if subsetDict is indeed a subset', () => {
    const subsetDict = { 'apple': 1, 'banana': 2 };
    const supersetDict = { 'apple': 1, 'banana': 2, 'cherry': 3 };

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(true);
  });

  it('handles empty subsetDict', () => {
    const subsetDict = {};
    const supersetDict = { 'apple': 1, 'banana': 2, 'cherry': 3 };

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(true);
  });

  it('handles empty supersetDict', () => {
    const subsetDict = { 'apple': 1, 'banana': 2 };
    const supersetDict = {};

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(false);
  });

  it('handles subset containing extra keys not in superset', () => {
    const subsetDict = { 'apple': 1, 'banana': 2, 'extra': 3 };
    const supersetDict = { 'apple': 1, 'banana': 2 };

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(false);
  });

  it('handles subset values differing from superset values', () => {
    const subsetDict = { 'apple': 1, 'banana': 3 };
    const supersetDict = { 'apple': 1, 'banana': 2 };

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(true);
  });

  it('handles both dictionaries being empty', () => {
    const subsetDict = {};
    const supersetDict = {};

    const result = AggregatedAlarmsUtils.isDictKeysSubset(subsetDict, supersetDict);

    expect(result).toBe(true);
  });
});


describe('filterDictByPrefixes', () => {
  it('filters dictionary based on prefixes', () => {
    const inputDict = { 'apple': 1, 'banana': 2, 'cherry': 3, 'grape': 4, 'orange': 5 };
    const prefixes = ['a', 'b', 'c'];

    const filteredDict = AggregatedAlarmsUtils.filterDictByPrefixes(inputDict, prefixes);

    expect(filteredDict).toEqual({ 'apple': 1, 'banana': 2, 'cherry': 3 });
  });

  it('handles empty dictionary', () => {
    const inputDict = {};
    const prefixes = ['a', 'b', 'c'];

    const filteredDict = AggregatedAlarmsUtils.filterDictByPrefixes(inputDict, prefixes);

    expect(filteredDict).toEqual({});
  });

  it('handles empty prefixes array', () => {
    const inputDict = { 'apple': 1, 'banana': 2, 'cherry': 3 };
    const prefixes = [];

    const filteredDict = AggregatedAlarmsUtils.filterDictByPrefixes(inputDict, prefixes);

    expect(filteredDict).toEqual({});
  });

  it('handles no keys matching prefixes', () => {
    const inputDict = { 'apple': 1, 'banana': 2, 'cherry': 3 };
    const prefixes = ['x', 'y', 'z'];

    const filteredDict = AggregatedAlarmsUtils.filterDictByPrefixes(inputDict, prefixes);

    expect(filteredDict).toEqual({});
  });

  it('handles all keys matching prefixes', () => {
    const inputDict = { 'apple': 1, 'banana': 2, 'cherry': 3 };
    const prefixes = ['a', 'b', 'c'];

    const filteredDict = AggregatedAlarmsUtils.filterDictByPrefixes(inputDict, prefixes);

    expect(filteredDict).toEqual(inputDict);
  });
});


describe('titleCase', () => {
  it('converts snake_case string to title case', () => {
    const input = 'hello_world_test';
    const expectedOutput = 'Hello World Test';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });

  it('handles empty input string', () => {
    const input = '';
    const expectedOutput = '';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });

  it('handles single-word input', () => {
    const input = 'apple';
    const expectedOutput = 'Apple';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });

  it('handles all caps input', () => {
    const input = 'HELLO_WORLD';
    const expectedOutput = 'Hello World';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });

  it('handles multiple spaces between words', () => {
    const input = '   this    is   a test   ';
    const expectedOutput = 'This Is A Test';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });

  it('handles input with no underscores, all lowercase', () => {
    const input = 'hello';
    const expectedOutput = 'Hello';

    const result = AggregatedAlarmsUtils.titleCase(input);

    expect(result).toEqual(expectedOutput);
  });
});

describe('formatUTCTime', () => {
  it('formats UTC time correctly without timezone', () => {
    const date = new Date(Date.UTC(2023, 7, 9, 10, 30));
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date);
    expect(formatted).toBe('2023-08-09T10:30');
  });

  it('formats UTC time correctly with timezone', () => {
    const date = new Date(Date.UTC(2023, 7, 9, 10, 30));
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date, ':00Z');
    expect(formatted).toBe('2023-08-09T10:30:00Z');
  });

  it('handles single-digit month and day', () => {
    const date = new Date(Date.UTC(2023, 1, 5, 9, 5));
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date);
    expect(formatted).toBe('2023-02-05T09:05');
  });

  it('handles single-digit hours and minutes', () => {
    const date = new Date(Date.UTC(2023, 3, 15, 5, 3));
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date);
    expect(formatted).toBe('2023-04-15T05:03');
  });

  it('handles timezone offset', () => {
    const date = new Date(Date.UTC(2023, 7, 9, 10, 30));
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date, ':+02:00');
    expect(formatted).toBe('2023-08-09T10:30:+02:00');
  });

  it('returns empty string for invalid date', () => {
    const formatted = AggregatedAlarmsUtils.formatUTCTime(new Date('invalid date'));
    expect(formatted).toBe('');
  });
});

describe('transposeArrays', () => {
  it('should transpose arrays correctly', () => {
    const inputArrays = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9]
    ];
    const expectedOutput = [
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9]
    ];

    expect(AggregatedAlarmsUtils.transposeArrays(inputArrays)).toEqual(expectedOutput);
  });

  it('should handle arrays with different lengths', () => {
    const inputArrays = [
      [1, 2],
      [3, 4, 5],
      [6]
    ];
    const expectedOutput = [
      [1, 3, 6],
      [2, 4, null],
      [null, 5, null]
    ];

    expect(AggregatedAlarmsUtils.transposeArrays(inputArrays)).toEqual(expectedOutput);
  });

  it('should handle empty arrays', () => {
    const inputArrays = [];
    const expectedOutput = [];

    expect(AggregatedAlarmsUtils.transposeArrays(inputArrays)).toEqual(expectedOutput);
  });

  it('should handle arrays containing null values', () => {
    const inputArrays = [
      [1, null, 3],
      [null, 5, null],
      [6, null, 9]
    ];
    const expectedOutput = [
      [1, null, 6],
      [null, 5, null],
      [3, null, 9]
    ];

    expect(AggregatedAlarmsUtils.transposeArrays(inputArrays)).toEqual(expectedOutput);
  });

  it('should handle single-element arrays', () => {
    const inputArrays = [
      [1],
      [2],
      [3]
    ];
    const expectedOutput = [
      [1, 2, 3]
    ];

    expect(AggregatedAlarmsUtils.transposeArrays(inputArrays)).toEqual(expectedOutput);
  });
});

describe('zipAggregatedAttrs', () => {
  it('should correctly zip aggregated attributes', () => {
    const aggregatedAttrsDict = {
      'counts': [
        'hegemony_alarm_counts',
        'network_delay_alarm_counts',
        'ihr_outages_alarm_counts'

      ],
      'timebins': [
        'hegemony_alarm_timebins',
        'network_delay_alarm_timebins',
        'ihr_outages_alarm_timebins'
      ],
      'severities': [
        'hegemony_alarm_severities',
        'network_delay_alarm_severities',
        'ihr_outages_alarm_severities'
      ]
    }

    const zippedData = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsDict);
    expect(zippedData).toEqual([
      [
        'hegemony_alarm_counts',
        'hegemony_alarm_timebins',
        'hegemony_alarm_severities'
      ],
      [
        'network_delay_alarm_counts',
        'network_delay_alarm_timebins',
        'network_delay_alarm_severities'
      ],
      [
        'ihr_outages_alarm_counts',
        'ihr_outages_alarm_timebins',
        'ihr_outages_alarm_severities'
      ]
    ]);
  });

  it('should return an empty array when provided an empty dictionary', () => {
    const aggregatedAttrsDict = {};
    const zippedData = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsDict);
    expect(zippedData).toHaveLength(0);
  });
});

describe('isDictEmpty', () => {
  it('should return true for an empty dictionary', () => {
    const emptyDict = {};
    expect(AggregatedAlarmsUtils.isDictEmpty(emptyDict)).toBe(true);
  });

  it('should return false for a non-empty dictionary', () => {
    const nonEmptyDict = { key: 'value' };
    expect(AggregatedAlarmsUtils.isDictEmpty(nonEmptyDict)).toBe(false);
  });

  it('should return true for an undefined dictionary', () => {
    const undefinedDict = undefined;
    expect(AggregatedAlarmsUtils.isDictEmpty(undefinedDict)).toBe(true);
  });

  it('should return true for a null dictionary', () => {
    const nullDict = null;
    expect(AggregatedAlarmsUtils.isDictEmpty(nullDict)).toBe(true);
  });
})


describe('countItemOccurrences', () => {
  it('should return an empty object for an empty array', () => {
    const result = AggregatedAlarmsUtils.countItemOccurrences([]);
    expect(result).toEqual({});
  });

  it('should count occurrences of items correctly', () => {
    const items = ['apple', 'banana', 'apple', 'apple', 'banana', 'cherry'];
    const result = AggregatedAlarmsUtils.countItemOccurrences(items);
    expect(result).toEqual({
      'apple': 3,
      'banana': 2,
      'cherry': 1
    });
  });

  it('should handle single-item array', () => {
    const result = AggregatedAlarmsUtils.countItemOccurrences(['apple']);
    expect(result).toEqual({
      'apple': 1
    });
  });

  it('should handle an array with duplicate items', () => {
    const items = ['apple', 'apple', 'apple'];
    const result = AggregatedAlarmsUtils.countItemOccurrences(items);
    expect(result).toEqual({
      'apple': 3
    });
  });

  it('should handle an array with different data types', () => {
    const items = ['apple', 42, 'banana', 42, 'apple'];
    const result = AggregatedAlarmsUtils.countItemOccurrences(items);
    expect(result).toEqual({
      'apple': 2,
      42: 2,
      'banana': 1
    });
  });

  it('should handle an array with undefined and null values', () => {
    const items = ['apple', undefined, null, 'banana', undefined];
    const result = AggregatedAlarmsUtils.countItemOccurrences(items);
    expect(result).toEqual({
      'apple': 1,
      undefined: 2,
      null: 1,
      'banana': 1
    });
  });
});

describe('findAllIndices', () => {
  it('should return an empty array if the input array is empty', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([], 42);
    expect(result).toHaveLength(0);
  });

  it('should return an empty array if the value is not found in the array', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([1, 2, 3, 4], 5);
    expect(result).toHaveLength(0);
  });

  it('should return an array containing the correct index when the value appears once', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([10, 20, 30, 40], 20);
    expect(result).toEqual([1]);
  });

  it('should return an array containing the correct indices when the value appears multiple times', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([10, 20, 20, 40, 20], 20);
    expect(result).toEqual([1, 2, 4]);
  });

  it('should return an array containing the correct indices when the value appears at the beginning and end', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([20, 30, 40, 20], 20);
    expect(result).toEqual([0, 3]);
  });

  it('should return an array containing the correct index when the value appears at the end', () => {
    const result = AggregatedAlarmsUtils.findAllIndices([1, 2, 3, 4, 5, 4], 4);
    expect(result).toEqual([3, 5]);
  });
});

describe('getIPAddressFamily', () => {
  it('should correctly detect IPv6 address', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
    expect(result).toBe(6);
  });

  it('should correctly detect IPv4 address', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('192.168.0.1');
    expect(result).toBe(4);
  });

  it('should return null for non-IP string', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('not-an-ip');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('');
    expect(result).toBeNull();
  });

  it('should correctly detect IPv6 address with mixed IPv4 part', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('::192.168.0.1');
    expect(result).toBe(6);
  });

  it('should correctly detect IPv4-like string', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('10.10');
    expect(result).toBe(4);
  });

  it('should correctly detect IPv6-like string', () => {
    const result = AggregatedAlarmsUtils.getIPAddressFamily('2001:0db8:85a3:::8a2e');
    expect(result).toBe(6);
  });
});

describe('getMedianValue', () => {
  it('returns null for an empty input array', () => {
    const result = AggregatedAlarmsUtils.getMedianValue([]);
    expect(result).toBeNull();
  });

  it('returns the correct median for an odd-length input array', () => {
    const input = [1, 3, 2, 4, 5];
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(3);
  });

  it('returns the correct median for an even-length input array', () => {
    const input = [1, 3, 2, 4];
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(2.5);
  });

  it('ignores null values and calculates the median', () => {
    const input = [1, null, 2, 4, 5];
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(3);
  });

  it('handles negative numbers and returns the correct median', () => {
    const input = [-3, -2, -1, 0, 1, 2, 3];
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(0);
  });

  it('handles a large array and calculates the median', () => {
    const input = Array.from({ length: 1000 }, (_, index) => index);
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(499.5);
  });

  it('rounds the median value to two decimal places', () => {
    const input = [1, 2, 3, 4];
    const result = AggregatedAlarmsUtils.getMedianValue(input);
    expect(result).toBe(2.5);
  });
});

describe('getAverageValue', () => {
  it('should calculate the average of valid values correctly', () => {
    const values = [1, 2, 3, 4, 5];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBe(3.00);
  });

  it('should handle null and empty values correctly', () => {
    const values = [1, null, '', 2, 3, 4, 5];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBe(3.00);
  });

  it('should handle non-numeric values correctly', () => {
    const values = [1, 'abc', 2, 3, 'xyz', 4, 5];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBe(3.00);
  });

  it('should return null for an empty array', () => {
    const values = [];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBeNull();
  });

  it('should return null when all values are null or empty', () => {
    const values = [null, '', null, ''];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBeNull();
  });

  it('should return null when all values are non-numeric', () => {
    const values = ['abc', 'xyz'];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBeNull();
  });

  it('should handle a single valid value correctly', () => {
    const values = [42];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBe(42.00);
  });

  it('should round the average to 2 decimal places', () => {
    const values = [1.333, 2.666, 3.999];
    const result = AggregatedAlarmsUtils.getAverageValue(values);
    expect(result).toBe(2.67);
  });
});

describe('getPercentageValue', () => {
  it('should return null if secondValue is 0', () => {
    const result = AggregatedAlarmsUtils.getPercentageValue(42, 0);
    expect(result).toBeNull();
  });

  it('should return null if both values are NaN', () => {
    const result = AggregatedAlarmsUtils.getPercentageValue(NaN, NaN);
    expect(result).toBeNull();
  });

  it('should calculate the percentage value correctly', () => {
    const result = AggregatedAlarmsUtils.getPercentageValue(25, 50);
    expect(result).toBe(50);
  });

  it('should round the percentage value to 2 decimal places', () => {
    const result = AggregatedAlarmsUtils.getPercentageValue(1, 3);
    expect(result).toBeCloseTo(33.33, 2);
  });

  it('should return null if firstValue is 0 and secondValue is 0', () => {
    const result = AggregatedAlarmsUtils.getPercentageValue(0, 0);
    expect(result).toBeNull();
  });
});
