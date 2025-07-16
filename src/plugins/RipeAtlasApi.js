import axios from 'axios'
import cache from './cache.js'
import { get, set } from 'idb-keyval'

// Base URL for RIPE Atlas API
const RIPE_ATLAS_API_BASE = 'https://atlas.ripe.net/api/v2/'
const DEFAULT_TIMEOUT = 180000
const LOAD_INITIAL_PROBES_COUNT = 10
const DEFAULT_CHUNK_SIZE = 10

const axios_base = axios.create({
  baseURL: RIPE_ATLAS_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

// Helper functions
// Split a large array into array of smaller size chunks
const splitListToChunks = (list, chunkSize) => {
  chunkSize = chunkSize ?? DEFAULT_CHUNK_SIZE
  const chunksList = []

  list.sort((a, b) => +a - +b)

  for (let i = 0; i < list.length; i += chunkSize) {
    chunksList.push(list.slice(i, i + chunkSize))
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

    const getProbesByIds = async (probeIds = null, measurementID) => {
      if (probeIds == null || probeIds.length == 0) return null

      let probesChunks = splitListToChunks(probeIds, 10)

      let listParams = probesChunks.map((x) => {
        return { id__in: x.join(',') }
      })

      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `probes`
      return await cache(
        `${url}_msm_${measurementID}_probes`,
        async () => {
          return await Promise.all(
            listParams.map((x) => {
              return axios_base.get(url, { params: x })
            })
          )
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        },
        (responses) => {
          return responses.reduce((combinedResult, response) => {
            response?.data?.results.forEach((probeDetails) => {
              combinedResult.push(probeDetails)
            })
            return combinedResult
          }, [])
        }
      )
    }

    const selectNFromList = (list, N = 10) => {
      return list.slice(0, N)
    }

    const getProbesByMeasurementId = async (measurementId) => {
      const probesInMeasurement = await getMeasurementById(measurementId, { fields: 'probes' })
      return probesInMeasurement?.data.probes.map((p) => p.id.toString()) ?? []
    }

    // Fetches measurement result chunk by chunk and caches
    const getAndCacheMeasurementDataInChunks = async (measurementId, params = {}) => {
      // Batch measurement result by smaller chunks of probes ids results
      console.log('This got called with params::: ', params)

      let probeList = []
      const storageAllowed = JSON.parse(await get('storage-allowed'))
      const url = `measurements/${measurementId}/results`

      // Get the full measurement result
      if (!params.probe_ids) {
        // Get probes involved in the measurement
        probeList = await getProbesByMeasurementId(measurementId)
        // select only N probes from list
        probeList = selectNFromList(probeList, LOAD_INITIAL_PROBES_COUNT)

        let probeChunksList = splitListToChunks(probeList).map((list) => list.join(','))

        return await cache(
          url,
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
            return resolvedPromisesList.reduce((result, response) => {
              response.data.forEach((hopData) => {
                result.push(hopData)
              })

              return result
            }, [])
          }
        )
      } else {
        // Cache the measurement result by probe ids.
        probeList = params.probe_ids.split(',')
        let paramsList = probeList.map((probe) => {
          return {
            ...params,
            probe_ids: [probe]
          }
        })
        const responseArray = await Promise.all(
          paramsList.map(async (param) => {
            return await cache(
              `${url}_${JSON.stringify(param)}`,
              async () => {
                // fetcher function: defines how to fetch data in chunks
                return await axios_base.get(url, {
                  params
                })
              },
              {
                storageAllowed: storageAllowed ? storageAllowed : false
              }
            )
          })
        )

        return responseArray.reduce((result, item) => {
          item.data.forEach((hopData) => {
            result.push(hopData)
          })

          return result
        }, [])
      }
    }

    const atlas_api = {
      LOAD_INITIAL_PROBES_COUNT,

      getMeasurementById,
      getMeasurementData,
      getProbeById,
      getAndCacheMeasurementDataInChunks,
      getProbesByMeasurementId,
      getProbesByIds
    }

    app.provide('atlas_api', atlas_api)
  }
}

export { AtlasApi }
