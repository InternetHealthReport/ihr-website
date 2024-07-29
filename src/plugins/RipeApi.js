import axios from 'axios'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'

var ripe_axios = axios.create({ baseURL: RIPE_API_BASE })

// Simple in-memory cache
const cache = {}

// Utility function to get data with caching
const getCachedData = async (url, params) => {
  const key = `${url}_${JSON.stringify(params)}`
  if (cache[key]) {
    return cache[key]
  }

  const response = await ripe_axios.get(url, { params })
  cache[key] = response.data
  return response.data
}

export default {
  async asnNeighbours(asn) {
    let queryarg = {
      resource: asn,
    }
    return await getCachedData('asn-neighbours/data.json', queryarg)
  },
  async userIP() {
    return await getCachedData('whats-my-ip/data.json', {})
  },
  async userASN(ip) {
    let queryarg = {
      resource: ip,
    }
    return await getCachedData('network-info/data.json', queryarg)
  },
  async prefixOverview(ip) {
    let queryarg = {
      resource: ip,
    }
    return await getCachedData('prefix-overview/data.json', queryarg)
  }
}
