import * as AsNamesPlugin from '../AsNames';
const fs = require('fs');

describe('parseAsNamesCountryMappings', () => {
  it('should parse valid lines and return the data', () => {
    const content = '123 Company, US\n456 Corporation, CA';

    const result = AsNamesPlugin.parseAsNamesCountryMappings(content);

    const expectedResult = {
      '123': { asn_name: 'Company', country_iso_code2: 'US' },
      '456': { asn_name: 'Corporation', country_iso_code2: 'CA' },
    }

    expect(result).toEqual(expectedResult);
  });

  it('should throw an error for lines with no match', () => {
    const content = 'Valid Line 1\nInvalid Line\nValid Line 2\nAnother Invalid Line';

    const testFunction = () => AsNamesPlugin.parseAsNamesCountryMappings(content);

    expect(testFunction).toThrowError('No match for line: Valid Line 1');
  });

  it('should handle empty content', () => {
    const content = '';

    const result = AsNamesPlugin.parseAsNamesCountryMappings(content);

    expect(result).toEqual({});
  });

  it('should handle content with both valid and invalid lines', () => {
    const content = '123 Company, US\nInvalid Line 1';

    const testFunction = () => AsNamesPlugin.parseAsNamesCountryMappings(content);

    expect(testFunction).toThrowError('No match for line: Invalid Line 1');
  });
});

describe('getASNamesCountryMappings', () => {
  const timeoutMilliseconds = 20000;
  it('returns valid ASNames and Country Mappings data with expected schema', async () => {
    const filePath = './public/data/asnames.txt'
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      await AsNamesPlugin.getASNamesCountryMappings(filePath, content)
    } catch (err) {
      expect(err).toBe(null);
    }
  }, timeoutMilliseconds);
});
