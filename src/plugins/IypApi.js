import axios from 'axios'
import cache from './cache.js'
import { get } from 'idb-keyval'

/// Base url for api
const IYP_API_BASE = 'https://iyp.iijlab.net/iyp/db/neo4j/query/v2'

/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const axios_base = axios.create({
  baseURL: IYP_API_BASE,
  timeout: DEFAULT_TIMEOUT
})

const runIyp = async (queries) => {
  const storageAllowed = JSON.parse(await get('storage-allowed'))
  let response = await Promise.all(
    queries.map((query) => {
      return cache(
        JSON.stringify(query),
        () => {
          return axios_base.post('', query)
        },
        {
          storageAllowed: storageAllowed ? storageAllowed : false
        }
      )
    })
  )
  return response.map((res) => {
    return formatResponse(res.data.data)
  })
}

const formatResponse = (results) => {
  const list = []
  const keys = results.fields
  results.values.forEach((row) => {
    let obj = {}
    let countElementsInRow = 0
    row.forEach((rowVal) => {
      if (typeof rowVal === 'object') {
        if (rowVal?.properties) {
          obj[keys[countElementsInRow]] = rowVal.properties
        } else {
          obj[keys[countElementsInRow]] = rowVal?.map((val) => {
            if (val?.properties !== undefined) {
              return val.properties
            }
            return val
          })
        }
      } else {
        obj[keys[countElementsInRow]] = rowVal
      }
      countElementsInRow += 1
    })
    obj = JSON.parse(JSON.stringify(obj, (_, value) => (value === undefined ? null : value)))
    list.push(obj)
  })
  return list
}

const IypApi = {
  install: (app, options) => {
    const run = async (queries) => {
      return runIyp(queries)
    }

    const iyp_api = {
      run
    }
    app.provide('iyp_api', iyp_api)
  }
}

export { IypApi, runIyp }
