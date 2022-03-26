/** @file ripe-api.js
 *  @brief Vue-js plugin wrapping RIPE API
 */

import axios from 'axios'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'

var ripe_axios = axios.create({ baseURL: RIPE_API_BASE })

export default {
  asnNeighbours(asn) {
    let queryarg = {
      params: {
        resource: asn,
      },
    }
    console.log(ripe_axios)
    return ripe_axios.get('asn-neighbours/data.json', queryarg).then(response => {
      return response.data
    })
  },
}
