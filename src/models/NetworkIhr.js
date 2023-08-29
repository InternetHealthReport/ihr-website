import axios from 'axios'

export async function getNetworkInfo(asnList) {
  const API_URL = 'https://ihr.iijlab.net/ihr/api/networks';
  const MAX_ASNS_PER_REQUEST = 30;

  const asnArray = asnList.split(',').map(asn => asn.trim());
  const numRequests = Math.ceil(asnArray.length / MAX_ASNS_PER_REQUEST);

  const requests = [];
  for (let i = 0; i < numRequests; i++) {
    const startIdx = i * MAX_ASNS_PER_REQUEST;
    const endIdx = (i + 1) * MAX_ASNS_PER_REQUEST;
    const slicedASNs = asnArray.slice(startIdx, endIdx);

    const params = { number: slicedASNs.join(',') };

    requests.push(
      axios.get(API_URL, { params })
        .then(response => response.data.results)
        .catch(error => {
          throw error;
        })
    );
  }

  return Promise.all(requests).then(resultsArray => resultsArray.flat())
}