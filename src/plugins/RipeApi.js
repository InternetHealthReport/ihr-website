import axios from 'axios'
import cache from './cache.js'
import { get, set } from 'idb-keyval'

// Base URL for RIPE stat API
const RIPE_STAT_API_BASE = 'https://stat.ripe.net/data/'
const RIPE_STAT_UI_API_BASE = 'https://stat-ui.stat.ripe.net/data/'
const DEFAULT_TIMEOUT = 180000

const axios_base_ripe_stat = axios.create({
  baseURL: RIPE_STAT_API_BASE,
  timeout: DEFAULT_TIMEOUT
})
const axios_base_ripe_stat_ui = axios.create({
  baseURL: RIPE_STAT_UI_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

const RipeApi = {
  install: (app, options) => {
    const asnNeighbours = async (asn) => {
      let queryarg = {
        params: {
          resource: asn
        }
      }
      const storageAllowed = false //JSON.parse(await get('storage-allowed'))
      const url = 'asn-neighbours/data.json'
      return await cache(
        `${url}_${JSON.stringify(queryarg)}`,
        () => {
          return axios_base_ripe_stat.get(url, queryarg)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const userIP = async () => {
      const storageAllowed = false //JSON.parse(await get('storage-allowed'))
      const url = 'whats-my-ip/data.json'
      return await cache(
        `${url}_${JSON.stringify({})}`,
        () => {
          return axios_base_ripe_stat.get(url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const userASN = async (ip) => {
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
          return axios_base_ripe_stat.get(url, queryarg)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const prefixOverview = async (ip) => {
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
          return axios_base_ripe_stat.get(url, queryarg)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const rccInfo = async () => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = 'rrc-info/data.json'
      return await cache(
        url,
        () => {
          return axios_base_ripe_stat.get(url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const getBgpData = async (prefix, starttime, endtime, rrcs) => {
      let queryarg = {
        params: {
          resource: prefix,
          starttime: starttime,
          endtime: endtime,
          rrcs: rrcs.join(',')
        }
      }
      const storageAllowed = false //JSON.parse(await get('storage-allowed'))
      const url = 'bgplay/data.json'
      return await cache(
        `${url}_${JSON.stringify(queryarg)}`,
        () => {
          return axios_base_ripe_stat_ui.get(url, queryarg)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const ripe_api = {
      asnNeighbours,
      userIP,
      userASN,
      prefixOverview,
      rccInfo,
      getBgpData
    }

    app.provide('ripe_api', ripe_api)
  }
}

export { RipeApi }
