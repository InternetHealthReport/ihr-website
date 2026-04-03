import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'

// Base URL for RIPE stat API
// const SUBMARINE_CABLE_MAP_API_BASE = 'https://www.submarinecablemap.com/api/v3/'
const SUBMARINE_CABLE_MAP_API_BASE = '/data/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: SUBMARINE_CABLE_MAP_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

const SubmarineCableMapApi = {
  install: (app, options) => {
    const cableGeo = async () => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      // const url = 'cable/cable-geo.json'
      const url = 'cable-geo.json'
      return await cache(
        `${url}`,
        () => {
          return axios_base.get(url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const landingPointGeo = async () => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      // const url = 'landing-point/landing-point-geo.json'
      const url = 'landing-point-geo.json'
      return await cache(
        `${url}`,
        () => {
          return axios_base.get(url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const landingPointCountryMap = async () => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = 'landing-point-country-map.json'
      return await cache(
        `${url}`,
        () => {
          return axios_base.get(url)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const submarine_cable_map_api = {
      cableGeo,
      landingPointGeo,
      landingPointCountryMap
    }

    app.provide('submarine_cable_map_api', submarine_cable_map_api)
  }
}

export { SubmarineCableMapApi }
