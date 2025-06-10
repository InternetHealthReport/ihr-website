import axios from 'axios'
import cache, { cachePromiseArrayResponses } from './cache.js'
import { get, set } from 'idb-keyval'

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/'
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: RIPE_ATLAS_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

// Helper functions
// Split a large array into array of smaller size chunks
const splitListToChunks = (list) => {
  const CHUNK_SIZE = 100
  const chunksList = []

  list.sort((a, b) => +a - +b)

  for (let i = 0; i < list.length; i += CHUNK_SIZE) {
    chunksList.push(list.slice(i, i + CHUNK_SIZE))
  }
  return chunksList
}

const AtlasApi = {
  install: (app, options) => {
    const getMeasurementById = async (measurementId, params = {}) => {
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}`
      return await cache(
        params && Object.keys(params).length > 0 ? `${url}_${JSON.stringify(params)}` : `${url}`,
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

    // Fetches measurement result chunk by chunk and caches
    const getAndCacheMeasurementDataInChunks = async (measurementId, params = {}) => {
      // Batch measurement result by smaller chunks of probes ids results

      let probeChunksList = []

      // Get the full measurement result
      if (!params.probe_ids) {
        // Get probes involved in the measurement
        const probesInMeasurement = await getMeasurementById(measurementId, { fields: 'probes' })
        const probeList = probesInMeasurement?.data.probes.map((p) => p.id.toString()) ?? []
        probeChunksList = splitListToChunks(probeList).map((list) => list.join(','))
      } else {
        probeChunksList = splitListToChunks(params.probe_ids.split(',')).map((list) =>
          list.join(',')
        )
      }

      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}/results`
      return await cachePromiseArrayResponses(
        params && Object.keys(params).length > 0 ? `${url}_${JSON.stringify(params)}` : url,
        async () => {
          // fetcher function: defines how to fetch data in chunks
          return await Promise.all(
            probeChunksList.reduce((result, probesChunk) => {
              const currentParams = {
                ...params,
                probe_ids: probesChunk
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
          storageAllowed: storageAllowed ? storageAllowed : false
        },
        // combinator function: defines how to combine the responses
        (resolvedPromisesList) => {
          return resolvedPromisesList.reduce((result, responses) => {
            responses.data.forEach((response) => {
              result.push(response)
            })

            return result
          }, [])
        }
      )
    }

    const atlas_api = {
      getMeasurementById,
      getMeasurementData,
      getProbeById,
      getAndCacheMeasurementDataInChunks
    }

    app.provide('atlas_api', atlas_api)
  }
}

export { AtlasApi }
