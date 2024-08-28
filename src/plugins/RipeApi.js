import axios from 'axios'
import cache from './cache.js'

// Base URL for RIPE stat API
const RIPE_API_BASE = 'https://stat.ripe.net/data/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RIPE_API_BASE,
  timeout: DEFAULT_TIMEOUT,
})

export default {
  async asnNeighbours(asn) {
    let queryarg = {
      params: {
        resource: asn,
      }
    }
    const storageAllowed = false//JSON.parse(localStorage.getItem('storage-allowed'))
    const url = 'asn-neighbours/data.json'
    return await cache(`${url}_${JSON.stringify(queryarg)}`, () => {
        return axios_base.get(url, queryarg)
      }, {
        storageAllowed: storageAllowed ? storageAllowed : false
      })
  },
  async userIP() {
    const storageAllowed = false//JSON.parse(localStorage.getItem('storage-allowed'))
    const url = 'whats-my-ip/data.json'
    return await cache(`${url}_${JSON.stringify({})}`, () => {
      return axios_base.get(url)
    }, {
      storageAllowed: storageAllowed ? storageAllowed : false
    })
  },
  async userASN(ip) {
    let queryarg = {
      params: {
        resource: ip,
      }
    }
    const storageAllowed = false//JSON.parse(localStorage.getItem('storage-allowed'))
    const url = 'network-info/data.json'
    return await cache(`${url}_${JSON.stringify(queryarg)}`, () => {
      return axios_base.get(url, queryarg)
    }, {
      storageAllowed: storageAllowed ? storageAllowed : false
    })
  },
  async prefixOverview(ip) {
    let queryarg = {
      params: {
        resource: ip,
      }
    }
    const storageAllowed = false//JSON.parse(localStorage.getItem('storage-allowed'))
    const url = 'prefix-overview/data.json'
    return await cache(`${url}_${JSON.stringify(queryarg)}`, () => {
      return axios_base.get(url, queryarg)
    }, {
      storageAllowed: storageAllowed ? storageAllowed : false
    })
  }
}
