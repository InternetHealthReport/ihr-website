import axios from 'axios'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'

var ripe_axios = axios.create({ baseURL: RIPE_API_BASE })

// Utility function to get data with caching
const getCachedData = async (url, params) => {
  const key = `${url}_${JSON.stringify(params)}`
  const cachedData = localStorage.getItem(key)

  if (cachedData) {
    return JSON.parse(cachedData)
  }

  const response = await ripe_axios.get(url, { params })
  try {
    localStorage.setItem(key, JSON.stringify(response.data));
  } catch (error) {
    if (error instanceof DOMException && (
      error.code === 22 || 
      error.code === 1014 || 
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )) {
      return { error: 'LOCAL_STORAGE_FULL' };
    }
  }
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
