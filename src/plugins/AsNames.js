import axios from 'axios'

export function getASNamesCountryMappings(asNamesPath = './data/asnames.txt', content = null) {
  const request = () => {
    return new Promise((resolve, reject) => {
      if (content === null) {
        axios.get(asNamesPath)
          .then(response => {
            const result = parseAsNamesCountryMappings(response.data)
            resolve(result)
          })
          .catch(error => reject(error));
      } else {
        const result = parseAsNamesCountryMappings(content)
        resolve(result)
      }

    })
  }
  return request()
}

export function parseAsNamesCountryMappings(content) {
  if (content === '') return {}
  const lines = content.split('\n');
  const parsedData = {};
  for (const line of lines) {
    if (line === '') continue
    const match = line.match(/^(\d+)\s(.*),\s([A-Z]{2})$/);
    if (match) {
      const [_, asn, asnName, country_iso_code2] = match;
      parsedData[asn] = { asn_name: asnName, country_iso_code2: country_iso_code2 }
    } else {
      throw new Error(`No match for line: ${line}`);
    }
  }
  return parsedData;
}