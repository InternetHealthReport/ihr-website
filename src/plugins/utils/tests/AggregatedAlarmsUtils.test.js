import * as AggregatedAlarmsUtils from '../AggregatedAlarmsUtils'

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
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date, 'Z');
    expect(formatted).toBe('2023-08-09T10:30:Z');
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
    const formatted = AggregatedAlarmsUtils.formatUTCTime(date, '+02:00');
    expect(formatted).toBe('2023-08-09T10:30:+02:00');
  });

  it('returns empty string for invalid date', () => {
    const formatted = AggregatedAlarmsUtils.formatUTCTime(new Date('invalid date'));
    expect(formatted).toBe('');
  });
});


describe('compareUtcStrings', () => {
  it('should return 0 for equal dates', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T12:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(0);
  });

  it('should return -1 when the first date is earlier', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T10:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(-1);
  });

  it('should return 1 when the first date is later', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T14:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different years', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2024-08-09T12:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different months', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-09-09T12:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different days', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-10T12:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different hours', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T13:00:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different minutes', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T12:01:00Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
  });

  it('should handle different seconds', () => {
    const result = AggregatedAlarmsUtils.compareUtcStrings('2023-08-09T12:00:01Z', '2023-08-09T12:00:00Z');
    expect(result).toBe(1);
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
      'counts': {
        'hegemony_alarm_counts': [],
        'network_delay_alarm_counts': [],
        'ihr_outages_alarm_counts': []
      },
      'timebins': {
        'hegemony_alarm_timebins': [],
        'network_delay_alarm_timebins': [],
        'ihr_outages_alarm_timebins': []
      },
      'severities': {
        'hegemony_alarm_severities': [],
        'network_delay_alarm_severities': [],
        'ihr_outages_alarm_severities': []
      }
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
    expect(zippedData).toEqual([]);
  });

  it('should correctly handle dictionaries with varying lengths of arrays', () => {
    const aggregatedAttrsDict = {
      'counts': {
        'alarm_counts_1': [1, 2, 3],
        'alarm_counts_2': [4, 5, 6, 7],
      },
      'timebins': {
        'alarm_timebins_1': ['t1', 't2', 't3'],
        'alarm_timebins_2': ['t4', 't5', 't6', 't7'],
      },
      'severities': {
        'alarm_severities_1': ['low', 'medium', 'high'],
        'alarm_severities_2': ['medium', 'high', 'low', 'low'],
      }
    };

    const zippedData = AggregatedAlarmsUtils.zipAggregatedAttrs(aggregatedAttrsDict);
    expect(zippedData).toEqual([
      ['alarm_counts_1', 'alarm_timebins_1', 'alarm_severities_1'],
      ['alarm_counts_2', 'alarm_timebins_2', 'alarm_severities_2'],
    ]);
  });
});

describe('getUniqueValuesFromDictKeyValues', () => {
  const testData = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Alice' },
    { id: 4, name: 'Charlie' },
  ];

  it('should return unique values based on the specified property', () => {
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(testData, 'name');
    expect(result).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('should handle empty input array', () => {
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues([], 'name');
    expect(result).toEqual([]);
  });

  it('should handle empty property value in all items', () => {
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(testData, 'nonExistentProperty');
    expect(result).toEqual([]);
  });

  it('should handle non-existent property in some items', () => {
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(testData, 'id');
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should handle numeric values', () => {
    const numericData = [
      { value: 42 },
      { value: 15 },
      { value: 42 },
      { value: 7 },
    ];
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(numericData, 'value');
    expect(result).toEqual([42, 15, 7]);
  });

  it('should handle case-sensitive property values', () => {
    const caseSensitiveData = [
      { name: 'Alice' },
      { name: 'alice' },
      { name: 'ALICE' },
    ];
    const result = AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(caseSensitiveData, 'name');
    expect(result).toEqual(['Alice', 'alice', 'ALICE']);
  });

  it('should not modify the original data array', () => {
    const originalData = [...testData];
    AggregatedAlarmsUtils.getUniqueValuesFromDictKeyValues(testData, 'name');
    expect(testData).toEqual(originalData);
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

describe('findIndicesOfValue', () => {
  it('should return an empty array if the input array is empty', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([], 42);
    expect(result).toEqual([]);
  });

  it('should return an empty array if the value is not found in the array', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([1, 2, 3, 4], 5);
    expect(result).toEqual([]);
  });

  it('should return an array containing the correct index when the value appears once', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([10, 20, 30, 40], 20);
    expect(result).toEqual([1]);
  });

  it('should return an array containing the correct indices when the value appears multiple times', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([10, 20, 20, 40, 20], 20);
    expect(result).toEqual([1, 2, 4]);
  });

  it('should return an array containing the correct indices when the value appears at the beginning and end', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([20, 30, 40, 20], 20);
    expect(result).toEqual([0, 3]);
  });

  it('should return an array containing the correct index when the value appears at the end', () => {
    const result = AggregatedAlarmsUtils.findIndicesOfValue([1, 2, 3, 4, 5, 4], 4);
    expect(result).toEqual([3, 5]);
  });
});
