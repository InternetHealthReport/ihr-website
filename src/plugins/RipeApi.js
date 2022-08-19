/** @file ripe-api.js
 *  @brief Vue-js plugin wrapping RIPE API
 */

import axios from 'axios'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'
const ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/'

var ripe_axios = axios.create({ baseURL: RIPE_API_BASE })
var atlas_axios = axios.create({ baseURL: ATLAS_API_BASE })

export default {
  asnNeighbours(asn) {
    let queryarg = {
      params: {
        resource: asn,
      },
    }
    return ripe_axios.get('asn-neighbours/data.json', queryarg).then(response => {
      return response.data
    })
  },

  relatedPrefixes(ip) {
    let queryarg = {
      params: {
        resource: ip,
      },
    }
    return ripe_axios.get('related-prefixes/data.json', queryarg).then(response => {
      return response.data.prefixes
    })
  },

  atlasMeasurementResults(msmid, start, end){
    let queryarg = {
      params: {
        start: start.getTime() / 1000,
        end: end.getTime() / 1000,
        format: 'json',
      },
    }
    return atlas_axios.get(`measurements/${msmid}/results/`, queryarg).then(response => {
      return response.data
    })
  },
  atlasMeasurementProbes(msmid){
    let queryarg = {
      params: {
        format: 'json',
      },
    }
    return atlas_axios.get(`measurements/${msmid}/routequake/meta/`, queryarg).then(response => {
      var probeInfo = {};
      response.data.probes.forEach( prb => { probeInfo[prb.id] = prb })
        console.log('BOX FETCHED PROBES')
        console.log(probeInfo)
      return probeInfo;
    })


  }
}
