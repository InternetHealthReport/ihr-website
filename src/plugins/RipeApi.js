import axios from 'axios'
import cache from './cache.js'
import { get, set } from 'idb-keyval'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RIPE_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

// Utility function to get data with caching
const getCachedData = async (url, params) => {
  const key = `${url}_${JSON.stringify(params)}`
  const cachedData = await get(key)

  if (cachedData) {
    return JSON.parse(cachedData)
  }

  const response = await ripe_axios.get(url, { params })
  try {
    await set(key, JSON.stringify(response.data))
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      return { error: 'LOCAL_STORAGE_FULL' }
    }
  }
  return response.data
}

export default {
  async asnNeighbours(asn) {
    let queryarg = {
      params: {
        resource: asn
      }
    }
    const storageAllowed = false //await get('storage-allowed'))
    const url = 'asn-neighbours/data.json'
    return await cache(
      `${url}_${JSON.stringify(queryarg)}`,
      () => {
        return axios_base.get(url, queryarg)
      },
      {
        storageAllowed: storageAllowed ? storageAllowed : false
      }
    )
  },
  async userIP() {
    const storageAllowed = false //JSON.parse(await get('storage-allowed'))
    const url = 'whats-my-ip/data.json'
    return await cache(
      `${url}_${JSON.stringify({})}`,
      () => {
        return axios_base.get(url)
      },
      {
        storageAllowed: storageAllowed ? storageAllowed : false
      }
    )
  },
  async userASN(ip) {
    let queryarg = {
      params: {
        resource: ip
      }
    }
    const storageAllowed = false //JSON.parse(await get('storage-allowed'))
    const url = 'network-info/data.json'
    return await cache(
      `${url}_${JSON.stringify(queryarg)}`,
      () => {
        return axios_base.get(url, queryarg)
      },
      {
        storageAllowed: storageAllowed ? storageAllowed : false
      }
    )
  },
  async prefixOverview(ip) {
    let queryarg = {
      params: {
        resource: ip
      }
    }
    const storageAllowed = false //JSON.parse(await get('storage-allowed'))
    const url = 'prefix-overview/data.json'
    return await cache(
      `${url}_${JSON.stringify(queryarg)}`,
      () => {
        return axios_base.get(url, queryarg)
      },
      {
        storageAllowed: storageAllowed ? storageAllowed : false
      }
    )
  }
}
