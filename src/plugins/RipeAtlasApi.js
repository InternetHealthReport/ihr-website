import axios from 'axios'
import cache from './cache.js'
import { get, set } from 'idb-keyval'
import { splitListToChunks } from '../plugins/utils/ListUtils.js'

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RIPE_ATLAS_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

const AtlasApi = {
  install: (app, options) => {
    const getMeasurementById = async (measurementId, params = {}) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}`
      return await cache(
        params !== null || params != {} ? `${url}_${JSON.stringify(params)}` : url,
        () => {
          return axios_base.get(url, {
            params
          })
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const getMeasurementData = async (measurementId, params = {}) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}/results`
      return await cache(
        `${url}_${JSON.stringify(params)}`,
        () => {
          return axios_base.get(url, {
            params
          })
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    }

    const getAndAggregateMeasurementResultChunks = async (measurementId, params, probesList) => {
      const probeChunksList = splitListToChunks(probesList)
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}/results`
      return await cache(
        `${url}}`,
        () => {
          return Promise.all(
            probeChunksList.reduce((result, probesChunk) => {
              if (!probesChunk) return result
              let probesChunkListString = probesChunk.join(',')

              const currentParams = {
                ...params,
                probe_ids: probesChunkListString
              }
              result.push(
                axios_base.get(url, {
                  params: currentParams
                })
              )

              return result
            }, [])
          )
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false,
          isManyRequests: true
        }
      )
    }

    const getProbeById = async (probeId) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `probes/${probeId}`
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

    const atlas_api = {
      getMeasurementById,
      getMeasurementData,
      getProbeById,
      getAndAggregateMeasurementResultChunks
    }

    app.provide('atlas_api', atlas_api)
  }
}

export { AtlasApi }
