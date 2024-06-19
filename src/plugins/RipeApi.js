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
    return ripe_axios.get('asn-neighbours/data.json', queryarg).then(response => {
      return response.data
    })
  },
  userIP() {
    return ripe_axios.get('whats-my-ip/data.json').then(response => {
      return response.data
    })
  },
  userASN(ip) {
    let queryarg = {
      params: {
        resource: ip,
      },
    }
    return ripe_axios.get('network-info/data.json', queryarg).then(response => {
      return response.data
    })
  },
  prefixOverview(ip) {
    let queryarg = {
      params: {
        resource: ip,
      },
    }
    return ripe_axios.get('prefix-overview/data.json', queryarg).then(response => {
      return response.data
    })
  }
}