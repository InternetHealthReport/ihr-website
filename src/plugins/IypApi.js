import axios from 'axios'
import cache from './cache.js'

/// Base url for api
const IYP_API_BASE = 'https://iyp.iijlab.net/iyp/db/neo4j/tx/'
/// Default timeout before api call are considered failed
const DEFAULT_TIMEOUT = 180000

const IypApi = {
  install: (app, options) => {
    const axios_base = axios.create({
      baseURL: IYP_API_BASE,
      timeout: DEFAULT_TIMEOUT,
    })

    const run = async (queries) => {
      const storageAllowed = JSON.parse(localStorage.getItem('storage-allowed'))
      let response = await cache(JSON.stringify(queries), () => {
        return axios_base.post('', {
          statements: queries
        })
      }, {
        storageAllowed: storageAllowed ? storageAllowed : false
      })
      const rows = response.data.results
      const res = []
      for (let i=0; i<rows.length; i++) {
        res.push(formatResponse(rows[i]))
      }
      return res
    }

    const formatResponse = (results) => {
      const list = []
      const keys = results.columns
      for (let i=0; i<results.data.length; i++) {
        const obj = {}
        for (let j=0; j<keys.length; j++) {
          obj[keys[j]] = results.data[i].row[j]
        }
        list.push(obj)
      }
      return list
    }

    const iyp_api = {
      run,
    }
    app.provide('iyp_api', iyp_api)
  }
}

export {
  IypApi
}