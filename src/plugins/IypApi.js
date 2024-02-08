// import neo4j from 'neo4j-driver'
import axios from 'axios'

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
      let response = await axios_base.post('', {
        statements: queries
      })
      const rows = response.data.results
      // console.log(rows)
      const res = []
      for (let i=0; i<rows.length; i++) {
        const list = []
        const keys = rows[i].columns
        for (let j=0; j<rows[i].data.length; j++) {
          const obj = {}
          for (let z=0; z<keys.length; z++) {
            obj[keys[z]] = rows[i].data[j].row[z]
          }
          list.push(obj)
        }
        res.push(list)
      }
      console.log(res)
      return res
    }

    // const _getSession = (options = { defaultAccessMode: neo4j.session.READ }) => {
    //   const driver = neo4j.driver(IYP_API_BASE)
    //   if (!driver) {
    //     throw new Error('A connection has not been made to Neo4j.')
    //   }

    //   return driver.session(options)
    // }

    // const run = (query, params, options = { defaultAccessMode: neo4j.session.READ }) => {
    //   const session = _getSession(options)
    //   return session.run(query, params)
    //     .then(results => {
    //       session.close()
    //       return results
    //     })
    //     .catch(error => {
    //       session.close()
    //       console.error(error)
    //     })
    // }

    // const runManyInOneSession = async (queries, options = { defaultAccessMode: neo4j.session.READ }) => {
    //   // This method will execute multiple queries by creating one session which will reduce loading time
    //   // But the execution is not parallel

    //   let session = _getSession(options)
    //   let transaction = await session.beginTransaction()

    //   let result = []
    //   queries.forEach(async q => {
    //     try {
    //       let res = await transaction.run(q.cypherQuery, q.params)
    //       result.push(res)
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   })

    //   await transaction.close()
    //   return result
    // }

    const formatResponse = (results, mapping) => {
      let formattedResults = []
      for (let record of results.records) {
        let formattedRecord = {}
        for (let key in mapping) {
          let field = ''
          if (mapping[key] instanceof Array) {
            field = mapping[key][0]
            formattedRecord[key] = record.get(field)[mapping[key][1]]
          } else {
            field = mapping[key]
            formattedRecord[key] = record.get(field)
          }
        }
        formattedResults.push(formattedRecord)
      }
      return formattedResults
    }

    // const searchIYPInOneSession = async (queries) => {
    //   let response = await runManyInOneSession(queries)
    //   let searchResults = []
    //   for (let i = 0; i < response.length; i++) {
    //     let res = formatResponse(response[i], queries[i].mapping)
    //     searchResults = [...searchResults, ...res]
    //   }
    //   return searchResults
    // }

    // const runManyInParallel = (queries, params, options = { defaultAccessMode: neo4j.session.READ }) => {
    //   const tx = _getSession(options).beginTransaction()

    //   let response = []
    //   queries.forEach( q => {
    //     try {
    //       let res = tx.run(q.query, params)
    //       response.push(res)
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   })

    //   tx.close()

    //   return response
    // }

    // const runManyInOneSessionAndReturnAnObject = async (queries, params, options = { defaultAccessMode: neo4j.session.READ }) => {
    //   let session = _getSession(options)
    //   let transaction = await session.beginTransaction()

    //   let response = []
    //   queries.forEach(async q => {
    //     try {
    //       let res = await transaction.run(q.query, q.params)
    //       response.push(res)
    //     } catch (e) {
    //       console.error(e)
    //     }
    //   })

    //   await transaction.close()

    //   let resultToBeReturn = {}
    //   for (let i = 0; i < response.length; i++) {
    //     let res = formatResponse(response[i], queries[i].mapping)
    //     resultToBeReturn[queries[i].data] = res
    //   }
    //   return resultToBeReturn
    // }

    const iyp_api = {
      run,
      // runManyInOneSession,
      // formatResponse,
      // searchIYPInOneSession,
      // runManyInParallel,
      // runManyInOneSessionAndReturnAnObject
    }
    app.provide('iyp_api', iyp_api)
  }
}

export {
  IypApi
}