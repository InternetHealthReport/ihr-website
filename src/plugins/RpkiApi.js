import axios from 'axios'
import cache from './cache.js'
import { get, set } from 'idb-keyval'

// Base URL for RIPE stat API
const RPKI_HISTORY_API_BASE = 'https://www.ihr.live/rpki-history/api/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RPKI_HISTORY_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

const RpkiApi = {
  install: (app, options) => {
    const vrp = async (prefix, timestamp__gte, timestamp__lte) => {
      let queryarg = {
        params: {
          prefix: prefix,
          timestamp__gte: timestamp__gte,
          timestamp__lte: timestamp__lte
        }
      }
      const storageAllowed = false //JSON.parse(await get('storage-allowed'))
      const url = 'vrp'
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

    const rpki_api = {
      vrp
    }

    app.provide('rpki_api', rpki_api)
  }
}

export { RpkiApi }
